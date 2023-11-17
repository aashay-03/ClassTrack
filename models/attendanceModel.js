const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  teacherEmail: {
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
  studentsPresent: [{
    type: String
  }]
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
