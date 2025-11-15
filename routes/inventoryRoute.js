// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController") // Now correctly requires 'invControllers'
const utilities = require("../utilities/") // Required for error handling

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route to build the single vehicle detail view
// This route will call the function 'buildByInvId' or 'buildByInventoryId' from invControllers.js
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInvId)) // Keeping the original function name

// Task 3: New route to intentionally cause a 500 server error
// This route directs traffic through a controller function which throws an error,
// and the error is caught by the global error handler middleware.
router.get("/error", utilities.handleErrors(invController.triggerError))

module.exports = router;