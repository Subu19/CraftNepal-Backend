const fs = require("fs/promises");
const Guide = require("../utils/models/Guide");
const { deleteFromS3, extractKeyFromUrl, getCustomDomainUrl } = require("../utils/s3");

exports.handleGetGuide = async (req, res, next) => {
  try {
    const guide = await Guide.findOne({ id: req.params.name });
    if (guide) {
      // Transform URL for response
      const guideData = guide.toObject();
      if (guideData.image) {
        guideData.image = getCustomDomainUrl(guideData.imageKey);
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

exports.handleGetGuideList = async (req, res, next) => {
  try {
    const guides = await Guide.find({}, "id");
    res.json({
      err: false,
      data: guides,
    });
  } catch (error) {
    console.error("Error fetching guide list:", error);
    res.status(500).json({
      err: true,
      message: "Failed to fetch guide list",
    });
  }
};

exports.handleGuideFetch = async (req, res, next) => {
  try {
    const guides = await Guide.find({});
    // Transform URLs for response
    const transformedGuides = guides.map((guide) => {
      const guideData = guide.toObject();
      if (guideData.image) {
        guideData.image = getCustomDomainUrl(guideData.imageKey);
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

exports.handleGuidePost = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can create/update guides",
      });
    }

    const data = req.body;
    const guideName = req.params.name;

    // Find existing guide
    const existingGuide = await Guide.findOne({ id: guideName });

    // Delete old image from S3 if a new one is being uploaded and old guide exists
    if (existingGuide && existingGuide.imageKey && req.file) {
      try {
        await deleteFromS3(existingGuide.imageKey);
      } catch (error) {
        console.warn("Warning: Failed to delete old guide image:", error);
        // Continue anyway, don't fail the upload
      }
    }

    let updateData = {
      id: guideName,
      header: data.header,
      data: data.data ? JSON.parse(data.data) : [],
    };

    // Add image URL and key if file was uploaded (multer-s3 provides location and key)
    if (req.file) {
      updateData.image = req.file.location;
      updateData.imageKey = req.file.key;
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
    const guideData = guide.toObject();
    if (guideData.image) {
      guideData.image = getCustomDomainUrl(guideData.imageKey);
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
