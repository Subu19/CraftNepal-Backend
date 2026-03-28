import { Request, Response } from 'express';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { IUser } from '../utils/models/User';

interface IGalleryItem {
    title: string;
    cover: string;
    photos: string[];
}

let cachedGallery: IGalleryItem[] | null = null;
const GALLERY_PATH = path.join(process.cwd(), 'public', 'Gallery');

// Ensure Gallery directory exists
if (!existsSync(GALLERY_PATH)) {
    mkdirSync(GALLERY_PATH, { recursive: true });
}

const COVER_MAP: Record<string, string> = {
    "Season-3": "https://img.republicworld.com/republic-prod/stories/promolarge/xhdpi/zh0dhksi2zg8cbac_1623049692.jpeg",
    "Season-4": "https://cdn.mos.cms.futurecdn.net/6Di69wBziu5SDtHQZvkfdg-1200-80.jpg.webp",
    "Season-5": "https://www.minecraft.net/content/dam/games/minecraft/key-art/Xbox_Minecraft_WildUpdate_Main_.Net_1170x500.jpg",
    "CraftNepal": "https://scontent.fktm8-1.fna.fbcdn.net/v/t39.30808-6/305803149_181069747821977_252386477056147190_n.png?_nc_cat=106&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=SIAVWQdCHYYAX-PvtlB&_nc_ht=scontent.fktm8-1.fna&oh=00_AfB1ysW3z75FxocAM2SOTrQC3NwSI5MDVmnb56ZT5dHHoQ&oe=645FB512"
};

const DEFAULT_COVER = "https://scontent.fktm8-1.fna.fbcdn.net/v/t39.30808-6/305803149_181069747821977_252386477056147190_n.png?_nc_cat=106&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=SIAVWQdCHYYAX-PvtlB&_nc_ht=scontent.fktm8-1.fna&oh=00_AfB1ysW3z75FxocAM2SOTrQC3NwSI5MDVmnb56ZT5dHHoQ&oe=645FB512";

const updateGalleryCache = async () => {
    try {
        const gallery: IGalleryItem[] = [];
        const dir = await fs.readdir(GALLERY_PATH, { withFileTypes: true });

        for (const entry of dir) {
            if (entry.isDirectory()) {
                const folder = entry.name;
                const folderPath = path.join(GALLERY_PATH, folder);
                const photos = await fs.readdir(folderPath);

                gallery.push({
                    title: folder,
                    cover: COVER_MAP[folder] || DEFAULT_COVER,
                    photos: [...photos],
                });
            }
        }
        cachedGallery = gallery;
        console.log('Gallery cache updated');
    } catch (err) {
        console.error('Error updating gallery cache', err);
    }
};

// Initialize cache
updateGalleryCache();

export const getGallery = async (_req: Request, res: Response) => {
    try {
        if (!cachedGallery) {
            await updateGalleryCache();
        }
        res.json(cachedGallery || []);
    } catch (err) {
        res.status(500).json({ error: "Failed to load gallery" });
    }
};

export const handleGalleryDelete = async (req: Request, res: Response) => {
    const { season, photo } = req.params;
    const user = req.user as IUser;

    if (user && user.isAdmin) {
        try {
            await fs.unlink(path.join(GALLERY_PATH, season, photo));
            await updateGalleryCache();
            res.json({ success: true, message: 'Deleted' });
        } catch (err) {
            res.status(500).json({ error: "Delete failed" });
        }
    } else {
        res.status(403).json({ error: "Forbidden" });
    }
};

export const handleGalleryAdd = async (req: Request, res: Response) => {
    try {
        if (!req.files || !Array.isArray(req.files)) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const files = req.files as Express.Multer.File[];

        await Promise.all(files.map(async (file) => {
            const filename = `${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
            const outputPath = path.join(path.dirname(file.path), filename);

            await sharp(file.path)
                .webp({ quality: 80 })
                .toFile(outputPath);

            // Remove original uploaded file (since we converted it)
            await fs.unlink(file.path).catch(() => { });
        }));

        await updateGalleryCache();
        res.status(200).json({ message: "Upload processed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Processing failed" });
    }
};
