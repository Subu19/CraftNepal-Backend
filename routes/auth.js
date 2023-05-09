const authRouter = require("express").Router();
const passport = require("passport");
const config = require("../config.json");
authRouter.get("/login", passport.authenticate("discord"));

authRouter.get("/redirect", passport.authenticate("discord"), (req, res) => {
  res.redirect(config.frondend);
});
authRouter.post("/verify", (req, res) => {
  if (req.user) {
    res.send({
      id: req.user.discordId,
      username: req.user.username,
      avatar: req.user.avatar,
      isAdmin: req.user.isAdmin,
    });
  } else {
    res.send({ err: "hmm" });
  }
});
const verify = (req, res, next) => {
  if (req.user) next();
  else res.send(401);
};
module.exports = { authRouter, verify };
