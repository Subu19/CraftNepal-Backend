import { Request, Response, NextFunction } from 'express';
import Guide, { IGuide } from '../utils/models/Guide';

export const handleGetGuide = async (req: Request, res: Response, next: NextFunction) => {
    const guide = await Guide.findOne({ id: req.params.name });
    if (guide) res.send(guide);
    else res.send({ err: "err" });
};

export const handleGetGuideList = async (req: Request, res: Response, next: NextFunction) => {
    const guides = await Guide.find({}, "id");
    res.send(guides);
};

export const handleGuideFetch = async (req: Request, res: Response, next: NextFunction) => {
    const guides = await Guide.find({});
    res.send(guides);
};

export const handleGuidePost = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (user && user.isAdmin) {
        const data = req.body;
        let guide;

        // Check if uploaded file exists
        // req.file is available if multer middleware is used
        if (req.file) {
            guide = await Guide.findOneAndUpdate(
                { id: req.params.name },
                {
                    id: req.params.name,
                    header: data.header,
                    data: typeof data.data === 'string' ? JSON.parse(data.data) : data.data,
                    image: req.file.filename,
                }
            );
        } else {
            guide = await Guide.findOneAndUpdate(
                { id: req.params.name },
                {
                    id: req.params.name,
                    header: data.header,
                    data: typeof data.data === 'string' ? JSON.parse(data.data) : data.data,
                }
            );
        }

        if (!guide) {
            const newGuide = new Guide();
            newGuide.id = req.params.name;
            newGuide.header = data.header;
            newGuide.data = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
            if (req.file) newGuide.image = req.file.filename;
            await newGuide.save();
        }
        res.send("Uploaded");
    } else {
        res.sendStatus(402);
    }
};
