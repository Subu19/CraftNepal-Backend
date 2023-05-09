const passport = require("passport");
const DiscordStrategies = require("passport-discord");
const User = require("../models/User");
const config = require("../../config.json");
const { request } = require("undici");

passport.serializeUser((user, done) => {
  done(null, user.discordId);
});
passport.deserializeUser(async (discordId, done) => {
  try {
    const user = await User.findOne({ discordId });
    return user ? done(null, user) : done(null, null);
  } catch (err) {
    console.log(err);
    return done(err, null);
  }
});

passport.use(
  new DiscordStrategies(
    {
      clientID: config.discord.clientId,
      clientSecret: config.discord.clientSecret,
      callbackURL: "/auth/redirect",
      scope: ["identify", "guilds", "guilds.members.read"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, username, discriminator, avatar, guilds } = profile;

      //check if the user in the guild and is admin
      var isAdmin = false;
      try {
        const userResult = await request(
          "https://discord.com/api/users/@me/guilds/725033293636042773/member",
          {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const guildMember = await userResult.body.json();
        if (guildMember.roles) {
          isAdmin = await checkAdminRole(guildMember.roles);
        }
        /////////////////////////////////////////////

        ////////////////// check if the user is new or now//////////////
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
          /////////////////// create new user /////////////////
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

const checkAdminRole = (roles) => {
  var isAdmin = false;
  return new Promise((resolve, reject) => {
    for (let i = 0; i < roles.length; i++) {
      const element = roles[i];
      if (element == config.adminRole || element == config.helperRole) {
        isAdmin = true;
      }
      if (i == roles.length - 1) {
        resolve(isAdmin);
      }
    }
  });
};
