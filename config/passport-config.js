const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Teacher = require("../models/teacherModel");

const configurePassport = (app) => {
  const college_code = process.env.COLLEGE_CODE;

  passport.use("teacher-local", new LocalStrategy(Teacher.authenticate()));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    if (user != null) done(null, user);
  });

  app.post("/teacherLogin", passport.authenticate("teacher-local", {
    successRedirect: "/teacherHome",
    failureRedirect: "/teacherLogin",
    failureFlash: true,
  }));

  app.post("/teacherRegister", async (req, res) => {
    const {
      username,
      teacherName,
      collegeCode,
      password
    } = req.body;

    let errors = [];
    if (/^[a-zA-Z ]+$/.test(teacherName) === false) {
      errors.push({
        msg: "Please enter correct name"
      });
    }

    if (errors.length > 0) {
      return res.render("teacherRegister", {
        errors,
        teacherName,
        email: username,
        collegeCode
      });
    }

    if (password.length < 6) {
      errors.push({
        msg: "Password should be atleast 6 characters"
      });
    }

    if (errors.length > 0) {
      return res.render("teacherRegister", {
        errors,
        teacherName,
        email: username,
        collegeCode
      });
    }

    if (collegeCode != college_code) {
      errors.push({
        msg: "Incorrect College Code"
      });
    }

    if (errors.length > 0) {
      return res.render("teacherRegister", {
        errors,
        teacherName,
        email: username,
        collegeCode
      });
    }

    try {
      const user = await Teacher.register({
          username,
          email: username,
          teacherName,
        },
        password
      );

      passport.authenticate("teacher-local")(req, res, () => {
        res.redirect("/teacherHome");
      });
    } catch (err) {
      console.error(err);
      errors.push({
        msg: "Email is already registered"
      });

      res.render("teacherRegister", {
        errors,
        teacherName,
        email: username,
        collegeCode,
      });
    }
  });
};

module.exports = configurePassport;
