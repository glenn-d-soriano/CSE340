// Import utilities and express-validator
const utilities = require(".");
const { body, validationResult } = require("express-validator");

// Create a validate object to hold all validation rules
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

    // Email: required, sanitized, valid format
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()           // Must be a valid email
      .normalizeEmail()    // Canonicalize email
      .withMessage("A valid email is required."),

    // Password: required, sanitized, strong password
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
    return res.render("account/register", {
      errors,
      title: "Register",
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
 * Export validate object
 * *************************************** */
module.exports = validate;
