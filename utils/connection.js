const db = require("mysql2");
const mongoose = require("mongoose");
require("dotenv").config();

const con = db.createPool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    database: process.env.SQL_DATABASE,
    port: process.env.SQL_PORT || 3306, // Default to 3306 if SQL_PORT is not set
});

// con.connect((err) => {
//   if (err) console.log(err);
//   else {
//     console.log("Successfully connected to database");
//   }
// });

const mongoDB = mongoose.connect(process.env.URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

module.exports = { con, mongoDB };
