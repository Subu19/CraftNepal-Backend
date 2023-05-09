const fs = require("fs/promises");
const sharp = require("sharp");

exports.getGallery = async (req, res, next) => {
  try {
    let Gallery = [];
    const dir = await fs.readdir("./public/Gallery/");
    for (const folder of dir) {
      await fs.readdir(`./public/Gallery/${folder}/`).then((res) => {
        Gallery.push({
          title: folder,
          cover: `${
            folder == "Season-3"
              ? "https://img.republicworld.com/republic-prod/stories/promolarge/xhdpi/zh0dhksi2zg8cbac_1623049692.jpeg"
              : folder == "Season-4"
              ? "https://cdn.mos.cms.futurecdn.net/6Di69wBziu5SDtHQZvkfdg-1200-80.jpg.webp"
              : ""
          }`,
          photos: [...res],
        });
      });
    }
    res.send(Gallery);
  } catch (err) {
    console.log(err);
    res.send({ err: err });
  }
};
exports.handleGalleryDelete = async (req, res, next) => {
  const season = req.params.season;
  const photo = req.params.photo;
  if (req.user.isAdmin) {
    await fs
      .unlink("./public/Gallery/" + season + "/" + photo)
      .then((resp) => res.send(resp))
      .catch((err) => res.send({ err: err }));
  } else {
    res.send({ err: "User is not admin!" });
  }
};
exports.handleGalleryAdd = async (req, res, next) => {
  if (req.files) {
    for (const file of req.files) {
      await sharp(file.path)
        .toFile(
          file.destination +
            "/" +
            Date.now() +
            Math.floor(Math.random() * 10) +
            ".webp"
        )
        .then(() => {
          fs.unlink(file.path);
          console.log("hmm");
        })
        .catch((err) => res.send({ err: err }));
    }
  }
  res.send(200);
};
