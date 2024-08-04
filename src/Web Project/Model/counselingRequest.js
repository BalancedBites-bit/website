const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const counselingRequestSchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    require: true,
  },
  reason: {
    type: String,
    default: "none",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  status: {
    type: String,
    default: "None",
    required: true,
    enum: ["None", "Pending Approval", "Accepted", "Rejected"],
  },
  payment: {
    type: String,
    default: "None",
    required: true,
    enum: ["None", "Pending", "Verified"],
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const CounselingRequest = mongoose.model(
  "CounselingRequest",
  counselingRequestSchema
);

module.exports = CounselingRequest;
