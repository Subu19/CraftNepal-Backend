const config = require("../config.json");
const { default: axios } = require("axios");
const { con } = require("../utils/connection");
exports.getStatz = async (req, res, next) => {
  try {
    const { username } = req.params;
    var statz = {
      err: null,
      data: {
        totalPlaytime: 0,
        playtime: [],
        kills: {
          player: "",
          mob: "",
          deaths: "",
        },
        blocks: {
          broken: "",
          placed: "",
        },
      },
    };

    //get playtime
    await fetchPlaytime(username)
      .then(async (res) => {
        if (res.length > 0) {
          const playtime = await calculatePlaytime(res);
          console.log(playtime);
          statz.data.totalPlaytime = playtime.totalPlaytime;
          statz.data.playtime = playtime.playtime;
        } else {
          statz.err = "cant find playtime";
        }
        // res.length > 0
        //   ? (statz.data.playtime = res)
        //   : (statz.err = "cant find playtime");
      })
      .catch((err) => {
        statz.data.playtime = null;
        console.log("cant get playtime");
      });

    //get player kills
    await fetchPlayerKills(username)
      .then((res) => {
        statz.data.kills.player = res.kills;
      })
      .catch((err) => {
        statz.data.kills.player = 0;
      });

    //get player deaths
    await fetchDeaths(username)
      .then((res) => {
        statz.data.kills.deaths = res.deaths;
      })
      .catch((err) => {
        statz.data.kills.deaths = 0;
      });
    //get mod kills
    await fetchMobKills(username)
      .then((res) => {
        statz.data.kills.mob = res.kills;
      })
      .catch((err) => {
        statz.data.kills.mob = 0;
      });
    //get blocks broken
    await fetchBlocksBroken(username)
      .then((res) => {
        statz.data.blocks.broken = res.blocks;
      })
      .catch((err) => {
        statz.data.blocks.broken = 0;
      });

    //get blocks broken
    await fetchBlocksPlaced(username)
      .then((res) => {
        statz.data.blocks.placed = res.blocks;
      })
      .catch((err) => {
        statz.data.blocks.placed = 0;
      });
    console.log(statz);
    res.send(statz);
  } catch (err) {
    console.log(err);
    res.send({ err: err });
  }
};
const calculatePlaytime = (data) => {
  return new Promise(async (resolve, reject) => {
    var p = {
      totalPlaytime: 0,
      playtime: [
        { value: 0, world: "world" },
        { value: 0, world: "world_nether" },
        { value: 0, world: "world_the_end" },
      ],
    };

    for (let i = 0; i < data.length; i++) {
      const w = data[i];
      if (w.world == "world") {
        p.playtime[0].value += w.value;
      } else if (w.world == "world_nether") {
        p.playtime[1].value += w.value;
      } else if (w.world == "world_the_end") {
        p.playtime[2].value += w.value;
      } else {
        p.playtime.push({ value: w.value, world: w.world });
      }
      p.totalPlaytime += w.value;
      if (i == data.length - 1) resolve(p);
    }
  });
};
const fetchBlocksBroken = (uuid) => {
  return new Promise(async (resolve, reject) => {
    //get player kills!
    con.query(
      `SELECT sum(value) as "blocks" FROM statz_blocks_broken INNER JOIN statz_players on statz_players.uuid = statz_blocks_broken.uuid WHERE statz_players.playerName="${uuid}"`,
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0]);
        }
      }
    );
  });
};
const fetchBlocksPlaced = (uuid) => {
  return new Promise(async (resolve, reject) => {
    //get player kills!
    con.query(
      `SELECT sum(value) as "blocks" FROM statz_blocks_placed INNER JOIN statz_players on statz_players.uuid = statz_blocks_placed.uuid WHERE statz_players.playerName="${uuid}"`,
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0]);
        }
      }
    );
  });
};

const fetchPlayerKills = (uuid) => {
  return new Promise(async (resolve, reject) => {
    //get player kills!
    con.query(
      `SELECT sum(value) as "kills" FROM statz_kills_players INNER JOIN statz_players on statz_players.uuid = statz_kills_players.uuid WHERE statz_players.playerName="${uuid}"`,
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0]);
        }
      }
    );
  });
};
const fetchMobKills = (uuid) => {
  return new Promise(async (resolve, reject) => {
    //get player mobkills
    con.query(
      `SELECT sum(value) as "kills" FROM statz_kills_mobs INNER JOIN statz_players on statz_players.uuid = statz_kills_mobs.uuid WHERE statz_players.playerName="${uuid}"`,
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0]);
        }
      }
    );
  });
};
const fetchDeaths = (uuid) => {
  return new Promise(async (resolve, reject) => {
    //get player deaths
    con.query(
      `SELECT sum(value) as "deaths" FROM statz_deaths INNER JOIN statz_players on statz_players.uuid = statz_deaths.uuid WHERE statz_players.playerName="${uuid}"`,
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0]);
        }
      }
    );
  });
};
const fetchPlaytime = (uuid) => {
  return new Promise(async (resolve, reject) => {
    //get playtime of every world!
    con.query(
      `SELECT value,world FROM statz_time_played INNER JOIN statz_players on statz_players.uuid = statz_time_played.uuid WHERE statz_players.playerName="${uuid}";`,
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          console.log(result);
          resolve(result);
        }
      }
    );
  });
};

const getUUID = async (name) => {
  const uuid = await axios
    .get("http://tools.glowingmines.eu/convertor/nick/" + name)
    .then((res) => {
      if (res.data) {
        console.log("asked");
        return res.data.offlinesplitteduuid;
      } else
        return { error: "something went wrong", details: "cant find uuid" };
    })
    .catch((err) => {
      return { error: "Something went wrong", details: err };
    });
  return uuid;
};
