const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  role: {
    type: String,
    required: true,
    default: "User",
  },
  resetPassword: {
    token: String,
    expirydate: Date,
  },
});

// Pre-save hook to convert email to lowercase
UserSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  next();
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", UserSchema);

module.exports = User;
