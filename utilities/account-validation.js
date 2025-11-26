// Import utilities and express-validator
const utilities = require(".");
const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model"); // Need this for custom email validation
const validate = {};

/* ****************************************
 * Registration Data Validation Rules
 * *************************************** */
validate.registrationRules = () => {
  return [
    // Firstname: required, sanitized, and minimum length
    body("account_firstname")
      .trim()             // Remove leading/trailing whitespace
      .escape()           // Escape HTML special characters
      .notEmpty()         // Must not be empty
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    // Lastname: required, sanitized, and minimum length
    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),

    // Email: required, sanitized, valid format, and must not exist
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()           // Must be a valid email
      .normalizeEmail()    // Canonicalize email
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email);
        if (emailExists) {
          throw new Error("Email already exists. Please log in or use a different email.");
        }
      }),

    // Password: required, strong password check (no need for .trim().notEmpty() here 
    // since isStrongPassword handles emptiness, but keeping for clarity)
    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
};

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    // Return with errors and sticky form data
    return res.render("account/register", {
      errors: errors.array(), // Use errors.array() for cleaner display in EJS
      title: "Registration",
      nav,
      account_firstname,   // Stickiness: re-populate first name
      account_lastname,    // Stickiness: re-populate last name
      account_email,       // Stickiness: re-populate email
    });
  }

  // If no validation errors, proceed to the controller
  next();
};

/* ****************************************
 * Login Data Validation Rules (NEW CODE ADDED)
 * *************************************** */
validate.loginRules = () => {
  return [
    // Email: required, sanitized, valid format
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),
    
    // Password: required (we don't check for complexity here, only presence/format)
    // NOTE: The server will verify the password against the hash later in the controller.
    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required."),
  ];
};

/* ******************************
 * Check data and return errors or continue to login (NEW CODE ADDED)
 * ***************************** */
validate.checkLoginData = async (req, res, next) => {
  const { account_email } = req.body;
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    // Return with errors and sticky form data
    return res.render("account/login", {
      errors: errors.array(), // Use errors.array()
      title: "Login",
      nav,
      account_email,       // Stickiness: re-populate email
    });
  }

  // If no validation errors, proceed to the controller
  next();
};


/* ****************************************
 * Export validate object
 * *************************************** */
module.exports = validate;