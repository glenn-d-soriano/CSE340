// Needed for Express router and error handling utility
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/"); // Assuming your utilities are here

router.get("/test", (req, res) => {
  res.send("Test route works!");
});
// Route to handle the base path /account and redirect to login
router.get("/", (req, res) => {
    res.redirect("/account/login")
})

// Route to build login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Route to build the new registration view (GET to display the form)
router.get("/register", utilities.handleErrors(accountController.buildRegister)); 

// Route to register a new account (POST to process the form submission)
router.post("/register", utilities.handleErrors(accountController.registerAccount)); // <--- NEW POST ROUTE

module.exports = router;