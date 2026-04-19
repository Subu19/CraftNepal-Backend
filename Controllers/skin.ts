import { Request, Response, NextFunction } from "express";
import { con } from "../utils/connection";

const DEFAULT_SKIN_UUID = "069a79f4-44e9-4726-a5be-fca90e38aaf5";

/**
 * GET /api/skin/body/:uuid
 * Redirects to mc-heads.net body skin render for the player
 * Falls back to default skin if player not found
 */
export const getSkinBody = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.redirect(`https://mc-heads.net/body/${DEFAULT_SKIN_UUID}`);
    }

    con.query("SELECT * FROM `sr_players` WHERE uuid = ?", [uuid], (err, results: any) => {
      if (err) {
        console.error("Error fetching player skin body:", err);
        return res.redirect(`https://mc-heads.net/body/${DEFAULT_SKIN_UUID}`);
      }

      const skinIdentifier = results?.[0]?.skin_identifier || DEFAULT_SKIN_UUID;
      res.redirect(`https://mc-heads.net/body/${skinIdentifier}`);
    });
  } catch (err) {
    console.error("Error fetching player skin body:", err);
    res.redirect(`https://mc-heads.net/body/${DEFAULT_SKIN_UUID}`);
  }
};

/**
 * GET /api/skin/head/:uuid
 * Redirects to mc-heads.net head skin render for the player
 * Falls back to default skin if player not found
 */
export const getSkinHead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.redirect(`https://mc-heads.net/head/${DEFAULT_SKIN_UUID}`);
    }

    con.query("SELECT * FROM `sr_players` WHERE uuid = ?", [uuid], (err, results: any) => {
      if (err) {
        console.error("Error fetching player skin head:", err);
        return res.redirect(`https://mc-heads.net/head/${DEFAULT_SKIN_UUID}`);
      }

      const skinIdentifier = results?.[0]?.skin_identifier || DEFAULT_SKIN_UUID;
      res.redirect(`https://mc-heads.net/head/${skinIdentifier}`);
    });
  } catch (err) {
    console.error("Error fetching player skin head:", err);
    res.redirect(`https://mc-heads.net/head/${DEFAULT_SKIN_UUID}`);
  }
};

/**
 * GET /api/skin/2d/:uuid
 * Redirects to mc-heads.net avatar (2D) skin render for the player
 * Falls back to default skin if player not found
 */
export const getSkin2D = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.redirect(`https://mc-heads.net/avatar/${DEFAULT_SKIN_UUID}`);
    }

    con.query("SELECT * FROM `sr_players` WHERE uuid = ?", [uuid], (err, results: any) => {
      if (err) {
        console.error("Error fetching player skin 2d:", err);
        return res.redirect(`https://mc-heads.net/avatar/${DEFAULT_SKIN_UUID}`);
      }

      const skinIdentifier = results?.[0]?.skin_identifier || DEFAULT_SKIN_UUID;
      res.redirect(`https://mc-heads.net/avatar/${skinIdentifier}`);
    });
  } catch (err) {
    console.error("Error fetching player skin 2d:", err);
    res.redirect(`https://mc-heads.net/avatar/${DEFAULT_SKIN_UUID}`);
  }
};
