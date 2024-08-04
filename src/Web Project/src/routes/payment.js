const express = require("express");
const sharp = require("sharp");
const DietPlan = require("../../Model/dietPlan");
const CounselingRequest = require("../../Model/counselingRequest");
const { ensureAuthenticated } = require("../middlewares/authentication");
const { sendPaymentConfirmationEmail } = require("../../email");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();
router
  .route("/add/:id/:context")
  .get(ensureAuthenticated, (req, res) => {
    const userId = req.params.id;
    const context = req.params.context;
    res.render("paymentPage", { userId, context });
  })
  .post(ensureAuthenticated, upload.single("image"), async (req, res) => {
    if (!req.file) {
      req.flash("error", "No file uploaded.");
      return res.redirect("back");
    }
    try {
      const compressedImageBuffer = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();
      const context = req.params.context;
      const name = req.file.originalname;
      const email = req.user.email;
      await sendPaymentConfirmationEmail(email, compressedImageBuffer, name);
      switch (context) {
        case "dietplan":
          await DietPlan.findOneAndUpdate(
            { accountId: req.user._id },
            { $set: { paymentStatusVerification: "Pending" } },
            { new: !0 }
          );
          req.flash("success", "Operation successful.");
          break;
        case "counseling":
          await CounselingRequest.findOneAndUpdate(
            { accountId: req.user._id },
            { $set: { payment: "Pending" } },
            { new: !0 }
          );
          req.flash("success", "Operation successful.");
          break;
        default:
          req.flash("error", "Invalid context.");
          break;
      }
    } catch (err) {
      req.flash("error", "Error updating record. Please try again.");
      return res.redirect("back");
    }
    res.redirect(`/user/dashboard/${req.user._id}`);
  });
module.exports = router;
