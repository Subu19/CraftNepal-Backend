const { con } = require("../../utils/connection");

exports.getTop10 = async (req, res, next) => {
  try {
    con.query(
      "SELECT SUM(VALUE) as value,statz_players.playerName FROM statz_time_played INNER JOIN statz_players on statz_players.uuid = statz_time_played.uuid GROUP BY(statz_players.uuid) ORDER BY sum(value) DESC LIMIT 10;",
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
