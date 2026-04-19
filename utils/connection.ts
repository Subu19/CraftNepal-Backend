import mysql from "mysql2";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const con = mysql.createPool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  database: process.env.SQL_DATABASE,
  port: parseInt(process.env.SQL_PORT || "3306"),
});

export const mongoDB = mongoose.connect(process.env.URI as string);
