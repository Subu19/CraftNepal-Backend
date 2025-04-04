require("./utils/strategies/discord");
const express = require("express");
const bodyParser = require("body-parser");

const router = require("./routes/api");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const { authRouter } = require("./routes/auth");
require("dotenv").config();
const { con, mongoDB } = require("./utils/connection");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const socket = require("socket.io");
const http = require("node:http");

const corsConfig = {
	origin: [
		process.env.FRONTEND,
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
app.use(bodyParser.urlencoded());
app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsConfig));
app.use(express.static("public"));
app.get("/", (req, res, next) => {
	res.send("Welcome to craftnepal backend");
});

app.use("/auth", authRouter);

//api
app.use("/api", router);

//start socket
const server = http.createServer(app);
const io = socket(server);
const socketContainner = require("./Controllers/socket")(io);

server.listen(process.env.PORT || 3006, () => {
	console.log("Server started");
});
