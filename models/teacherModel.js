const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const teacherSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  teacherName: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    default: ""
  }
});

teacherSchema.plugin(passportLocalMongoose);
const Teacher = mongoose.model("Teacher", teacherSchema);
module.exports = Teacher;
