const { con } = require("../../utils/connection");

exports.getTradingLeaderboard = async (req, res, next) => {
  try {
    con.query(
      "SELECT statz_players.playerName, sum(value) as value FROM statz_villager_trades INNER JOIN statz_players on statz_players.uuid = statz_villager_trades.uuid GROUP BY(statz_villager_trades.uuid) ORDER BY sum(value) DESC LIMIT 100;",
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
