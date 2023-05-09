const { con } = require("../../utils/connection");

exports.getDamageLeaderboard = async (req, res, next) => {
  try {
    await con.query(
      "SELECT statz_players.playerName, sum(value) as value FROM statz_damage_taken INNER JOIN statz_players on statz_players.uuid = statz_damage_taken.uuid GROUP BY(statz_damage_taken.uuid) ORDER BY sum(value) DESC LIMIT 100;",
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
