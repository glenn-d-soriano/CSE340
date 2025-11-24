// Needed for Express router and error handling utility
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/");
const regValidate = require("../utilities/account-validation"); // single import

// Test route
router.get("/test", (req, res) => {
  res.send("Test route works!");
});

// Redirect base /account to login
router.get("/", (req, res) => {
  res.redirect("/account/login");
});

// Build login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Build registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// POST route to register a new account (with validation + stickiness + controller)
router.post(
  "/register",
  regValidate.registrationRules(),  // Apply sanitization + validation rules
  regValidate.checkRegData,         // Handle errors & stickiness
  utilities.handleErrors(accountController.registerAccount) // Controller runs if valid
);

module.exports = router;
