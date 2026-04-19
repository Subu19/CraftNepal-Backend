import { Request, Response, NextFunction } from "express";
import { statsAggregator } from "../utils/statsAggregator";

/**
 * GET /api/leaderboard/overview
 * Returns top 10 across all featured stats (for homepage widget).
 */
export const getOverview = (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = statsAggregator.overview;

    res.json({
      err: false,
      data: {
        featured: overview,
        lastUpdated: statsAggregator.lastUpdated,
      },
    });
  } catch (err) {
    console.error("Error fetching stats overview:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch stats overview",
    });
  }
};

/**
 * GET /api/leaderboard/:stat(*)
 * Returns top 100 for a specific stat key.
 * The stat param uses the format: "minecraft:custom/minecraft:play_time"
 */
export const getLeaderboard = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Express wildcard param comes as req.params[0] or req.params.stat
    const stat = req.params.stat || req.params[0];

    if (!stat) {
      return res.status(400).json({
        err: true,
        message: "Stat key is required",
      });
    }

    const entries = statsAggregator.getLeaderboard(stat);

    if (!entries) {
      return res.status(404).json({
        err: true,
        message: `No leaderboard found for stat: ${stat}`,
      });
    }

    res.json({
      err: false,
      data: {
        stat,
        entries,
        lastUpdated: statsAggregator.lastUpdated,
      },
    });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch leaderboard",
    });
  }
};

/**
 * GET /api/player/:identifier
 * Returns full shaped stats for a player dashboard.
 * Identifier can be a UUID or a username (case-insensitive).
 */
export const getPlayer = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({
        err: true,
        message: "Player UUID or username is required",
      });
    }

    // Try UUID first (UUIDs contain hyphens), then username
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

    const player = isUuid
      ? statsAggregator.getPlayerByUuid(identifier)
      : statsAggregator.getPlayerByName(identifier);

    if (!player) {
      return res.status(404).json({
        err: true,
        message: `Player not found: ${identifier}`,
      });
    }

    res.json({
      err: false,
      data: {
        player,
        lastUpdated: statsAggregator.lastUpdated,
      },
    });
  } catch (err) {
    console.error("Error fetching player:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch player stats",
    });
  }
};

/**
 * GET /api/players
 * Returns paginated list of players with filtering support.
 * Query params:
 *   - limit: number of results per page (default: 20, max: 100)
 *   - page: page number, 1-indexed (default: 1)
 *   - q: substring search filter on player name
 *   - [other filterable fields]: additional filter criteria
 */
export const getPlayers = (req: Request, res: Response, next: NextFunction) => {
  try {
    let players = statsAggregator.playerList;

    // Parse pagination params
    let limit = parseInt(req.query.limit as string) || 20;
    let page = parseInt(req.query.page as string) || 1;

    // Validate pagination params
    limit = Math.min(Math.max(limit, 1), 100); // Clamp between 1 and 100
    page = Math.max(page, 1); // Ensure page is at least 1

    // Apply filters
    // Search filter (substring match on name)
    const query = (req.query.q as string)?.toLowerCase();
    if (query) {
      players = players.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Apply any additional filters from query params (excluding pagination and search)
    const excludedParams = ['limit', 'page', 'q'];
    Object.keys(req.query).forEach((key) => {
      if (!excludedParams.includes(key)) {
        const filterValue = (req.query[key] as string)?.toLowerCase();
        // Generic filter for string properties
        if (filterValue && (players[0] as any)?.[key]) {
          players = players.filter((p) => {
            const playerValue = (p as any)[key];
            if (typeof playerValue === 'string') {
              return playerValue.toLowerCase().includes(filterValue);
            }
            return String(playerValue).toLowerCase().includes(filterValue);
          });
        }
      }
    });

    // Calculate pagination
    const total = players.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedPlayers = players.slice(offset, offset + limit);

    res.json({
      err: false,
      data: {
        players: paginatedPlayers,
        pagination: {
          total,
          limit,
          page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        lastUpdated: statsAggregator.lastUpdated,
      },
    });
  } catch (err) {
    console.error("Error fetching players:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch players list",
    });
  }
};

/**
 * GET /api/stats/keys
 * Returns all trackable stat keys (for UI dropdowns).
 * Supports optional ?category= to filter by category.
 */
export const getStatKeys = (req: Request, res: Response, next: NextFunction) => {
  try {
    let keys = statsAggregator.statKeys;

    // Optional category filter
    const category = req.query.category as string;
    if (category) {
      keys = keys.filter((k) => k.category === category);
    }

    res.json({
      err: false,
      data: {
        keys,
        lastUpdated: statsAggregator.lastUpdated,
      },
    });
  } catch (err) {
    console.error("Error fetching stat keys:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch stat keys",
    });
  }
};
