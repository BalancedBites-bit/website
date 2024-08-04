require("dotenv").config();
const express = require("express");
const path = require("path");
const CounselingRequest = require("../../Model/counselingRequest");
const DietPlan = require("../../Model/dietPlan");
const Patient = require("../../Model/patient");
const { ensureAuthenticated } = require("../middlewares/authentication");
const {
  validatePatient,
  validateDietPlan,
  validateContactUs,
} = require("../middlewares/validation");
const { sendDietPlanRequest, sendContactEmail } = require("../../email");
const router = express.Router();
router
  .route("/edit-info/:id")
  .get(ensureAuthenticated, async (req, res, next) => {
    try {
      const userData = await Patient.findById(req.params.id);
      if (!userData) return res.status(404).send("User not found");
      if (!req.user._id.equals(userData.accountId)) {
        req.flash("error", "Unauthorized Acess.");
        res.redirect("/login");
      }
      res.render("editInfo", { userData });
    } catch (err) {
      next(err);
    }
  })
  .put(ensureAuthenticated, async (req, res, next) => {
    try {
      await Patient.findByIdAndUpdate(req.params.id, req.body);
      req.flash("success", "Information updated successfully.");
      res.redirect(`/user/dashboard/${req.user._id}`);
    } catch (err) {
      next(err);
    }
  });
router
  .route("/info")
  .get(ensureAuthenticated, async (req, res, next) => {
    try {
      const userData = await Patient.findOne({ accountId: req.user._id });
      if (userData) {
        req.flash("error", "User already exists");
        return res.redirect(`/user/dashboard/${userData.accountId}`);
      }
      res.render("infoPage");
    } catch (err) {
      next(err);
    }
  })
  .post(ensureAuthenticated, validatePatient, async (req, res, next) => {
    const newPatientData = {
      ...req.body,
      email: req.user.email,
      accountId: req.user._id,
    };
    const newPatient = new Patient(newPatientData);
    try {
      const savedPatient = await newPatient.save();
      req.flash("success", "Information saved successfully.");
      res.redirect(`/user/dashboard/${savedPatient.accountId}`);
    } catch (err) {
      next(err);
    }
  });
router
  .route("/dashboard/:id")
  .get(ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.params.id;
      const userData = await Patient.findOne({ accountId: userId });
      const dietData = await DietPlan.findOne({ accountId: userId });
      console.log("YUo are gone")
      const counselingData = await CounselingRequest.findOne({
        accountId: userId,
      });
      if (!userData) {
        req.flash("error", "No user data found");
        res.redirect("/user/info");
      }
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
    res.render("dietplans");
  })
  .post(ensureAuthenticated, validateDietPlan, async (req, res, next) => {
    try {
      const userId = req.user._id;
      const userData = await Patient.findOne({ accountId: userId });
      if (!userData) {
        req.flash("error", "User is not properly registered");
        return res.redirect("/user/info");
      }
      if (userData.admittanceStatus === "Rejected") {
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
        await Patient.findOneAndUpdate(
          { accountId: userId },
          { admittanceStatus: "Pending Approval" }
        );
        console.log("saved diet plan");
        req.flash("success", "Successfully subscribed to the diet plan.");
        await sendDietPlanRequest(plan, userData);
        res.redirect(`/user/dashboard/${userData.accountId}`);
      } else {
        req.flash("error", "User is already subscribed to a diet plan.");
        return res.redirect(`/user/dashboard/${userData.accountId}`);
      }
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
        await DietPlan.findOneAndDelete({ accountId: id });
        req.flash("success", "Diet plan removed Successfully!");
        res.redirect(`/user/dashboard/${id}`);
        break;
      case "counseling":
        await CounselingRequest.findOneAndDelete({ accountId: id });
        req.flash("success", "Counseling Session removed Successfully!");
        res.redirect(`/user/dashboard/${id}`);
        break;
      default:
        req.flash("error", "Invalid opoeration");
        res.redirect(`/user/dashboard/${id}`);
        break;
    }
  } catch (err) {
    next(err);
  }
});
router
  .route("/contact-us")
  .get((req, res) => {
    res.render("contactUs");
  })
  .post(validateContactUs, async (req, res) => {
    try {
      const { email, message } = req.body;
      await sendContactEmail(email, message);
      req.flash("success", "Message Sent Successfully.");
      res.redirect("/user/contact-us");
    } catch (err) {
      req.flash("error", "Error sending email! Please try again.");
      res.redirect("/user/contact-us");
    }
  });
module.exports = router;
