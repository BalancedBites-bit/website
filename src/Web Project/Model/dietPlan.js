const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const validateServiceRequest = ["None", "Pending", "Verified"];
const dietPlanSchema = new Schema({
  dietType: {
    type: String,
    default: "none",
    required: true,
  },
  duration: {
    type: Number,
    default: 0,
    required: true,
  },
  paymentStatusVerification: {
    type: String,
    default: "None",
    enum: validateServiceRequest,
    required: true,
  },

  dateJoined: {
    type: Date,
    default: Date.now,
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const DietPlan = mongoose.model("DietPlan", dietPlanSchema);

module.exports = DietPlan;
