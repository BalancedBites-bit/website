require("dotenv").config();
const express = require("express"),
  path = require("path"),
  morgan = require("morgan"),
  mongoose = require("mongoose"),
  session = require("express-session"),
  passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy,
  methodOverride = require("method-override"),
  ejsMate = require("ejs-mate"),
  flash = require("connect-flash"),
  crypto = require("crypto"),
  nodemailer = require("nodemailer"),
  MongoStore = require("connect-mongo"),
  cron = require("node-cron"),
  User = require("./Model/user"),
  Patient = require("./Model/patient"),
  { sendOTP: e } = require("./email"),
  {
    ensureAuthenticated: s,
  } = require("./src/middlewares/authentication"),
  adminRouter = require("./src/routes/admin"),
  otpRouter = require("./src/routes/otp"),
  counselingRouter = require("./src/routes/counselingSession"),
  passwordRouter = require("./src/routes/resetPassword"),
  userRouter = require("./src/routes/user"),
  paymentRoute = require("./src/routes/payment"),
  CounselingRequest = require("./Model/counselingRequest"),
  app = express();
app.use(express.urlencoded({ extended: !0 })),
  app.use(methodOverride("_method")),
  app.use(morgan("dev")),
  app.use(express.static(path.join(__dirname, "public"))),
  app.engine("ejs", ejsMate),
  app.set("view engine", "ejs"),
  app.set("views", path.join(__dirname, "src/Views"));
const store = MongoStore.create({
  mongoUrl: process.env.dbUrl,
  collectionName: "sessions",
  ttl: 1209600,
});
app.use(
  session({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: 12096e5
    }
  })
),
  app.use(flash()),
  app.use(passport.initialize()),
  app.use(passport.session()),
  passport.use(
    new LocalStrategy(
      { usernameField: "login", passwordField: "password" },
      async (e, s, r) => {
        try {
          let o = await User.findOne({
            $or: [{ username: e }, { email: e.toLowerCase() }],
          });
          if (!o)
            return r(null, !1, {
              message: "Incorrect Username/Email or password.",
            });
          let t = await o.authenticate(s);
          if (!t.user)
            return r(null, !1, {
              message: "Incorrect Username/Email or password.",
            });
          return r(null, o);
        } catch (a) {
          return r(a);
        }
      }
    )
  ),
  passport.serializeUser(User.serializeUser()),
  passport.deserializeUser(User.deserializeUser()),
  app.use((e, s, r) => {
    (s.locals.success = e.flash("success")),
      (s.locals.error = e.flash("error")),
      (s.locals.userId = e.user ? e.user._id.toString() : "none"),
      (s.locals.userRole = e.user ? e.user.role : "none"),
      r();
  }),
  mongoose
    .connect(process.env.dbUrl)
    .then(() => console.log("Database connection successful"))
    .catch((e) => console.error("Connection interrupted!", e)),
  cron.schedule("0 0 * * *", async (e) => {
    let s = new Date();
    try {
      let r = await CounselingRequest.find({ date: { $lt: s } });
      r.forEach((e) => {
        sendEmail(e.email, e);
      });
      let o = await CounselingRequest.deleteMany({ date: { $lt: s } });
      console.log(`Deleted ${o.deletedCount} expired sessions.`);
    } catch (t) {
      console.error("Error deleting expired sessions:", t);
    }
  }),
  app.get("/", (e, s) => s.render("index"));
app.use("/main", adminRouter),
  app.use("/counseling", counselingRouter),
  app.use("/otp", otpRouter),
  app.use("/password", passwordRouter),
  app.use("/user", userRouter),
  app.use("/payment", paymentRoute),
  app
    .route("/login")
    .get((e, s) => s.render("login"))
    .post((s, r, o) => {
      passport.authenticate("local", (t, a, n) =>
        t
          ? o(t)
          : a
          ? void s.login(a, async (t) => {
              if (t) return o(t);
              if ("Admin" === s.user.role) {
                let n = crypto.randomInt(1e3, 9999).toString();
                return (
                  (s.session.otp = n),
                  (s.session.userData = { Email: a.email.toLowerCase() }),
                  (s.session.otpContext = "adminLogin"),
                  await e(a.email.toLowerCase(), n),
                  s.flash(
                    "success",
                    "OTP sent to your email. Please check your inbox."
                  ),
                  r.redirect("otp/verify")
                );
              }
              {
                let i = await Patient.findOne({ accountId: a._id });
                s.flash("success", "Successfully logged in! Welcome"),
                  r.redirect(
                    i ? `/user/dashboard/${i.accountId}` : "/user/info"
                  );
              }
            })
          : (s.flash("error", n.message), r.redirect("/login"))
      )(s, r, o);
    }),
  app
    .route("/register")
    .get((e, s) => s.render("register"))
    .post(async (s, r, o) => {
      try {
        let { Email: t, Username: a, Password: n } = s.body,
          i = await User.findOne({
            $or: [{ email: t.toLowerCase() }, { username: a }],
          });
        if (i)
          return (
            s.flash("error", "Username or email already in use"),
            r.redirect("/register")
          );
        let l = crypto.randomInt(1e3, 9999).toString();
        (s.session.otp = l),
          (s.session.userData = { Email: t, Username: a, Password: n }),
          (s.session.otpContext = "userRegister"),
  
          await e(t.toLowerCase(), l),
          s.flash(
            "success",
            "OTP sent to your email. Please check your inbox."
          ),
          r.redirect("/otp/verify");
      } catch (u) {
        o(u);
      }
    }),
  app.route("/logout").post(s, async (e, s, r) => {
    e.logout((o) => {
      if (o) return r(o);
      e.flash("success", "Successfully logged out."), s.redirect("/login");
    });
  }),
  app.use((e, s) => {
    s.status(404).render("norouteerror");
  }),
  app.use((e, s, r, o) => {
    console.error(e.stack), r.status(500).render("genericerror");
  });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port 3000"));
