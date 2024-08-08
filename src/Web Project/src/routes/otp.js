const express = require("express");
const crypto = require("crypto");
const {
  checkOTPAccess,
  checkOTPCompleted,
} = require("../middlewares/authentication");
const User = require("../../Model/user");
const { sendOTP } = require("../../email");
const router = express.Router();
const OTP_EXPIRY_TIME = 300000;
const OTP_RESEND_WAIT_TIME = 30000;
const MAX_OTP_ATTEMPTS = 8;
const checkOTPExpiry = (otpTimestamp) =>
  Date.now() - otpTimestamp > OTP_EXPIRY_TIME;
const checkResendWaitTime = (otpTimestamp) =>
  Date.now() - otpTimestamp < OTP_RESEND_WAIT_TIME;
router
  .route("/verify")
  .get(checkOTPAccess, checkOTPCompleted, (req, res) => {
    if (checkOTPExpiry(req.session.otpTimestamp)) {
      req.flash("error", "OTP expired. Please request a new one.");
      return res.redirect("/otp/resend");
    }
    res.render("verifyOtp", { otpContext: req.session.otpContext });
  })
  .post(checkOTPAccess, async (req, res, next) => {
    try {
      const otp = req.body.otp;
      if (checkOTPExpiry(req.session.otpTimestamp)) {
        req.flash("error", "OTP expired. Please request a new one.");
        return res.redirect("/otp/resend");
      }
      if (req.session.otpAttempts >= MAX_OTP_ATTEMPTS) {
        req.flash("error", "Maximum attempts reached. Please try again later.");
        return res.redirect("/otp/resend");
      }
      if (otp === req.session.otp) {
        req.session.otpVerified = !0;
        req.session.otp = null;
        req.session.otpAttempts = 0;
        switch (req.session.otpContext) {
          case "adminLogin":
            req.flash("success", "Logged In Succesfully.");
            return resetOTPContext(req, res, "/main/admin");
          case "resetPassword":
            return res.redirect("/password/reset");
            break;
          case "userRegister":
            const { Email, Username, Password } = req.session.userData;
            const newUser = new User({ email: Email, username: Username });
            await User.register(newUser, Password);
            req.login(newUser, (err) => {
              if (err) return next(err);
              req.flash("success", "OTP verified. Registration successful.");
              return resetOTPContext(req, res, "/user/info");
            });
            return;
            break;
          default:
            req.flash("error", "Invalid OTP context.");
            return res.redirect("/login");
            break;
        }
      } else {
        req.session.otpAttempts++;
        req.flash("error", "Invalid OTP. Please try again.");
        return res.redirect("/otp/verify");
      }
    } catch (err) {
      return next(err);
    }
  });
router.get("/resend", checkOTPAccess, async (req, res) => {
  if (checkResendWaitTime(req.session.otpTimestamp)) {
    req.flash("error", "Please wait before requesting a new OTP.");
    return res.redirect("/otp/verify");
  }
  const otp = crypto.randomInt(1000, 9999).toString();
  req.session.otp = otp;
  req.session.otpAttempts = 0;
  req.session.otpTimestamp = Date.now();
  await sendOTP(req.session.userData.Email.toLowerCase(), otp);
  req.flash("success", "OTP resent. Please check your inbox.");
  res.redirect("/otp/verify");
});
const resetOTPContext = (req, res, redirectUrl) => {
  req.session.otpContext = null;
  req.session.userData = null;
  req.session.otpVerified = !1;
  res.redirect(redirectUrl);
};
module.exports = router;
