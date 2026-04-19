import { Request, Response, NextFunction } from "express";
import { con } from "../utils/connection";
import { promisify } from "util";

const query = promisify(con.query).bind(con);

const DEFAULT_SKIN_UUID = "069a79f4-44e9-4726-a5be-fca90e38aaf5";

/**
 * GET /api/skin/body/:uuid
 * Redirects to mc-heads.net body skin render for the player
 * Falls back to default skin if player not found
 */
export const getSkinBody = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.redirect(`https://mc-heads.net/body/${DEFAULT_SKIN_UUID}`);
    }

    const results = (await query("SELECT * FROM `sr_players` WHERE uuid = ?", [
      uuid,
    ])) as any[];

    const skinIdentifier = results?.[0]?.skin_identifier || DEFAULT_SKIN_UUID;

    res.redirect(`https://mc-heads.net/body/${skinIdentifier}`);
  } catch (err) {
    console.error("Error fetching player skin body:", err);
    // Fallback to default skin on error
    res.redirect(`https://mc-heads.net/body/${DEFAULT_SKIN_UUID}`);
  }
};

/**
 * GET /api/skin/head/:uuid
 * Redirects to skins.danielraybone.com head skin render for the player
 * Falls back to default skin if player not found
 */
export const getSkinHead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.redirect(
        `https://skins.danielraybone.com/v1/head/${DEFAULT_SKIN_UUID}`,
      );
    }

    const results = (await query("SELECT * FROM `sr_players` WHERE uuid = ?", [
      uuid,
    ])) as any[];

    const skinIdentifier = results?.[0]?.skin_identifier || DEFAULT_SKIN_UUID;

    res.redirect(`https://skins.danielraybone.com/v1/head/${skinIdentifier}`);
  } catch (err) {
    console.error("Error fetching player skin head:", err);
    // Fallback to default skin on error
    res.redirect(
      `https://skins.danielraybone.com/v1/head/${DEFAULT_SKIN_UUID}`,
    );
  }
};

/**
 * GET /api/skin/2d/:uuid
 * Redirects to minotar.net 2D helmet skin render for the player
 * Falls back to default skin if player not found
 */
export const getSkin2D = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.redirect(`https://minotar.net/helm/${DEFAULT_SKIN_UUID}`);
    }

    const results = (await query("SELECT * FROM `sr_players` WHERE uuid = ?", [
      uuid,
    ])) as any[];

    const skinIdentifier = results?.[0]?.skin_identifier || DEFAULT_SKIN_UUID;

    res.redirect(`https://minotar.net/helm/${skinIdentifier}`);
  } catch (err) {
    console.error("Error fetching player skin 2d:", err);
    // Fallback to default skin on error
    res.redirect(`https://minotar.net/helm/${DEFAULT_SKIN_UUID}`);
  }
};
