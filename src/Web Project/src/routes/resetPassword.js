const express = require("express");
const crypto = require("crypto");
const { sendOTP } = require("../../email");
const User = require("../../Model/user");
const { validateForgetPassword } = require("../middlewares/validation");
const router = express.Router();
router
  .route("/forgot")
  .get((req, res) => res.render("forgotPassword"))
  .post(async (req, res) => {
    const email = String(req.body.email.toLowerCase());
    const userFound = await User.findOne({ email: email });
    if (!userFound) {
      req.flash("error", "Email not found.");
      return res.redirect("/password/forgot");
    }
    const otp = crypto.randomInt(1000, 9999).toString();
    req.session.otp = otp;
    req.session.otpContext = "resetPassword";
    req.session.userData = { Email: email.toLowerCase() };
    await sendOTP(email.toLowerCase(), otp);
    req.flash("success", "OTP sent to your email. Please check your inbox.");
    res.redirect("/otp/verify");
  });
router
  .route("/reset")
  .get((req, res) => {
    console.log(req.session.otpVerified, req.session.otp);
    if (!req.session.otpVerified) {
      req.flash("error", "Unauthorized access to password reset.");
      return res.redirect("/login");
    }
    res.render("resetPassword");
  })
  .post(validateForgetPassword, async (req, res, next) => {
    try {
      const { password, confirmPassword } = req.body;
      if (password !== confirmPassword) {
        req.flash("error", "Passwords do not match.");
        return res.redirect("/password/reset");
      }
      const email = req.session.userData.Email.toLowerCase();
      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/password/reset");
      }
      await user.setPassword(password);
      await user.save();
      req.session.otp = null;
      req.session.otpContext = null;
      req.session.userData = null;
      req.session.otpVerified = !1;
      req.flash("success", "Password reset successful.");
      res.redirect("/login");
    } catch (e) {
      req.flash("error", "Operation Failed! Please try again.");
      next(e);
    }
  });
module.exports = router;
