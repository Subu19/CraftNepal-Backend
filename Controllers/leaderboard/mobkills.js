const { con } = require("../../utils/connection");

exports.getMobkillLeaderboard = async (req, res, next) => {
  try {
    await con.query(
      "SELECT SUM(VALUE) as value,statz_players.playerName FROM statz_kills_mobs INNER JOIN statz_players on statz_players.uuid = statz_kills_mobs.uuid GROUP BY(statz_players.uuid) ORDER BY sum(value) DESC LIMIT 100;",
      (err, result) => {
        if (err) res.send({ err: err, data: null });
        else res.send({ err: null, data: result });
      }
    );
  } catch (err) {
    console.log(error);
    res.send({ err: "something went wrong", data: null });
  }
};
