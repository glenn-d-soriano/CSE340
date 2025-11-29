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
// FIX: Add utilities.checkLogin middleware. If logged out, it will redirect to /account/login
router.get("/", 
    utilities.checkLogin, // Middleware checks for valid JWT/session
    utilities.handleErrors(accountController.buildAccountManagement)
);

// Build login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Build registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Route to log the user out (NEW)
// Access: /account/logout
router.get("/logout", utilities.handleErrors(accountController.accountLogout));


// **********************************************
// NEW: Routes for Account Information Update
// **********************************************

// Route to build the Account Update view (Protected)
// Access: /account/update
router.get(
  "/update", 
  utilities.checkLogin, 
  utilities.handleErrors(accountController.buildAccountUpdateView)
);

// POST route to process the Account Update request
router.post(
  "/update",
  utilities.checkLogin,
  regValidate.updateAccountRules(),  // Requires implementation in account-validation.js
  regValidate.checkUpdateData,       // Requires implementation in account-validation.js
  utilities.handleErrors(accountController.updateAccount)
);


// **********************************************
// NEW: Route for Password Change
// **********************************************

// POST route to process the Password Change request
router.post(
  "/change-password",
  utilities.checkLogin,
  regValidate.changePasswordRules(),  // Requires implementation in account-validation.js
  regValidate.checkPasswordData,     // Requires implementation in account-validation.js
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