import "./utils/strategies/discord";
import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";

import apiRouter from "./routes/api";
import cors from "cors";
import { authRouter } from "./routes/auth";
import dotenv from "dotenv";
import { mongoDB } from "./utils/connection";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo";
import { Server } from "socket.io";
import http from "node:http";

dotenv.config();

const app = express();

const corsConfig = {
  origin: [
    process.env.FRONTEND as string,
    "https://craftnepal.net",
    "http://play.craftnepal.net",
    "http://52.187.54.155",
  ],
  credentials: true,
};

//initialize database
mongoDB
  .then(() => {
    console.log("Successfully connected to mongoDB");
  })
  .catch(() => {
    console.log("Failed to connect to mongodb");
  });

//initialize authentication
app.use(
  session({
    secret: "ggcraftnepal",
    cookie: {
      maxAge: 60000 * 60 * 24 * 7,
    },
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.URI }),
  }),
);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsConfig));
app.use(express.static("public"));

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  console.log("hi there");
  res.send("Welcome to craftnepal backend");
});

app.use("/auth", authRouter);

//api
app.use("/api", apiRouter);

//start socket
const server = http.createServer(app);
const io = new Server(server, { cors: corsConfig });
import socketHandler from "./Controllers/socket";
socketHandler(io);

server.listen(process.env.PORT || 3006, () => {
  console.log("Server started");
});
