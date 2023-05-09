const config = require("../config.json");
const Comment = require("../utils/models/Comments");
const Post = require("../utils/models/Post");

exports.submitPort = (req, res, next) => {
  var newPost = new Post();
  newPost.id = Date.now();
  newPost.caption = req.body.caption;
  newPost.postImage = req.file.filename;
  newPost.author = {
    profilePic: req.user.avatar,
    username: req.user.username,
    id: req.user.discordId,
  };
  newPost
    .save()
    .then(() => {
      res.send({ message: "Uploaded!" });
    })
    .catch((err) => {
      console.log("Something went wrong during posting" + err);
      res.send({ err: err });
    });
};

exports.getFeed = async (req, res, next) => {
  const results = await Post.find({}).sort({ _id: -1 }).limit(req.params.limit);
  if (results) {
    res.send(results);
  } else {
    res.send({ err: "Something went wrong" });
  }
};

exports.getPost = async (req, res, next) => {
  if (req.params.id) {
    const post = await Post.findById(req.params.id);
    if (post) {
      res.send(JSON.stringify(post));
    } else res.send({ err: "err" });
  } else {
    res.send({ err: "err" });
  }
};

exports.handlePostLike = async (req, res, next) => {
  console.log(req.body);
  if (!req.body.postId) {
    res.send({ err: "please provide postiD" });
    return;
  }

  const post = await Post.findById(req.body.postId);

  if (!post) return res.send({ err: "Cannot find the post" });

  if (post.likes.find((user) => user.userId == req.user.discordId)) {
    res.send({ err: "User already liked" });
  } else {
    await post.likes.push({
      username: req.user.username,
      userId: req.user.discordId,
      profilePic: req.user.avatar,
    });
    await post.save();
    res.send({ message: "Liked!" });
  }
};
exports.handlePostUnLike = async (req, res, next) => {
  console.log(req.body);

  if (!req.body.postId) {
    res.send({ err: "please provide postiD" });
    return;
  }

  const post = await Post.findById(req.body.postId);
  if (!post) return res.send({ err: "Cannot find the post" });

  if (post.likes.find((user) => user.userId == req.user.discordId)) {
    const updateLikes = await post.likes.filter(
      (user) => user.userId !== req.user.discordId
    );
    post.likes = updateLikes;
    await post.save();
    console.log(post);
    res.send({ message: "Unliked!" });
  } else {
    res.send({ err: "User hasnt like the post" });
  }
};
exports.handlePostComment = async (req, res, next) => {
  if (req.body.comment && req.body.postId) {
    const post = await Post.findById(req.body.postId);
    if (post) {
      var newComment = new Comment();
      newComment.username = req.user.username;
      newComment.profilePic = req.user.avatar;
      newComment.comment = req.body.comment;
      newComment.discordId = req.user.discordId;
      newComment.id = Date.now();
      newComment.isReply = false;
      await newComment.save();
      await post.comments.push(newComment);
      await post.save();
      console.log(newComment);
      res.send({ message: "commendted!" });
    } else res.send({ err: "err" });
  } else {
    res.send({ err: "err" });
  }
};
exports.handleGetComments = async (req, res, next) => {
  if (req.params.id) {
    const post = await (
      await Post.findOne({ _id: req.params.id })
    ).populate({ path: "comments" });
    res.send(post);
  } else res.send({ err: "Please provide postId" });
};

exports.handlePostDelete = async (req, res, next) => {
  if (req.params.id) {
    try {
      const post = await Post.findOne({ _id: req.params.id });
      if (post) {
        if (post.author.id == req.user.discordId || req.user.isAdmin) {
          await Post.deleteOne({ _id: req.params.id });
          res.send({ message: "Deleted!" });
        } else {
          res.send(404);
        }
      } else {
        res.send(404);
      }
    } catch (err) {
      console.log(err);
      res.send(404);
    }
  }
};
