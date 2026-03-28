import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import dotenv from 'dotenv';
import { IUser } from '../utils/models/User';

dotenv.config();

export const authRouter = Router();

authRouter.get("/login", passport.authenticate("discord"));

authRouter.get("/redirect", passport.authenticate("discord"), (_req: Request, res: Response) => {
    res.redirect(process.env.FRONTEND || "http://localhost:3000");
});

authRouter.post("/verify", (req: Request, res: Response) => {
    const user = req.user as IUser | undefined;
    if (user) {
        res.json({
            id: user.discordId,
            username: user.username,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
        });
    } else {
        res.status(401).json({ error: "Not authenticated" });
    }
});

export const verify = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
};
