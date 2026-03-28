import { Request, Response } from 'express';
import { pool } from '../utils/connection';
import { RowDataPacket } from 'mysql2';

interface IStatz {
    error: string | null;
    data: {
        playerName: string;
        totalPlaytime: number;
        playtime: { value: number; world: string }[];
        kills: {
            player: number;
            mob: number;
            deaths: number;
        };
        blocks: {
            broken: number;
            placed: number;
        };
    };
}

const runQuery = async (sql: string, params: any[]) => {
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows;
};

const fetchStat = async (table: string, username: string, column: string = "value", alias: string = "val") => {
    const sql = `
        SELECT sum(${column}) as "${alias}" 
        FROM ?? 
        INNER JOIN statz_players on statz_players.uuid = ??.uuid 
        WHERE statz_players.playerName = ?`;
    const rows = await runQuery(sql, [table, table, username]);
    return (rows[0] as any)?.[alias] || 0;
};

const fetchPlaytime = async (username: string) => {
    const sql = `
        SELECT value, world 
        FROM statz_time_played 
        INNER JOIN statz_players on statz_players.uuid = statz_time_played.uuid 
        WHERE statz_players.playerName = ?`;
    return await runQuery(sql, [username]);
};

export const getStatz = async (req: Request, res: Response) => {
    const { username } = req.params;

    try {
        // First check if player exists case-insensitively
        const players = await runQuery("SELECT playerName FROM statz_players WHERE LOWER(playerName) = LOWER(?)", [username]);

        if (!players || players.length === 0) {
            return res.json({
                error: "Player Not found, make sure the capitalization is correct or smtn",
                data: null
            });
        }

        const correctUsername = players[0].playerName;

        const statz: IStatz = {
            error: null,
            data: {
                playerName: correctUsername,
                totalPlaytime: 0,
                playtime: [],
                kills: { player: 0, mob: 0, deaths: 0 },
                blocks: { broken: 0, placed: 0 },
            },
        };

        const [
            playtimeRows,
            playerKills,
            deaths,
            mobKills,
            blocksBroken,
            blocksPlaced
        ] = await Promise.all([
            fetchPlaytime(correctUsername),
            fetchStat('statz_kills_players', correctUsername, 'value', 'kills'),
            fetchStat('statz_deaths', correctUsername, 'value', 'deaths'),
            fetchStat('statz_kills_mobs', correctUsername, 'value', 'kills'),
            fetchStat('statz_blocks_broken', correctUsername, 'value', 'blocks'),
            fetchStat('statz_blocks_placed', correctUsername, 'value', 'blocks')
        ]);

        // Process Playtime
        const pRows = playtimeRows as any[];
        statz.data.playtime = [
            { value: 0, world: "world" },
            { value: 0, world: "world_nether" },
            { value: 0, world: "world_the_end" },
        ];

        pRows.forEach(w => {
            statz.data.totalPlaytime += w.value;
            if (w.world === "world") statz.data.playtime[0].value += w.value;
            else if (w.world === "world_nether") statz.data.playtime[1].value += w.value;
            else if (w.world === "world_the_end") statz.data.playtime[2].value += w.value;
            else statz.data.playtime.push({ value: w.value, world: w.world });
        });

        statz.data.kills.player = Number(playerKills);
        statz.data.kills.deaths = Number(deaths);
        statz.data.kills.mob = Number(mobKills);
        statz.data.blocks.broken = Number(blocksBroken);
        statz.data.blocks.placed = Number(blocksPlaced);

        res.json(statz);

    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ error: "Failed to fetch stats", data: null });
    }
};
