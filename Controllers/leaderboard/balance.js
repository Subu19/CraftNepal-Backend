const { con } = require("../../utils/connection");

exports.getBalanceLeaderboard = async (req, res, next) => {
    try {
        con.query("SELECT player_name, money as value FROM s4_SMP_DB.eco_accounts LIMIT 100;", (err, result) => {
            if (err) res.send({ err: err, data: null });
            else res.send({ err: null, data: result });
        });
    } catch (err) {
        console.log(err);
        res.send({ err: "something went wrong", data: null });
    }
};
