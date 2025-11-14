// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invControllers")

// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId);

// Route to build the single vehicle detail view
// Catches URL patterns like /inv/detail/1, /inv/detail/4, etc.
router.get("/detail/:invId", invController.buildByInvId)

module.exports = router;