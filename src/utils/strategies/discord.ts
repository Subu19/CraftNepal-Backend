import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import User, { IUser } from '../models/User';
import dotenv from 'dotenv';
import { request } from 'undici';

dotenv.config();

passport.serializeUser((user: any, done) => {
    done(null, user.discordId);
});

passport.deserializeUser(async (discordId: string, done) => {
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
            clientID: process.env.DISCORD_CLIENT_ID || '',
            clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
            callbackURL: "/auth/redirect",
            scope: ["identify", "guilds", "guilds.members.read"],
        },
        async (accessToken, refreshToken, profile, done) => {
            const { id, username, discriminator, avatar } = profile;

            //check if the user in the guild and is admin
            let isAdmin = false;
            try {
                // Optimization note: This request happens on every login.
                // It is kept for security to always have fresh roles on login.
                const userResult = await request("https://discord.com/api/users/@me/guilds/725033293636042773/member", {
                    headers: {
                        authorization: `Bearer ${accessToken}`,
                    },
                });

                if (userResult.statusCode === 200) {
                    const guildMember = await userResult.body.json() as any;
                    if (guildMember.roles) {
                        isAdmin = await checkAdminRole(guildMember.roles);
                    }
                }

                ////////////////// check if the user is new or now//////////////
                const findUser = await User.findOneAndUpdate(
                    { discordId: id },
                    {
                        discordTag: `${username}#${discriminator}`,
                        username,
                        avatar: avatar || '',
                        isAdmin: isAdmin,
                    },
                    { new: true } // Return the updated document
                );

                if (findUser) {
                    return done(null, findUser);
                } else {
                    /////////////////// create new user /////////////////
                    const newUser = await User.create({
                        discordId: id,
                        discordTag: `${username}#${discriminator}`,
                        username,
                        avatar: avatar || '',
                        isAdmin: isAdmin,
                    });

                    return done(null, newUser);
                }
            } catch (err) {
                console.log(err);
                return done(err as any, undefined);
            }
        }
    )
);

const checkAdminRole = (roles: string[]): Promise<boolean> => {
    return new Promise((resolve) => {
        let isAdmin = false;
        for (const role of roles) {
            if (role == process.env.ADMIN_ROLE || role == process.env.HELPER_ROLE) {
                isAdmin = true;
                break;
            }
        }
        resolve(isAdmin);
    });
};
