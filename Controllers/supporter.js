const Supporter = require("../utils/models/Supporter");

/**
 * Get all supporters
 * @route GET /api/supporters
 */
exports.getSupporters = async (req, res) => {
  try {
    const supporters = await Supporter.find({ isActive: true }).sort({
      tier: 1,
      createdAt: -1,
    });
    res.json({
      err: false,
      data: supporters,
    });
  } catch (error) {
    console.error("Error fetching supporters:", error);
    res.status(500).json({
      err: true,
      message: "Failed to fetch supporters",
    });
  }
};

/**
 * Get supporters by tier
 * @route GET /api/supporters/tier/:tier
 */
exports.getSupportersByTier = async (req, res) => {
  try {
    const { tier } = req.params;
    const validTiers = ["bronze", "silver", "gold", "diamond"];

    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        err: true,
        message: "Invalid tier. Must be one of: bronze, silver, gold, diamond",
      });
    }

    const supporters = await Supporter.find({ tier, isActive: true }).sort({
      createdAt: -1,
    });

    res.json({
      err: false,
      data: supporters,
    });
  } catch (error) {
    console.error("Error fetching supporters by tier:", error);
    res.status(500).json({
      err: true,
      message: "Failed to fetch supporters by tier",
    });
  }
};

/**
 * Get single supporter by name
 * @route GET /api/supporters/:name
 */
exports.getSupporter = async (req, res) => {
  try {
    const { name } = req.params;
    const supporter = await Supporter.findOne({ name });

    if (!supporter) {
      return res.status(404).json({
        err: true,
        message: "Supporter not found",
      });
    }

    res.json({
      err: false,
      data: supporter,
    });
  } catch (error) {
    console.error("Error fetching supporter:", error);
    res.status(500).json({
      err: true,
      message: "Failed to fetch supporter",
    });
  }
};

/**
 * Add new supporter (Admin only)
 * @route POST /api/supporters
 * @body { name, tier?, discordId?, description?, profileUrl? }
 */
exports.addSupporter = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can add supporters",
      });
    }

    const { name, tier = "bronze", discordId, description, profileUrl } =
      req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        err: true,
        message: "Supporter name is required",
      });
    }

    // Check if supporter already exists
    const existingSupporter = await Supporter.findOne({
      name: name.trim(),
    });

    if (existingSupporter) {
      return res.status(409).json({
        err: true,
        message: "Supporter with this name already exists",
      });
    }

    const validTiers = ["bronze", "silver", "gold", "diamond"];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        err: true,
        message: "Invalid tier. Must be one of: bronze, silver, gold, diamond",
      });
    }

    const newSupporter = new Supporter({
      name: name.trim(),
      tier,
      discordId,
      description,
      profileUrl,
    });

    const savedSupporter = await newSupporter.save();

    res.status(201).json({
      err: false,
      message: "Supporter added successfully",
      data: savedSupporter,
    });
  } catch (error) {
    console.error("Error adding supporter:", error);
    res.status(500).json({
      err: true,
      message: "Failed to add supporter",
    });
  }
};

/**
 * Update supporter (Admin only)
 * @route PUT /api/supporters/:name
 * @body { tier?, discordId?, description?, profileUrl?, isActive? }
 */
exports.updateSupporter = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can update supporters",
      });
    }

    const { name } = req.params;
    const { tier, discordId, description, profileUrl, isActive } = req.body;

    const supporter = await Supporter.findOne({ name });

    if (!supporter) {
      return res.status(404).json({
        err: true,
        message: "Supporter not found",
      });
    }

    // Validate tier if provided
    if (tier) {
      const validTiers = ["bronze", "silver", "gold", "diamond"];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({
          err: true,
          message:
            "Invalid tier. Must be one of: bronze, silver, gold, diamond",
        });
      }
      supporter.tier = tier;
    }

    if (discordId !== undefined) supporter.discordId = discordId;
    if (description !== undefined) supporter.description = description;
    if (profileUrl !== undefined) supporter.profileUrl = profileUrl;
    if (isActive !== undefined) supporter.isActive = isActive;

    const updatedSupporter = await supporter.save();

    res.json({
      err: false,
      message: "Supporter updated successfully",
      data: updatedSupporter,
    });
  } catch (error) {
    console.error("Error updating supporter:", error);
    res.status(500).json({
      err: true,
      message: "Failed to update supporter",
    });
  }
};

/**
 * Remove supporter (Admin only)
 * @route DELETE /api/supporters/:name
 */
exports.removeSupporter = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can remove supporters",
      });
    }

    const { name } = req.params;

    const result = await Supporter.findOneAndDelete({ name });

    if (!result) {
      return res.status(404).json({
        err: true,
        message: "Supporter not found",
      });
    }

    res.json({
      err: false,
      message: "Supporter removed successfully",
    });
  } catch (error) {
    console.error("Error removing supporter:", error);
    res.status(500).json({
      err: true,
      message: "Failed to remove supporter",
    });
  }
};

/**
 * Bulk import supporters from JSON array (Admin only)
 * @route POST /api/supporters/bulk/import
 * @body { supporters: [{ name, tier?, discordId?, description?, profileUrl? }] }
 */
exports.bulkImportSupporters = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can import supporters",
      });
    }

    const { supporters } = req.body;

    if (!Array.isArray(supporters)) {
      return res.status(400).json({
        err: true,
        message: "Supporters must be an array",
      });
    }

    const results = {
      added: 0,
      failed: 0,
      errors: [],
    };

    for (const supporter of supporters) {
      try {
        if (!supporter.name) {
          results.failed++;
          results.errors.push({
            supporter: supporter.name || "unknown",
            error: "Name is required",
          });
          continue;
        }

        const existingSupporter = await Supporter.findOne({
          name: supporter.name.trim(),
        });

        if (existingSupporter) {
          results.failed++;
          results.errors.push({
            supporter: supporter.name,
            error: "Supporter already exists",
          });
          continue;
        }

        const validTiers = ["bronze", "silver", "gold", "diamond"];
        if (
          supporter.tier &&
          !validTiers.includes(supporter.tier)
        ) {
          results.failed++;
          results.errors.push({
            supporter: supporter.name,
            error: `Invalid tier: ${supporter.tier}`,
          });
          continue;
        }

        const newSupporter = new Supporter({
          name: supporter.name.trim(),
          tier: supporter.tier || "bronze",
          discordId: supporter.discordId,
          description: supporter.description,
          profileUrl: supporter.profileUrl,
        });

        await newSupporter.save();
        results.added++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          supporter: supporter.name || "unknown",
          error: error.message,
        });
      }
    }

    res.json({
      err: false,
      message: "Bulk import completed",
      results,
    });
  } catch (error) {
    console.error("Error bulk importing supporters:", error);
    res.status(500).json({
      err: true,
      message: "Failed to import supporters",
    });
  }
};
