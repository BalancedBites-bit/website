const express = require("express");
const path = require("path");
const morgan = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const flash = require("connect-flash");
const crypto = require("crypto");
const Joi = require("joi");

const User = require("./Model/user");
const Patient = require("./Model/patient");
const sendOTP = require("./email");
const userSchema = Joi.object({
  Username: Joi.string().min(3).max(30).required(),
  Email: Joi.string().email().required(),
  Password: Joi.string().min(6).required(),
});

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(  
    {
      usernameField: "login",
      passwordField: "password",
    },
    async (login, password, done) => {
      try {
        const user = await User.findOne({
          $or: [{ username: login }, { email: login.toLowerCase()}],
        });
        if (!user)
          return done(null, false, {
            message: "Incorrect Username/Email or password.",
          });

        const isValidPassword = await user.authenticate(password);
        if (!isValidPassword.user)
          return done(null, false, {
            message: "Incorrect Username/Email or password.",
          });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash("error", "Please log in to access this page.");
  res.redirect("/my-website/login");
};

const checkAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "Admin") return next();
  req.flash("error", "Unauthorized Access.");
  res.status(403).send("Unauthorized Access.");
};

mongoose
  .connect("mongodb://localhost:27017/Nutrition")
  .then(() => console.log("Database connection successful"))
  .catch((error) => console.error("Connection interrupted!", error));

app.use((req, res, next) => {
  if (!req.session.otpAttempts) req.session.otpAttempts = 0;
  if (!req.session.otpTimestamp) req.session.otpTimestamp = Date.now();
  next();
});

const checkOTPAccess = (req, res, next) => {
  if (
    ["adminLogin", "userRegister", "resetPassword"].includes(
      req.session.otpContext
    )
  ) {
    return next();
  }
  req.flash("error", "Unauthorized access to OTP verification.");
  res.redirect("/my-website/login");
};

const checkOTPCompleted = (req, res, next) => {
  if (req.session.otpVerified) {
    req.flash("error", "OTP already verified.");
    return res.redirect("/my-website/register");
  }
  next();
};

app.get("/", (req, res) => res.render("index"));

app
  .route("/my-website/login")
  .get((req, res) => res.render("login"))
  .post((req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        req.flash("error", info.message);
        return res.redirect("/my-website/login");
      }
      req.login(user, async (err) => {
        if (err) return next(err);
        if (req.user.role === "Admin") {
          const otp = crypto.randomInt(1000, 9999).toString();
          req.session.otp = otp;
          req.session.userData = { Email: user.email };
          console.log(req.session.userDatars);
          req.session.otpContext = "adminLogin";
          await sendOTP(user.email, otp);
          req.flash(
            "success",
            "OTP sent to your email. Please check your inbox."
          );
          return res.redirect("/my-website/verify-otp");
        } else {
          const recordExist = await Patient.findOne({ accountId: user._id });
          req.flash("success", "Successfully logged in! Welcome");
          res.redirect(recordExist ? `/dashboard/${recordExist._id}` : "/info");
        }
      });
    })(req, res, next);
  });

app
  .route("/my-website/forgot-password")
  .get((req, res) => res.render("forgotPassword"))
  .post(async (req, res) => {
    const { email } = req.body;
    const userFound = await User.findOne({ email });
    if (!userFound) {
      req.flash("error", "Email not found.");
      return res.redirect("/my-website/forgot-password");
    }
    const otp = crypto.randomInt(1000, 9999).toString();
    req.session.otp = otp;
    req.session.otpContext = "resetPassword";
    req.session.userData = { Email: email };
    await sendOTP(email, otp);
    req.flash("success", "OTP sent to your email. Please check your inbox.");
    res.redirect("/my-website/verify-otp");
  });

app
  .route("/my-website/reset-password")
  .get((req, res) => {
    if (!req.session.otpVerified) {
      req.flash("error", "Unauthorized access to password reset.");
      return res.redirect("/my-website/login");
    }
    res.render("resetPassword");
  })
  .post(async (req, res, next) => {
    try {
      const { password, confirmPassword } = req.body;
      if (password !== confirmPassword) {
        req.flash("error", "Passwords do not match.");
        return res.redirect("/my-website/reset-password");
      }
      const email = req.session.userData.Email;
      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/my-website/reset-password");
      }
      await user.setPassword(password);
      await user.save();
      req.session.otp = null;
      req.session.otpContext = null;
      req.session.userData = null;
      req.session.otpVerified = false;
      req.flash("success", "Password reset successful.");
      res.redirect("/my-website/login");
    } catch (e) {
      next(e);
    }
  });

app
  .route("/my-website/register")
  .get((req, res) => res.render("register"))
  .post(async (req, res, next) => {
    try {
      const { error } = userSchema.validate(req.body);
      if (error) {
        req.flash("error", error.details[0].message);
        return res.redirect("/my-website/register");
      }

      const { Email, Username, Password } = req.body;
      const existingUser = await User.findOne({
        $or: [{ email: Email }, { username: Username }],
      });

      if (existingUser) {
        req.flash("error", "Username or email already in use");
        return res.redirect("/my-website/register");
      }

      const otp = crypto.randomInt(1000, 9999).toString();
      req.session.otp = otp;
      req.session.userData = { Email, Username, Password };
      req.session.otpContext = "userRegister";
      console.log(otp);

      await sendOTP(Email, otp);
      req.flash("success", "OTP sent to your email. Please check your inbox.");
      res.redirect("/my-website/verify-otp");
    } catch (e) {
      next(e);
    }
  });

