const { con } = require("../../utils/connection");

exports.getDeathsLeaderboard = async (req, res, next) => {
  try {
    await con.query(
      "SELECT statz_players.playerName, sum(value) as value FROM `statz_deaths` INNER JOIN statz_players on statz_players.uuid = statz_deaths.uuid GROUP BY(statz_deaths.uuid) ORDER BY sum(value) DESC LIMIT 100;",
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
