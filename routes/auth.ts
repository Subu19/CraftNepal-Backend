import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import dotenv from "dotenv";

dotenv.config();

export const authRouter = express.Router();

authRouter.get("/login", passport.authenticate("discord"));

authRouter.get("/redirect", passport.authenticate("discord"), (req: Request, res: Response) => {
    res.redirect(process.env.FRONTEND as string);
});

authRouter.post("/verify", (req: Request, res: Response) => {
    if (req.user) {
        res.send({
            id: (req.user as any).discordId,
            username: (req.user as any).username,
            avatar: (req.user as any).avatar,
            isAdmin: (req.user as any).isAdmin,
        });
    } else {
        res.send({ err: "hmm" });
    }
});

export const verify = (req: Request, res: Response, next: NextFunction) => {
    if (req.user) next();
    else res.sendStatus(401);
};
