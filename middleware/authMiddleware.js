const ensureAuthTeacher = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  req.flash("error_msg", "Please login to view this page");
  res.redirect("/teacherLogin");
}

const ensureGuestTeacher = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/teacherHome");
  }

  return next();
}

module.exports = {
  ensureAuthTeacher,
  ensureGuestTeacher,
};
