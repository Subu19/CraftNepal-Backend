import { pool } from './connection';
import crypto from 'crypto';

const players = [
    "ShadowSlayer", "MinerPro_99", "DragonBorn_NP", "NepalWarrior", "CraftKing",
    "NoobMaster69", "RedstoneEngineer", "DiamondDigger", "SkyBlocker", "EnderHunter",
    "GorkhaliGamer", "Prakash_OP", "HimalayanHunter", "KathmanduKnight", "EverestExplorer",
    "SherpaBuilder", "BuddhaBless", "DalBhatPower", "MomoLover", "TeaTime"
];

const TABLES = [
    'statz_damage_taken',
    'statz_deaths',
    'statz_food_eaten',
    'statz_kills_mobs',
    'statz_kills_players',
    'statz_time_played',
    'statz_entered_beds',
    'statz_villager_trades',
    'statz_blocks_broken',
    'statz_blocks_placed'
];

const WORLDS = ["world", "world_nether", "world_the_end"];

async function seedStats() {
    try {
        console.log("Connecting to MySQL for seeding stats...");

        // 1. Create tables if they don't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS statz_players (
                uuid VARCHAR(36) PRIMARY KEY,
                playerName VARCHAR(255) NOT NULL
            )
        `);

        for (const table of TABLES) {
            let extraCols = "";
            if (table === 'statz_time_played') {
                extraCols = ", world VARCHAR(50) DEFAULT 'world'";
            }
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${table} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    uuid VARCHAR(36) NOT NULL,
                    value INT DEFAULT 0
                    ${extraCols}
                )
            `);
        }

        // Also handle eco_accounts (mocking the structure from the query)
        // Note: The query uses s4_SMP_DB.eco_accounts, so we might need to create s4_SMP_DB if possible or just use the current DB.
        // For simplicity during testing, we'll create it in the current DB if s4_SMP_DB isn't accessible.
        await pool.query(`
            CREATE TABLE IF NOT EXISTS eco_accounts (
                player_name VARCHAR(255) PRIMARY KEY,
                money DOUBLE DEFAULT 0
            )
        `);

        console.log("Tables ensured.");

        // 2. Clear existing test data
        // For safety, only clear if they have specific names or just append. 
        // Let's clear these specific 20 players if they exist.
        for (const name of players) {
            const [rows]: any = await pool.query("SELECT uuid FROM statz_players WHERE playerName = ?", [name]);
            if (rows.length > 0) {
                const uuid = rows[0].uuid;
                for (const table of TABLES) {
                    await pool.query(`DELETE FROM ${table} WHERE uuid = ?`, [uuid]);
                }
                await pool.query("DELETE FROM statz_players WHERE uuid = ?", [uuid]);
                await pool.query("DELETE FROM eco_accounts WHERE player_name = ?", [name]);
            }
        }

        // 3. Insert new data
        for (const name of players) {
            const uuid = crypto.randomUUID();
            await pool.query("INSERT INTO statz_players (uuid, playerName) VALUES (?, ?)", [uuid, name]);

            // Random stats
            for (const table of TABLES) {
                if (table === 'statz_time_played') {
                    // Split playtime across worlds
                    for (const world of WORLDS) {
                        const val = Math.floor(Math.random() * 5000) + 100;
                        await pool.query("INSERT INTO statz_time_played (uuid, value, world) VALUES (?, ?, ?)", [uuid, val, world]);
                    }
                } else {
                    const val = Math.floor(Math.random() * 1000);
                    await pool.query(`INSERT INTO ${table} (uuid, value) VALUES (?, ?)`, [uuid, val]);
                }
            }

            // Random money
            const money = Math.floor(Math.random() * 1000000) / 100;
            await pool.query("INSERT INTO eco_accounts (player_name, money) VALUES (?, ?)", [name, money]);
        }

        console.log("Successfully seeded 20 players with stats and balance.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding stats:", error);
        process.exit(1);
    }
}

seedStats();
