const express = require("express");
const CounselingRequest = require("../../Model/counselingRequest");
const {
  ensureAuthenticated,
  checkAdmin,
} = require("../middlewares/authentication");
const { validateCounselingRequest } = require("../middlewares/validation");
const { sendCounselingSessionRequest } = require("../../email");
const router = express.Router();
router
  .route("/request/:id")
  .get(ensureAuthenticated, async (req, res, next) => {
    try {
      const id = req.params.id;
      const existingRequest = await CounselingRequest.findOne({
        accountId: req.user._id,
      });
      if (existingRequest) {
        req.flash("error", "User Already has a pending Session.");
        return res.redirect(`/user/dashboard/${req.params.id}`);
      }
      return res.render("counselingRequest", { id });
    } catch (err) {
      next(err);
    }
  })
  .post(
    ensureAuthenticated,
    validateCounselingRequest,
    async (req, res, next) => {
      try {
        const { fullname, reason, date } = req.body;
        const { email, _id } = req.user;
        const request = await new CounselingRequest({
          fullName: fullname,
          email: email,
          reason: reason,
          date: date,
          status: "Pending Approval",
          payment: "None",
          accountId: _id,
        });
        request.save();
        sendCounselingSessionRequest(request);
        req.flash("success", "Counseling request Sent! Awaiting Approval.");
        res.redirect(`/user/dashboard/${req.user._id}`);
      } catch (err) {
        next(err);
      }
    }
  );
router.get(
  "/sessionInfo/:id",
  ensureAuthenticated,
  checkAdmin,
  async (req, res, next) => {
    try {
      const userData = await CounselingRequest.findOne({
        accountId: req.params.id,
      });
      console.log(userData);
      res.render("sessioninfo", { userData });
    } catch (err) {
      next(err);
    }
  }
);
module.exports = router;
