const fs = require("fs/promises");
const Guide = require("../utils/models/Guide");
const { deleteFromS3, extractKeyFromUrl } = require("../utils/s3");

exports.handleGetGuide = async (req, res, next) => {
  try {
    const guide = await Guide.findOne({ id: req.params.name });
    if (guide) {
      res.json({
        err: false,
        data: guide,
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
    res.json({
      err: false,
      data: guides,
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
    if (existingGuide && existingGuide.image && req.file) {
      try {
        const oldKey = extractKeyFromUrl(existingGuide.image) || existingGuide.image;
        await deleteFromS3(oldKey);
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

    // Add image URL if file was uploaded (multer-s3 provides location)
    if (req.file) {
      updateData.image = req.file.location;
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

    res.status(201).json({
      err: false,
      message: "Guide saved successfully",
      data: guide,
    });
  } catch (error) {
    console.error("Error posting guide:", error);
    res.status(500).json({
      err: true,
      message: "Failed to save guide",
    });
  }
};
