// Required Resources
const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities/");
const invValidation = require("../utilities/inventory-validation");

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
// INVENTORY MANAGEMENT VIEW
// ---------------------------
router.get("/", utilities.handleErrors(invController.buildManagementView));

module.exports = router;
