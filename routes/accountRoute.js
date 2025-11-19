// routes/accountRoute.js

// Needed Resources
const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController") // Require the controller
const utilities = require("../utilities/") // Required for error handling

/* ****************************************
 *  GET login view
 * *************************************** */
router.get("/", utilities.handleErrors(accountController.buildLogin))

module.exports = router
