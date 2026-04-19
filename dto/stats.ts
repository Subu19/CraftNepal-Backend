// ── Raw Minecraft file shapes ──

export interface RawMinecraftStats {
  stats: Record<string, Record<string, number>>;
  DataVersion: number;
}

export interface UserCacheEntry {
  uuid: string;
  name: string;
  expiresOn: string;
}

// ── Stat key format: "category/stat" ──
// Example: "minecraft:custom/minecraft:play_time"
//          "minecraft:mined/minecraft:stone"

// ── Aggregated / shaped data ──

export interface LeaderboardEntry {
  rank: number;
  uuid: string;
  name: string;
  value: number;
}

export interface FeaturedLeaderboard {
  key: string;          // e.g. "minecraft:custom/minecraft:play_time"
  label: string;        // e.g. "Play Time"
  unit?: string;        // e.g. "ticks", "cm"
  entries: LeaderboardEntry[];  // top 10
}

export interface PlayerOverview {
  playTime: number;
  mobKills: number;
  deaths: number;
  totalBlocksMined: number;
  totalMobsKilled: number;
  distanceWalked: number;
  distanceFlown: number;
  jumps: number;
  damageDealt: number;
  timesLoggedOut: number;
}

export interface PlayerSummary {
  uuid: string;
  name: string;
  overview: PlayerOverview;
  stats: {
    custom: Record<string, number>;
    mined: Record<string, number>;
    used: Record<string, number>;
    picked_up: Record<string, number>;
    dropped: Record<string, number>;
    killed: Record<string, number>;
    killed_by: Record<string, number>;
    crafted: Record<string, number>;
    broken: Record<string, number>;
  };
}

export interface PlayerListEntry {
  uuid: string;
  name: string;
}

export interface StatKeyEntry {
  key: string;      // "minecraft:custom/minecraft:play_time"
  category: string; // "minecraft:custom"
  stat: string;     // "minecraft:play_time"
}
