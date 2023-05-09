const db = require("mysql");
const mongoose = require("mongoose");
const config = require("../config.json");

const con = db.createConnection({
  host: config.sqlhost,
  user: config.sqlusername,
  password: config.sqlpassword,
  database: config.sqlusername,
  port: 3306,
});

con.connect((err) => {
  if (err) console.log(err);
  else {
    console.log("Successfully connected to database");
  }
});

const mongoDB = mongoose.connect(config.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = { con, mongoDB };
