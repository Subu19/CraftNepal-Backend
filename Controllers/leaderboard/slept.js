const { con } = require("../../utils/connection");

exports.getSleepingLeaderboard = async (req, res, next) => {
  try {
    con.query(
      "SELECT statz_players.playerName, sum(value) as value FROM statz_entered_beds INNER JOIN statz_players on statz_players.uuid = statz_entered_beds.uuid GROUP BY(statz_entered_beds.uuid) ORDER BY sum(value) DESC LIMIT 100;",
      (err, result) => {
        if (err) res.send({ err: err, data: null });
        else res.send({ err: null, data: result });
      }
    );
  } catch (err) {
    console.log(err);
    res.send({ err: "something went wrong", data: null });
  }
};
