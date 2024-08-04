const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const validPhysicalActivities = [
  "none",
  "Light",
  "Moderate",
  "Active",
  "Very Active",
];
const validAdmittanceStatuses = ["Pending Approval", "Accepted", "Rejected"];

const patientSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  physicalActivity: {
    type: String,
    required: true,
    enum: validPhysicalActivities,
  },
  allergy: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  dietType: {
    type: String,
    required: false,
  },
  message: {
    type: String,
    required: false,
  },

  admittanceStatus: {
    type: String,
    required: true,
    default: "Rejected",
    enum: validAdmittanceStatuses,
  },

  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});
patientSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  next();
});

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
