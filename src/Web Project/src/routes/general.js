const express = require("express");
const path = require("path");
const CounselingRequest = require("../Model/counselingRequest");
const DietPlan = require("../../Model/dietPlan");
const Patient = require("../../Model/patient");
const {
  ensureAuthenticated,
  checkAdmin,
} = require("../middlewares/authentication");
const {
  validatePatient,
  validateDietPlan,
} = require("../middlewares/validation");
const router = express.Router();
router
  .route("/edit-info/:id")
  .get(ensureAuthenticated, async (req, res, next) => {
    try {
      const userData = await Patient.findById(req.params.id);
      if (!userData) return res.status(404).send("User not found");
      if (!req.user._id.equals(userData.accountId)) {
        req.flash("error", "Unauthorized Access.");
        return res.redirect("/login");
      }
      res.render("editInfo", { userData });
    } catch (err) {
      next(err);
    }
  })
  .put(ensureAuthenticated, validatePatient, async (req, res, next) => {
    try {
      await Patient.findByIdAndUpdate(req.params.id, req.body);
      req.flash("success", "Information updated successfully.");
      res.redirect(`/dashboard/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  });
router
  .route("/dashboard/:id")
  .get(ensureAuthenticated, async (req, res, next) => {
    try {
      const userData = await Patient.findById(req.params.id);
      const dietData = await DietPlan.findOne({
        accountId: userData.accountId,
      });
      const counselingData = await CounselingRequest.findOne({
        accountId: userData.accountId,
      });
      if (!userData) return res.status(404).send("User not found");
      const isOwner = req.user._id.equals(userData.accountId);
      const isAdmin = req.user.role === "Admin";
      if (!isOwner && !isAdmin) {
        req.flash("error", "Unauthorized Access.");
        return res.redirect("/login");
      }
      res.render("dashboard", {
        userData,
        dietData,
        counselingData,
        isOwner,
        isAdmin,
      });
    } catch (err) {
      next(err);
    }
  });
router
  .route("/dietplan")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "../public/Html/g.html"));
  })
  .post(ensureAuthenticated, validateDietPlan, async (req, res, next) => {
    try {
      const userId = req.user._id;
      const userData = await Patient.findOne({ accountId: userId });
      if (!userData) {
        req.flash("error", "User is not properly registered");
        return res.redirect("/info");
      }
      const { dietType, duration } = req.body;
      const subscriptionDate = new Date().toLocaleDateString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const plan = new DietPlan({
        dietType: dietType,
        duration: duration,
        dateJoined: subscriptionDate,
        paymentStatusVerification: "None",
        accountId: userId,
      });
      await plan.save();
      console.log("saved diet plan");
      req.flash("success", "Successfully subscribed to the diet plan.");
      res.redirect(`/dashboard/${userData._id}`);
    } catch (err) {
      next(err);
    }
  });
router.post("/delete/:id/:context", async (req, res, next) => {
  try {
    const { id, context } = req.params;
    switch (context) {
      case "dietplan":
        await Patient.findOneAndUpdate(
          { accountId: id },
          { admittanceStatus: "Rejected" }
        );
        await dietplan.findOneAndDelete({ accountId: id });
        req.flash("success", "Diet plan removed Successfully!");
        res.redirect(`/dashboard/${id}`);
        break;
      case "counseling":
        await counselingRequest.findOneAndDelete({ accountId: id });
        req.flash("success", "Counseling Session removed Successfully!");
        res.redirect(`/dashboard/${id}`);
        break;
      default:
        req.flash("error", "Invalid opoeration");
        res.redirect(`/dashboard/${id}`);
        break;
    }
  } catch (err) {
    next(err);
  }
});
module.exports = router;
