import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    port: Number(process.env.SQL_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

export const mongoDB = mongoose.connect(process.env.URI || '');

// Verify connections quietly
pool.getConnection()
    .then(conn => conn.release())
    .catch(err => console.error('MySQL Connection Error:', err.message));
