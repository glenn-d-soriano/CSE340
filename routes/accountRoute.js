// Needed for Express router and error handling utility
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/"); // Contains checkLogin and handleErrors
const regValidate = require("../utilities/account-validation"); // single import

// Test route
router.get("/test", (req, res) => {
  res.send("Test route works!");
});

// Default route for account management view (Protected)
// Access: /account/
router.get("/", 
    utilities.checkLogin, // Middleware checks for valid JWT/session
    utilities.handleErrors(accountController.buildAccountManagement)
);

// Build login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Build registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Route to log the user out
// Access: /account/logout
router.get("/logout", utilities.handleErrors(accountController.accountLogout));


// **********************************************
// NEW: Routes for Account Information Update
// **********************************************

// Route to build the Account Update view (Protected)
// Path changed to /update-account-info (ID is read from session/JWT in controller)
router.get(
  "/update-account-info", 
  utilities.checkLogin, 
  utilities.handleErrors(accountController.buildAccountUpdateView)
);

// POST route to process the Account Update request (Information)
router.post(
  "/update",
  utilities.checkLogin,
  regValidate.updateAccountRules(),  // Validation rules for name/email
  regValidate.checkUpdateData,       // Check and re-render if validation fails
  utilities.handleErrors(accountController.updateAccount)
);


// **********************************************
// NEW: Route for Password Change
// **********************************************

// POST route to process the Password Change request
router.post(
  "/change-password",
  utilities.checkLogin,
  regValidate.changePasswordRules(),  // Validation rules for new password (complexity)
  // NOTE: checkPasswordData middleware is skipped because the controller (changePassword)
  // handles both new password validation errors and the current password check, 
  // allowing for correct re-rendering of the sticky form data.
  utilities.handleErrors(accountController.changePassword)
);


// POST route to register a new account (with validation + stickiness + controller)
router.post(
  "/register",
  regValidate.registrationRules(),  // Apply sanitization + validation rules
  regValidate.checkRegData,         // Handle errors & stickiness
  utilities.handleErrors(accountController.registerAccount) // Controller runs if valid
);

// POST route to process the login request
router.post(
  "/login",
  regValidate.loginRules(), // Apply sanitization + validation rules for login
  regValidate.checkLoginData, // Handle errors & stickiness for login
  utilities.handleErrors(accountController.accountLogin) // Controller runs if valid
);

module.exports = router;