app
  .route("/my-website/verify-otp")
  .get(checkOTPAccess, checkOTPCompleted, (req, res) => {
    const currentTime = Date.now();
    const elapsed = currentTime - req.session.otpTimestamp;
    if (elapsed > 60000) {
      req.flash("error", "OTP expired. Please request a new one.");
      return res.redirect("/my-website/resend-otp");
    }
    res.render("verifyOtp", { otpContext: req.session.otpContext });
  })
  .post(checkOTPAccess, async (req, res) => {
    const { otp } = req.body;
    const currentTime = Date.now();
    const elapsed = currentTime - req.session.otpTimestamp;

    if (elapsed > 300000) {
      req.flash("error", "OTP expired. Please request a new one.");
      return res.redirect("/my-website/resend-otp");
    }

    if (req.session.otpAttempts >= 8) {
      req.flash("error", "Maximum attempts reached. Please try again Later.");
      return res.redirect("/my-website/resend-otp");
    }

    if (otp === req.session.otp) {
      req.session.otpVerified = true;
      req.session.otp = null;
      req.session.otpAttempts = 0;

      switch (req.session.otpContext) {
        case "adminLogin":
          req.flash("success", "OTP verified successfully.");
          const recordExist = await Patient.findOne({
            accountId: req.user._id,
          });
          return res.redirect(
            recordExist ? `/dashboard/${recordExist._id}` : "/info"
          );
        case "resetPassword":
          return res.redirect("/my-website/reset-password");
        case "userRegister":
          const { Email, Username, Password } = req.session.userData;
          const newUser = new User({ email: Email, username: Username });
          await User.register(newUser, Password);
          req.flash("success", "OTP verified. Registration successful.");
          req.session.otpContext = null;
          req.session.userData = null;
          req.session.otpVerified = false;
          return res.redirect("/my-website/login");
        default:
          req.flash("error", "Invalid OTP context.");
          return res.redirect("/my-website/login");
      }
    } else {
      req.session.otpAttempts++;
      req.flash("error", "Invalid OTP. Please try again.");
      res.redirect("/my-website/verify-otp");
    }
  });

app.get("/my-website/resend-otp", checkOTPAccess, async (req, res) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  req.session.otp = otp;
  req.session.otpAttempts = 0;
  req.session.otpTimestamp = Date.now();

  await sendOTP(req.session.userData.Email, otp);
  req.flash("success", "OTP resent. Please check your inbox.");
  res.redirect("/my-website/verify-otp");
});

app.get("/my-website/resend-otp", async (req, res, next) => {
  if (req.session.otpAttempts >= 5) {
    req.flash(
      "error",
      "Maximum OTP resend attempts reached. Please try again later."
    );
    return res.redirect("/my-website/register");
  }

  const currentTime = Date.now();
  const elapsed = currentTime - req.session.otpTimestamp;

  if (elapsed > 60000) {
    const { Email } = req.session.userData;
    const otp = crypto.randomInt(1000, 9999).toString();
    req.session.otp = otp;
    req.session.otpTimestamp = Date.now();
    req.session.otpAttempts += 1;

    try {
      await sendOTP(Email, otp);
      req.flash("success", "New OTP sent to your email.");
      res.redirect("/my-website/verify-otp");
    } catch (e) {
      next(e);
    }
  } else {
    req.flash("error", "Please wait before requesting a new OTP.");
    res.redirect("/my-website/verify-otp");
  }
});

app
  .route("/info")
  .get(ensureAuthenticated, (req, res) => res.render("infoPage"))
  .post(ensureAuthenticated, async (req, res, next) => {
    const newPatientData = {
      ...req.body,
      email: req.user.email,
      accountId: req.user._id,
    };
    const newPatient = new Patient(newPatientData);
    try {
      const savedPatient = await newPatient.save();
      req.flash("success", "Information saved successfully.");
      res.redirect(`/dashboard/${savedPatient._id}`);
    } catch (err) {
      next(err);
    }
  });

app.route("/dashboard/:id").get(ensureAuthenticated, async (req, res, next) => {
  try {
    const userData = await Patient.findById(req.params.id);
    if (!userData) return res.status(404).send("User not found");
    const isOwner = req.user._id.equals(userData.accountId);
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      req.flash("error", "Unauthorized Access.");
      return res.redirect("/my-website/login");
    }
    res.render("dashboard", { userData, isOwner });
  } catch (err) {
    next(err);
  }
});

app
  .route("/edit-info/:id")
  .get(ensureAuthenticated, async (req, res) => {
    try {
      const userData = await Patient.findById(req.params.id);
      if (!userData) return res.status(404).send("User not found");

      if (!req.user._id.equals(userData.accountId)) {
        req.flash("error", "Unauthorized Acess.");
        res.redirect("/my-website/login");
      }
      res.render("editInfo", { userData });
    } catch (err) {
      next(err);
    }
  })
  .put(ensureAuthenticated, async (req, res, next) => {
    try {
      await Patient.findByIdAndUpdate(req.params.id, req.body);
      req.flash("success", "Patient information updated successfully.");
      res.redirect(`/dashboard/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  });

app
  .route("/dietplan")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "public/Html/g.html"));
  })
  .post(async (req, res) => {
    // const user = await Patient.findById(req.user._id)
    const subscribedPlan = req.body;
    res.send(subscribedPlan);
  });

app.route("/admin").get(checkAdmin, async (req, res, next) => {
  try {
    const patientData = await Patient.find({});
    res.render("admin", { patientData });
  } catch (err) {
    next(err);
  }
});

app.put("/admin/admissionStatus/:id", checkAdmin, async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Patient.findByIdAndUpdate(
      id,
      { $set: { admittanceStatus: status } },
      { new: true }
    );
    req.flash("success", "Admittance status updated successfully.");
    res.redirect("/admin");
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  req.flash("error", "Something went wrong. Please try again later.");
  res.redirect("/my-website/login");
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
