const express = require("express"),
  Patient = require("../../Model/patient"),
  CounselingRequest = require("../../Model/counselingRequest"),
  DietPlan = require("../../Model/dietPlan"),
  {
    ensureAuthenticated: e,
    checkAdmin: a,
  } = require("../middlewares/authentication"),
  {
    sendCounselingSessionAcceptance: t,
    sendCounselingSessionRejection: n,
    sendDietPlanAcceptance: i,
    sendDietPlanRejection: s,
  } = require("../../email"),
  router = express.Router();
router.route("/admin").get(e, a, async (e, a, t) => {
  try {
    let n = await Patient.find({}),
      i = await CounselingRequest.find({});
    a.render("admin", { patientData: n, counselingData: i });
  } catch (s) {
    t(s);
  }
}),
  router.put(
    "/admin/admissionStatus/:action/:id/:context",
    e,
    a,
    async (e, a, d) => {
      try {
        let { action: c, id: r, context: u } = e.params,
          o = "accept" === c ? "Accepted" : "Rejected",
          l = "accept" === c,
          f = Patient.findOneAndUpdate(
            { accountId: r },
            { $set: { admittanceStatus: o } },
            { new: !0 }
          ),
          p = l
            ? DietPlan.findOneAndUpdate(
                { accountId: r },
                { paymentStatusVerification: "None" }
              )
            : DietPlan.findOneAndDelete({ accountId: r }),
          m = l
            ? CounselingRequest.findOneAndUpdate(
                { accountId: r },
                { $set: { status: o, payment: "None" } },
                { new: !0 }
              )
            : CounselingRequest.findOneAndDelete({ accountId: r });
        if ("dietplan" === u) {
          let w = await DietPlan.findOne({ accountId: r }),
            O = await Patient.findOne({ accountId: r });
          w &&
            (l
              ? (await Promise.all([f, p]), await i(w, O))
              : (await m, await s(w, O)));
        } else {
          if ("counseling" !== u)
            return (
              e.flash("error", "Operation failed! Please try Again."),
              a.redirect("/main/admin")
            );
          let y = await CounselingRequest.findOne({ accountId: r });
          if (!y)
            return (
              e.flash("error", "Counseling request not found."),
              a.redirect("/main/admin")
            );
          l ? (await Promise.all([m]), await t(y)) : (await m, await n(y));
        }
        e.flash("success", "Operation successful."), a.redirect("/main/admin");
      } catch (g) {
        d(g);
      }
    }
  ),
  router.post("/verify-payment/:id/:context", e, a, async (e, a) => {
    try {
      let { id: t, context: n } = e.params;
      switch (n) {
        case "dietplan":
          await DietPlan.findOneAndUpdate(
            { accountId: t },
            { paymentStatusVerification: "Verified" }
          ),
            e.flash("success", "Operation Successful."),
            a.redirect("/main/admin");
          break;
        case "counseling":
          await CounselingRequest.findOneAndUpdate(
            { accountId: t },
            { payment: "Verified" }
          ),
            e.flash("success", "Operation Successful."),
            a.redirect("/main/admin");
          break;
        default:
          e.flash("error", "Operation failed."), a.redirect("/main/admin");
      }
    } catch (i) {
      e.flash("error", "Operation unsuccessful! Please try again."),
        a.redirect("/main/admin");
    }
  }),
  (module.exports = router);
