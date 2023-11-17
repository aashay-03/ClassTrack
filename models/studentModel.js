const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  enrollmentno: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  studentImage: {
    type: String,
    required: true,
  },
});

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
