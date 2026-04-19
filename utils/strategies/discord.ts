import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { User } from "../models/User";
import dotenv from "dotenv";
import { request } from "undici";

dotenv.config();

passport.serializeUser((user: any, done: any) => {
    done(null, user.discordId);
});

passport.deserializeUser(async (discordId: string, done: any) => {
    try {
        const user = await User.findOne({ discordId });
        return user ? done(null, user) : done(null, null);
    } catch (err) {
        console.log(err);
        return done(err, null);
    }
});

passport.use(
    new DiscordStrategy(
        {
            clientID: process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
            callbackURL: "/auth/redirect",
            scope: ["identify", "guilds", "guilds.members.read"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            const { id, username, discriminator, avatar, guilds } = profile;

            let isAdmin = false;
            try {
                const userResult = await request("https://discord.com/api/users/@me/guilds/725033293636042773/member", {
                    headers: {
                        authorization: `Bearer ${accessToken}`,
                    },
                });
                const guildMember: any = await userResult.body.json();
                if (guildMember.roles) {
                    isAdmin = await checkAdminRole(guildMember.roles);
                }

                const findUser = await User.findOneAndUpdate(
                    { discordId: id },
                    {
                        discordTag: `${username}#${discriminator}`,
                        username,
                        avatar,
                        isAdmin: isAdmin,
                    }
                );
                if (findUser) {
                    console.log("found user");
                    return done(null, findUser);
                } else {
                    const newUser = await User.create({
                        discordId: id,
                        discordTag: `${username}#${discriminator}`,
                        username,
                        avatar,
                        isAdmin: isAdmin,
                    });

                    return done(null, newUser);
                }
            } catch (err) {
                console.log(err);
                return done(err, null);
            }
        }
    )
);

const checkAdminRole = (roles: string[]): Promise<boolean> => {
    let isAdmin = false;
    return new Promise((resolve) => {
        if (!roles || roles.length === 0) resolve(false);
        for (let i = 0; i < roles.length; i++) {
            const element = roles[i];
            if (element === process.env.ADMIN_ROLE || element === process.env.HELPER_ROLE) {
                isAdmin = true;
            }
            if (i === roles.length - 1) {
                resolve(isAdmin);
            }
        }
    });
};
