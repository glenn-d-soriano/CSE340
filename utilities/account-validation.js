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

    // Password: required, strong password check
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
 * Login Data Validation Rules
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
    
    // Password: required 
    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required."),
  ];
};

/* ******************************
 * Check data and return errors or continue to login
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
 * Account Update Data Validation Rules (NEW)
 * *************************************** */
validate.updateAccountRules = () => {
  return [
    // Firstname: required, sanitized, and minimum length
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    // Lastname: required, sanitized, and minimum length
    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),

    // Email: required, sanitized, valid format, and must not exist for another user
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email, { req }) => {
        const account_id = req.body.account_id;
        const accountData = await accountModel.getAccountById(account_id);

        // Check if the submitted email is the same as the current email
        if (account_email !== accountData.account_email) {
          // If different, check if the new email exists in the DB (for a different user)
          const emailExists = await accountModel.checkExistingEmail(account_email);
          if (emailExists) {
            throw new Error("This email is already in use by another account.");
          }
        }
      }),
  ];
};

/* ******************************
 * Check data and return errors or continue to account update (NEW)
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email, account_id } = req.body;
  let errors = validationResult(req);
  let nav = await utilities.getNav();

  if (!errors.isEmpty()) {
    // Re-render the update form with errors and sticky data
    return res.render("account/account-update", {
      errors: errors.array(),
      title: "Edit Account",
      nav,
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    });
  }
  next();
};

/* ****************************************
 * Password Change Data Validation Rules (NEW)
 * *************************************** */
validate.changePasswordRules = () => {
  return [
    // Current Password: required (checked against DB in controller)
    body("current_password")
      .trim()
      .notEmpty()
      .withMessage("Current password is required to change your password."),

    // New Password: required, strong password check
    body("new_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("New password does not meet requirements."),
  ];
};

/* ******************************
 * Check data and return errors or continue to password change (NEW)
 * ***************************** */
validate.checkPasswordData = async (req, res, next) => {
  const { account_id } = req.body;
  let errors = validationResult(req);
  let nav = await utilities.getNav();

  if (!errors.isEmpty()) {
    // If validation fails, we need to fetch the user's existing info (since they only submitted password data)
    const accountData = await accountModel.getAccountById(account_id);

    // Re-render the update form with errors, but populate the name/email from the DB fetch
    return res.render("account/account-update", {
      errors: errors.array(),
      title: "Edit Account",
      nav,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      account_id,
    });
  }
  next();
};


/* ****************************************
 * Export validate object
 * *************************************** */
module.exports = validate;