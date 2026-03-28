import { Request, Response } from 'express';
import { pool } from '../utils/connection';
import { RowDataPacket } from 'mysql2';

const TABLE_MAP: Record<string, string> = {
    damage: 'statz_damage_taken',
    deaths: 'statz_deaths',
    food: 'statz_food_eaten',
    mobs: 'statz_kills_mobs',
    players: 'statz_kills_players',
    playtime: 'statz_time_played',
    beds: 'statz_entered_beds',
    trades: 'statz_villager_trades'
};

const fetchStatzLeaderboard = async (tableKey: string, limit: number = 100) => {
    const tableName = TABLE_MAP[tableKey];
    if (!tableName) throw new Error("Invalid leaderboard type");

    const sql = `
        SELECT statz_players.playerName, sum(value) as value 
        FROM ?? 
        INNER JOIN statz_players on statz_players.uuid = ??.uuid 
        GROUP BY ??.uuid 
        ORDER BY sum(value) DESC 
        LIMIT ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [tableName, tableName, tableName, limit]);
    return rows;
};

const fetchBalanceLeaderboard = async (limit: number = 100) => {
    const sql = `SELECT player_name as playerName, money as value FROM s4_SMP_DB.eco_accounts ORDER BY value DESC LIMIT ?`;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [limit]);
    return rows;
};

const handleLeaderboardRequest = async (res: Response, fetcher: () => Promise<any>) => {
    try {
        const data = await fetcher();
        res.json({ error: null, data });
    } catch (err) {
        res.status(500).json({ error: "Leaderboard fetch failed", data: null });
    }
};

export const getDamageLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('damage'));

export const getDeathsLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('deaths'));

export const getHungryLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('food'));

export const getMobkillLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('mobs'));

export const getPlayerKillsLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('players'));

export const getPlaytimeLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('playtime'));

export const getSleepingLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('beds'));

export const getTradingLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('trades'));

export const getTop15 = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchStatzLeaderboard('playtime', 15));

export const getBalanceLeaderboard = (_req: Request, res: Response) =>
    handleLeaderboardRequest(res, () => fetchBalanceLeaderboard());
