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

  app.post("/teacherRegister", (req, res) => {
    const email = req.body.username;
    const teacherName = req.body.teacherName;
    const collegeCode = req.body.collegeCode;

    let errors = [];
    if (/^[a-zA-Z ]+$/.test(req.body.teacherName) === false) {
      errors.push({
        msg: "Please enter correct name"
      });
    }

    if (errors.length > 0) {
      res.render("teacherRegister", {
        errors,
        teacherName,
        email,
        collegeCode
      });
    } else {
      if (req.body.password.length < 6) {
        errors.push({
          msg: "Password should be atleast 6 characters"
        });
      }

      if (errors.length > 0) {
        res.render("teacherRegister", {
          errors,
          teacherName,
          email,
          collegeCode
        });
      } else {
        if (req.body.collegeCode != college_code) {
          errors.push({
            msg: "Incorrect College Code"
          });
        }

        if (errors.length > 0) {
          res.render("teacherRegister", {
            errors,
            teacherName,
            email,
            collegeCode
          });
        } else {
          Teacher.register({
            username: req.body.username,
            email: req.body.username,
            teacherName: req.body.teacherName
          }, req.body.password, function(err, user) {
            if (err) {
              console.error(err);
              errors.push({
                msg: "Email is already registered"
              });
              res.render("teacherRegister", {
                errors,
                teacherName,
                email,
                collegeCode
              });
            } else {
              passport.authenticate("teacher-local")(req, res, function() {
                res.redirect("/teacherHome");
              });
            }
          });
        }
      }
    }
  });
};

module.exports = configurePassport;
