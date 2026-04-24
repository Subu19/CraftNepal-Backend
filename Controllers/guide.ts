import { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import { Guide } from "../utils/models/Guide";
import { deleteFromS3, extractKeyFromUrl, getCustomDomainUrl } from "../utils/s3";

export const handleGetGuide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guide = await Guide.findOne({ id: req.params.name, deletedAt: null });
    if (guide) {
      // Transform URL for response
      const guideData = guide.toObject();
      if (guideData.imageKey) {
        guideData.image = getCustomDomainUrl(guideData.imageKey as string) as string;
      }
      if (guideData.iconKey) {
        guideData.icon = getCustomDomainUrl(guideData.iconKey as string) as string;
      }
      res.json({
        err: false,
        data: guideData,
      });
    } else {
      res.status(404).json({
        err: true,
        message: "Guide not found",
      });
    }
  } catch (error) {
    console.error("Error fetching guide:", error);
    res.status(500).json({
      err: true,
      message: "Failed to fetch guide",
    });
  }
};

export const handleGetGuideList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guides = await Guide.find({ deletedAt: null }, "id header icon iconKey");
    const transformedGuides = guides.map(g => {
      const guideData = g.toObject();
      if (guideData.iconKey) {
        guideData.icon = getCustomDomainUrl(guideData.iconKey as string) as string;
      }
      return guideData;
    });
    res.json({
      err: false,
      data: transformedGuides,
    });
  } catch (error) {
    console.error("Error fetching guide list:", error);
    res.status(500).json({
      err: true,
      message: "Failed to fetch guide list",
    });
  }
};

export const handleGuideFetch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guides = await Guide.find({ deletedAt: null });
    // Transform URLs for response
    const transformedGuides = guides.map((guide) => {
      const guideData = guide.toObject();
      if (guideData.imageKey) {
        guideData.image = getCustomDomainUrl(guideData.imageKey as string) as string;
      }
      if (guideData.iconKey) {
        guideData.icon = getCustomDomainUrl(guideData.iconKey as string) as string;
      }
      return guideData;
    });
    res.json({
      err: false,
      data: transformedGuides,
    });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({
      err: true,
      message: "Failed to fetch guides",
    });
  }
};

export const handleGuidePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req.user as any)?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can create/update guides",
      });
    }

    const data = req.body;
    const guideName = req.params.name;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Find existing guide
    const existingGuide = await Guide.findOne({ id: guideName });

    let updateData: any = {
      id: guideName,
      header: data.header,
      data: data.data ? JSON.parse(data.data) : [],
      updatedAt: new Date(),
      deletedAt: null, // Restore if it was soft-deleted
    };

    // Handle removal of existing files
    if (data.removeImage === 'true' && existingGuide?.imageKey) {
      try {
        await deleteFromS3(existingGuide.imageKey);
      } catch (e) {}
      updateData.image = null;
      updateData.imageKey = null;
    }

    if (data.removeIcon === 'true' && existingGuide?.iconKey) {
      try {
        await deleteFromS3(existingGuide.iconKey);
      } catch (e) {}
      updateData.icon = null;
      updateData.iconKey = null;
    }

    // Handle image upload
    if (files?.image?.[0]) {
      // Delete old image
      if (existingGuide?.imageKey) {
        try {
          await deleteFromS3(existingGuide.imageKey);
        } catch (e) {}
      }
      updateData.image = (files.image[0] as any).location;
      updateData.imageKey = (files.image[0] as any).key;
    }

    // Handle icon upload
    if (files?.icon?.[0]) {
      // Delete old icon
      if (existingGuide?.iconKey) {
        try {
          await deleteFromS3(existingGuide.iconKey);
        } catch (e) {}
      }
      updateData.icon = (files.icon[0] as any).location;
      updateData.iconKey = (files.icon[0] as any).key;
    }

    let guide;
    if (existingGuide) {
      guide = await Guide.findOneAndUpdate({ id: guideName }, updateData, {
        new: true,
      });
    } else {
      guide = new Guide(updateData);
      await guide.save();
    }

    // Transform URL for response
    const guideData = guide!.toObject();
    if (guideData.imageKey) {
      guideData.image = getCustomDomainUrl(guideData.imageKey as string) as string;
    }
    if (guideData.iconKey) {
      guideData.icon = getCustomDomainUrl(guideData.iconKey as string) as string;
    }

    res.status(201).json({
      err: false,
      message: "Guide saved successfully",
      data: guideData,
    });
  } catch (error) {
    console.error("Error posting guide:", error);
    res.status(500).json({
      err: true,
      message: "Failed to save guide",
    });
  }
};

export const handleDeleteGuide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req.user as any)?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can delete guides",
      });
    }

    const { name } = req.params;
    const guide = await Guide.findOne({ id: name });

    if (!guide) {
      return res.status(404).json({
        err: true,
        message: "Guide not found",
      });
    }

    // Soft delete
    guide.deletedAt = new Date();
    await guide.save();

    res.json({
      err: false,
      message: "Guide deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guide:", error);
    res.status(500).json({
      err: true,
      message: "Failed to delete guide",
    });
  }
};
