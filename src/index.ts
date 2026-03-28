import './utils/strategies/discord'; 
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import apiRouter from './routes/api';
import { authRouter } from './routes/auth';
import { mongoDB } from './utils/connection'; 
import socketController from './Controllers/socket';

dotenv.config();

const app: Express = express();

// Security: Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resource sharing (images)
}));

// Security: Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true, 
    legacyHeaders: false,
});
app.use(limiter);

const corsConfig = {
    origin: [
        process.env.FRONTEND || "http://localhost:3000",
        "http://play.craftnepal.net", 
        // Add other trusted domains here
    ],
    credentials: true,
};

app.use(cors(corsConfig));

// Database connection check
mongoDB.catch(err => console.error("MongoDB Connection Failed:", err));

// Session Setup
app.use(
    session({
        secret: process.env.SESSION_SECRET || "ggcraftnepal_fallback_secret",
        cookie: {
            maxAge: 604800000, // 7 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        },
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.URI || '' }),
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// Static Files
app.use(express.static(path.join(process.cwd(), "public")));

// Routes
app.get("/", (_req: Request, res: Response) => {
    res.send("CraftNepal Backend Active");
});

app.use("/auth", authRouter);
app.use("/api", apiRouter);

// Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsConfig 
});

socketController(io);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
