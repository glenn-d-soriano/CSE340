// Required Resources
const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities/");
const invValidation = require("../utilities/inventory-validation");

// ---------------------------
// INVENTORY MANAGEMENT VIEW
// ---------------------------
router.get("/", utilities.handleErrors(invController.buildManagementView));

// ---------------------------
// GET INVENTORY JSON (NEW ROUTE FOR AJAX)
// ---------------------------
// Route to return inventory by classification for the management select tool 
// Access: site-name/inv/getInventory/:classification_id
router.get(
  "/getInventory/:classification_id",
  utilities.handleErrors(invController.getInventoryJSON)
);

// ---------------------------
// ADD CLASSIFICATION
// ---------------------------
router.get(
  "/add-classification",
  utilities.handleErrors(invController.buildAddClassification)
);

router.post(
  "/add-classification",
  invValidation.classificationRules(),
  invValidation.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
);

// ---------------------------
// ADD INVENTORY
// ---------------------------
router.get(
  "/add-inventory",
  utilities.handleErrors(invController.buildAddInventory)
);

router.post(
  "/add-inventory",
  invValidation.inventoryRules(),
  invValidation.checkInventoryData,
  utilities.handleErrors(invController.addInventory)
);

// ---------------------------
// INVENTORY BY CLASSIFICATION
// ---------------------------
router.get(
  "/classification/:classificationId",
  utilities.handleErrors(invController.buildByClassificationId)
);

// ---------------------------
// VEHICLE DETAIL
// ---------------------------
router.get(
  "/detail/:invId",
  utilities.handleErrors(invController.buildByInvId)
);

// ---------------------------
// ERROR TEST
// ---------------------------
router.get("/error", utilities.handleErrors(invController.triggerError));


module.exports = router;