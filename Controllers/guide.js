const fs = require("fs/promises");
const Guide = require("../utils/models/Guide");

exports.handleGetGuide = async (req, res, next) => {
  const guide = await Guide.findOne({ id: req.params.name });
  if (guide) res.send(guide);
  else res.send({ err: "err" });
};
exports.handleGetGuideList = async (req, res, next) => {
  const guides = await Guide.find({}, "id");
  res.send(guides);
};
exports.handleGuideFetch = async (req, res, next) => {
  const guides = await Guide.find({});
  res.send(guides);
};
exports.handleGuidePost = async (req, res, next) => {
  if (req.user.isAdmin) {
    const data = req.body;
    var guide;
    if (req.file) {
      guide = await Guide.findOneAndUpdate(
        { id: req.params.name },
        {
          id: req.params.name,
          header: data.header,
          data: JSON.parse(data.data),
          image: req.file.filename,
        }
      );
    } else {
      guide = await Guide.findOneAndUpdate(
        { id: req.params.name },
        {
          id: req.params.name,
          header: data.header,
          data: JSON.parse(data.data),
        }
      );
    }

    if (!guide) {
      const newGuide = new Guide();
      newGuide.id = req.params.name;
      newGuide.header = data.header;
      newGuide.data = data.data;
      if (req.file) newGuide.image = req.file.filename;
      await newGuide.save();
    }
    res.send("Uploaded");
  } else {
    res.send(402);
  }
};
