const express = require("express");
const passport = require("passport");
const Patient = require("../../Model/patient");
const User = require("../../Model/user");
const { sendOTP } = require("../../email");
const crypto = require("crypto");
const { validateLogin, validateUser } = require("../middlewares/validation");
const router = express.Router();
router
  .route("/login")
  .get((req, res) => res.render("login"))
  .post(validateLogin, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        req.flash("error", info.message);
        return res.redirect("/login");
      }
      req.login(user, async (err) => {
        if (err) return next(err);
        if (req.user.role === "Admin") {
          const otp = crypto.randomInt(1000, 9999).toString();
          req.session.otp = otp;
          req.session.userData = { Email: user.email.toLowerCase() };
          req.session.otpContext = "adminLogin";
          await sendOTP(user.email.toLowerCase(), otp);
          req.flash(
            "success",
            "OTP sent to your email. Please check your inbox."
          );
          return res.redirect("/verify-otp");
        } else {
          const recordExist = await Patient.findOne({ accountId: user._id });
          req.flash("success", "Successfully logged in! Welcome");
          res.redirect(recordExist ? `/dashboard/${recordExist._id}` : "/info");
        }
      });
    })(req, res, next);
  });
router
  .route("/register")
  .get(validateUser, (req, res) => res.render("register"))
  .post(async (req, res, next) => {
    try {
      const { error } = userSchema.validate(req.body);
      if (error) {
        req.flash("error", error.details[0].message);
        return res.redirect("/register");
      }
      const { Email, Username, Password } = req.body;
      const existingUser = await User.findOne({
        $or: [{ email: Email.toLowerCase() }, { username: Username }],
      });
      if (existingUser) {
        req.flash("error", "Username or email already in use");
        return res.redirect("/register");
      }
      const otp = crypto.randomInt(1000, 9999).toString();
      req.session.otp = otp;
      req.session.userData = { Email, Username, Password };
      req.session.otpContext = "userRegister";
      console.log(otp);
      await sendOTP(Email.toLowerCase(), otp);
      req.flash("success", "OTP sent to your email. Please check your inbox.");
      res.redirect("/verify-otp");
    } catch (e) {
      next(e);
    }
  });
router.route("/logout").post((req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Successfully logged out.");
    res.redirect("/login");
  });
});
module.exports = router;
