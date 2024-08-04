const Joi = require("joi");

const userSchema = Joi.object({
  Username: Joi.string().min(3).max(30).required(),
  Email: Joi.string().email().required(),
  Password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).required(),
}).xor("username", "email");

const patientSchema = Joi.object({
  email: Joi.string().trim().email().optional(),
  lastName: Joi.string().required(),
  firstName: Joi.string().required(),
  age: Joi.number().required(),
  weight: Joi.number().required(),
  height: Joi.number().required(),
  physicalActivity: Joi.string().required(),
  allergy: Joi.string().optional(),
  phoneNumber: Joi.string().required(),
  gender: Joi.string().required(),
  message: Joi.string().optional(),
});

const dietPlanSchema = Joi.object({
  dietType: Joi.string().required(),
  duration: Joi.number().required(),
});

const counselingRequestSchema = Joi.object({
  fullname: Joi.string().required().min(3).max(255),
  reason: Joi.string().required(),
  date: Joi.date().required(),
});

const forgetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().min(6).required(),
});
const contactUsSchema = Joi.object({
  email: Joi.string().email().required(),
  message: Joi.string().required(),
});

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(req.originalUrl);
  }
  next();
};
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(req.originalUrl);
  }
  next();
};

const validatePatient = (req, res, next) => {
  const { error } = patientSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(req.originalUrl);
  }
  next();
};

const validateDietPlan = (req, res, next) => {
  const { error } = dietPlanSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(req.originalUrl);
  }
  next();
};
const validateCounselingRequest = (req, res, next) => {
  const { error } = counselingRequestSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(req.originalUrl);
  }
  next();
};
const validateForgetPassword = (req, res, next) => {
  const { error } = forgetPasswordSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(req.originalUrl);
  }
  next();
};
const validateContactUs = (req, res, next) => {
  const { error } = contactUsSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(req.originalUrl);
  }
  next();
};

module.exports = {
  validateUser,
  validatePatient,
  validateDietPlan,
  validateCounselingRequest,
  validateLogin,
  validateForgetPassword,
  validateContactUs
};
