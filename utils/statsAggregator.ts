import fs from "node:fs";
import path from "node:path";
import type {
  RawMinecraftStats,
  UserCacheEntry,
  LeaderboardEntry,
  FeaturedLeaderboard,
  PlayerOverview,
  PlayerSummary,
  PlayerListEntry,
  StatKeyEntry,
} from "../dto/stats";

// ── Featured stats definition ──

interface FeaturedStatDef {
  key: string;
  label: string;
  unit?: string;
}

const FEATURED_STATS: FeaturedStatDef[] = [
  {
    key: "minecraft:custom/minecraft:play_time",
    label: "Play Time",
    unit: "ticks",
  },
  { key: "minecraft:custom/minecraft:mob_kills", label: "Mob Kills" },
  { key: "minecraft:custom/minecraft:deaths", label: "Deaths" },
  {
    key: "minecraft:custom/minecraft:walk_one_cm",
    label: "Distance Walked",
    unit: "cm",
  },
  {
    key: "minecraft:custom/minecraft:fly_one_cm",
    label: "Distance Flown",
    unit: "cm",
  },
  { key: "minecraft:custom/minecraft:jump", label: "Jumps" },
  { key: "minecraft:custom/minecraft:damage_dealt", label: "Damage Dealt" },
  { key: "minecraft:custom/minecraft:leave_game", label: "Times Logged Out" },
  // Aggregate stats (computed separately)
  { key: "_aggregate/total_blocks_mined", label: "Total Blocks Mined" },
  { key: "_aggregate/total_mobs_killed", label: "Total Mobs Killed" },
];

const LEADERBOARD_LIMIT = 100;
const OVERVIEW_LIMIT = 10;

// ── Paths ──

const SMP_DATA_DIR = path.resolve(__dirname, "..", "smp-data");
const STATS_DIR = path.join(SMP_DATA_DIR, "stats");
const USERCACHE_PATH = path.join(SMP_DATA_DIR, "usercache.json");

// ── Aggregator class ──

class StatsAggregator {
  // Caches
  private _playerSummaries = new Map<string, PlayerSummary>();
  private _nameToUuid = new Map<string, string>(); // lowercase name → uuid
  private _leaderboards = new Map<string, LeaderboardEntry[]>();
  private _overview: FeaturedLeaderboard[] = [];
  private _playerList: PlayerListEntry[] = [];
  private _statKeys: StatKeyEntry[] = [];
  private _lastUpdated: Date = new Date(0);
  private _intervalHandle: ReturnType<typeof setInterval> | null = null;

  // ── Public getters ──

  get playerSummaries(): Map<string, PlayerSummary> {
    return this._playerSummaries;
  }

  get lastUpdated(): Date {
    return this._lastUpdated;
  }

  get overview(): FeaturedLeaderboard[] {
    return this._overview;
  }

  get playerList(): PlayerListEntry[] {
    return this._playerList;
  }

  get statKeys(): StatKeyEntry[] {
    return this._statKeys;
  }

  getLeaderboard(statKey: string): LeaderboardEntry[] | undefined {
    return this._leaderboards.get(statKey);
  }

  getPlayerByUuid(uuid: string): PlayerSummary | undefined {
    return this._playerSummaries.get(uuid);
  }

  getPlayerByName(name: string): PlayerSummary | undefined {
    const uuid = this._nameToUuid.get(name.toLowerCase());
    return uuid ? this._playerSummaries.get(uuid) : undefined;
  }

  // ── Lifecycle ──

  start(intervalMs: number = 60_000): void {
    console.log(`[StatsAggregator] Starting (interval: ${intervalMs}ms)`);
    this.aggregate(); // run immediately
    this._intervalHandle = setInterval(() => this.aggregate(), intervalMs);
  }

