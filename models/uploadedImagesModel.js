const mongoose = require("mongoose");

const uploadedImagesSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  firstImagePath: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  day: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
});

const UploadedImages = mongoose.model("UploadedImages", uploadedImagesSchema);
module.exports = UploadedImages;
