const checkOTPAccess = (req, res, next) => {
  if (["adminLogin", "userRegister", "resetPassword"].includes(req.session.otpContext)) {
    return next();
  }
  req.flash("error", "Unauthorized access to OTP verification.");
  return res.redirect("/login");
};

const checkOTPCompleted = (req, res, next) => {
  if (req.session.otpVerified) {
    req.flash("error", "OTP already verified.");
    return res.redirect("/register");
  }
  next();
};

const ensureAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "Please log in to access this page.");
    return res.redirect("/login");
  }
  next();
};

const checkAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "Admin") {
    return next();
  }
  req.flash("error", "Unauthorized Access.");
  return res.redirect("/login");
};

module.exports = {
  checkOTPAccess,
  checkOTPCompleted,
  ensureAuthenticated,
  checkAdmin
};