  stop(): void {
    if (this._intervalHandle) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = null;
      console.log("[StatsAggregator] Stopped");
    }
  }

  // ── Core aggregation ──

  private aggregate(): void {
    try {
      const startTime = Date.now();

      // 1. Read user cache for UUID ↔ name mapping
      const uuidToName = this.readUserCache();

      // 2. Read all stat files and build player summaries
      const summaries = new Map<string, PlayerSummary>();
      const nameToUuid = new Map<string, string>();
      const allStatKeys = new Set<string>();

      // Aggregate trackers for computed leaderboards
      const aggregateTotalMined = new Map<string, number>();
      const aggregateTotalKilled = new Map<string, number>();

      const statFiles = this.getStatFiles();

      for (const filePath of statFiles) {
        try {
          const uuid = path.basename(filePath, ".json");
          const name = uuidToName.get(uuid) ?? uuid;
          const raw = this.readStatFile(filePath);
          if (!raw) continue;

          const summary = this.buildPlayerSummary(uuid, name, raw, allStatKeys);
          summaries.set(uuid, summary);
          nameToUuid.set(name.toLowerCase(), uuid);

          // Compute aggregate values for this player
          const totalMined = Object.values(summary.stats.mined).reduce(
            (a, b) => a + b,
            0,
          );
          const totalKilled = Object.values(summary.stats.killed).reduce(
            (a, b) => a + b,
            0,
          );
          aggregateTotalMined.set(uuid, totalMined);
          aggregateTotalKilled.set(uuid, totalKilled);
        } catch (err) {
          console.error(`[StatsAggregator] Error processing ${filePath}:`, err);
        }
      }

      // 3. Build leaderboards for every stat key
      const leaderboards = this.buildLeaderboards(
        summaries,
        allStatKeys,
        uuidToName,
      );

      // 4. Add aggregate leaderboards
      leaderboards.set(
        "_aggregate/total_blocks_mined",
        this.buildAggregateLeaderboard(aggregateTotalMined, uuidToName),
      );
      leaderboards.set(
        "_aggregate/total_mobs_killed",
        this.buildAggregateLeaderboard(aggregateTotalKilled, uuidToName),
      );

      // 5. Build overview from featured stats
      const overview = this.buildOverview(leaderboards);

      // 6. Build stat keys list
      const statKeys = this.buildStatKeysList(allStatKeys);

      // 7. Build player list
      const playerList: PlayerListEntry[] = [];
      for (const [uuid, summary] of summaries) {
        playerList.push({ uuid, name: summary.name });
      }

      // 8. Swap caches atomically
      this._playerSummaries = summaries;
      this._nameToUuid = nameToUuid;
      this._leaderboards = leaderboards;
      this._overview = overview;
      this._playerList = playerList;
      this._statKeys = statKeys;
      this._lastUpdated = new Date();

      const elapsed = Date.now() - startTime;
      console.log(
        `[StatsAggregator] Aggregated ${summaries.size} players, ${leaderboards.size} leaderboards in ${elapsed}ms`,
      );
    } catch (err) {
      console.error("[StatsAggregator] Aggregation failed:", err);
    }
  }

  // ── File I/O helpers ──

  private readUserCache(): Map<string, string> {
    const uuidToName = new Map<string, string>();
    try {
      const raw = fs.readFileSync(USERCACHE_PATH, "utf-8");
      const entries: UserCacheEntry[] = JSON.parse(raw);
      // Reverse so that earlier entries (more recent) take priority for duplicate UUIDs
      for (const entry of entries) {
        if (!uuidToName.has(entry.uuid)) {
          uuidToName.set(entry.uuid, entry.name);
        }
      }
    } catch (err) {
      console.error("[StatsAggregator] Failed to read usercache.json:", err);
    }
    return uuidToName;
  }

  private getStatFiles(): string[] {
    try {
      const entries = fs.readdirSync(STATS_DIR);
      return entries
        .filter((f) => f.endsWith(".json"))
        .map((f) => path.join(STATS_DIR, f));
    } catch (err) {
      console.error("[StatsAggregator] Failed to read stats directory:", err);
      return [];
    }
  }

  private readStatFile(filePath: string): RawMinecraftStats | null {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as RawMinecraftStats;
    } catch (err) {
      console.error(`[StatsAggregator] Failed to parse ${filePath}:`, err);
      return null;
    }
  }

  // ── Data shaping ──

  private buildPlayerSummary(
    uuid: string,
    name: string,
    raw: RawMinecraftStats,
    allStatKeys: Set<string>,
  ): PlayerSummary {
    const stats = raw.stats;

    // Extract each category (default to empty object)
    const custom = stats["minecraft:custom"] ?? {};
    const mined = stats["minecraft:mined"] ?? {};
    const used = stats["minecraft:used"] ?? {};
    const picked_up = stats["minecraft:picked_up"] ?? {};
    const dropped = stats["minecraft:dropped"] ?? {};
    const killed = stats["minecraft:killed"] ?? {};
    const killed_by = stats["minecraft:killed_by"] ?? {};
    const crafted = stats["minecraft:crafted"] ?? {};
    const broken = stats["minecraft:broken"] ?? {};

    // Register all stat keys
    const categories: Record<string, Record<string, number>> = {
      "minecraft:custom": custom,
      "minecraft:mined": mined,
      "minecraft:used": used,
      "minecraft:picked_up": picked_up,
      "minecraft:dropped": dropped,
      "minecraft:killed": killed,
      "minecraft:killed_by": killed_by,
      "minecraft:crafted": crafted,
      "minecraft:broken": broken,
    };

    for (const [category, entries] of Object.entries(categories)) {
      for (const stat of Object.keys(entries)) {
        allStatKeys.add(`${category}/${stat}`);
      }
    }

    // Build overview
    const overview: PlayerOverview = {
      playTime: custom["minecraft:play_time"] ?? 0,
      mobKills: custom["minecraft:mob_kills"] ?? 0,
      deaths: custom["minecraft:deaths"] ?? 0,
      totalBlocksMined: Object.values(mined).reduce((a, b) => a + b, 0),
      totalMobsKilled: Object.values(killed).reduce((a, b) => a + b, 0),
      distanceWalked: custom["minecraft:walk_one_cm"] ?? 0,
      distanceFlown: custom["minecraft:fly_one_cm"] ?? 0,
      jumps: custom["minecraft:jump"] ?? 0,
      damageDealt: custom["minecraft:damage_dealt"] ?? 0,
      timesLoggedOut: custom["minecraft:leave_game"] ?? 0,
    };

    return {
      uuid,
      name,
      overview,
      stats: {
        custom,
        mined,
        used,
        picked_up,
        dropped,
        killed,
        killed_by,
        crafted,
        broken,
      },
    };
  }

  private buildLeaderboards(
    summaries: Map<string, PlayerSummary>,
    allStatKeys: Set<string>,
    uuidToName: Map<string, string>,
  ): Map<string, LeaderboardEntry[]> {
    const leaderboards = new Map<string, LeaderboardEntry[]>();

    for (const compositeKey of allStatKeys) {
      const [category, stat] = compositeKey.split("/");
      const entries: { uuid: string; name: string; value: number }[] = [];

      for (const [uuid, summary] of summaries) {
        // Map category to the summary field
        const categoryKey = category.replace(
          "minecraft:",
          "",
        ) as keyof PlayerSummary["stats"];
        const categoryStats = summary.stats[categoryKey];
        if (categoryStats && stat in categoryStats) {
          entries.push({
            uuid,
            name: summary.name,
            value: categoryStats[stat],
          });
        }
      }

      // Sort descending, assign ranks, limit
      entries.sort((a, b) => b.value - a.value);
      const ranked: LeaderboardEntry[] = entries
        .slice(0, LEADERBOARD_LIMIT)
        .map((e, i) => ({
          rank: i + 1,
          uuid: e.uuid,
          name: e.name,
          value: e.value,
        }));

      if (ranked.length > 0) {
        leaderboards.set(compositeKey, ranked);
      }
    }

    return leaderboards;
  }

  private buildAggregateLeaderboard(
    aggregateMap: Map<string, number>,
    uuidToName: Map<string, string>,
  ): LeaderboardEntry[] {
    const entries = Array.from(aggregateMap.entries())
      .map(([uuid, value]) => ({
        uuid,
        name: uuidToName.get(uuid) ?? uuid,
        value,
      }))
      .filter((e) => e.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, LEADERBOARD_LIMIT)
      .map((e, i) => ({ rank: i + 1, ...e }));

    return entries;
  }

  private buildOverview(
    leaderboards: Map<string, LeaderboardEntry[]>,
  ): FeaturedLeaderboard[] {
    const overview: FeaturedLeaderboard[] = [];

    for (const def of FEATURED_STATS) {
      const lb = leaderboards.get(def.key);
      if (lb) {
        overview.push({
          key: def.key,
          label: def.label,
          unit: def.unit,
          entries: lb.slice(0, OVERVIEW_LIMIT),
        });
      }
    }

    return overview;
  }

  private buildStatKeysList(allStatKeys: Set<string>): StatKeyEntry[] {
    const keys: StatKeyEntry[] = [];

    for (const compositeKey of allStatKeys) {
      const slashIndex = compositeKey.indexOf("/");
      const category = compositeKey.substring(0, slashIndex);
      const stat = compositeKey.substring(slashIndex + 1);
      keys.push({ key: compositeKey, category, stat });
    }

    // Sort by category then stat
    keys.sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.stat.localeCompare(b.stat),
    );

    return keys;
  }
}

// ── Singleton export ──

export const statsAggregator = new StatsAggregator();
