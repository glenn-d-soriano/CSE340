// Required Resources
const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities/");
const invValidation = require("../utilities/inventory-validation");
// 1. IMPORT THE AUTHORIZATION MIDDLEWARE
const { checkEmployeeOrAdmin } = require("../middleware/check-authorization");

// ---------------------------
// INVENTORY MANAGEMENT VIEW
// ---------------------------
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get("/", 
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.buildManagementView)
);

// ---------------------------
// GET INVENTORY JSON (NEW ROUTE FOR AJAX)
// ---------------------------
// Route to return inventory by classification for the management select tool 
// Access: site-name/inv/getInventory/:classification_id
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get(
  "/getInventory/:classification_id",
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.getInventoryJSON)
);

// ---------------------------
// EDIT INVENTORY ITEM (STEP 1: GET)
// ---------------------------
// Route to build the edit inventory view
// Access: site-name/inv/edit/:inv_id
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get(
  "/edit/:inv_id",
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.editInventoryView) 
);

// ---------------------------
// UPDATE INVENTORY ITEM (STEP 2: POST)
// ---------------------------
// Route to process the inventory update form submission
// Access: site-name/inv/update
// *** PROTECTED PROCESS: Requires 'Employee' or 'Admin' ***
router.post(
  "/update",
  checkEmployeeOrAdmin, // <-- Authorization check
  invValidation.inventoryRules(), 
  invValidation.checkUpdateData,
  utilities.handleErrors(invController.updateInventory) 
);


// ---------------------------
// ADD CLASSIFICATION
// ---------------------------
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get(
  "/add-classification",
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.buildAddClassification)
);

// *** PROTECTED PROCESS: Requires 'Employee' or 'Admin' ***
router.post(
  "/add-classification",
  checkEmployeeOrAdmin, // <-- Authorization check
  invValidation.classificationRules(),
  invValidation.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
);

// ---------------------------
// ADD INVENTORY
// ---------------------------
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get(
  "/add-inventory",
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.buildAddInventory)
);

// Route to process the inventory add form submission
// *** PROTECTED PROCESS: Requires 'Employee' or 'Admin' ***
router.post(
  "/add-inventory",
  checkEmployeeOrAdmin, // <-- Authorization check
  invValidation.inventoryRules(), 
  invValidation.checkInventoryData,
  utilities.handleErrors(invController.addInventory)
);

// ---------------------------
// DELETE INVENTORY ITEM
// ---------------------------
// Route to deliver the delete confirmation view
// Path: /inv/delete/:inv_id
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get("/delete/:inv_id", 
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.buildDeleteConfirmation)
);

// Route to handle the actual item deletion
// *** PROTECTED PROCESS: Requires 'Employee' or 'Admin' ***
router.post(
  "/delete/", 
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.deleteInventory)
);


// ---------------------------
// DELETE CLASSIFICATION
// ---------------------------
// NEW ROUTE: Build the delete confirmation view for a classification
// Path: /inv/delete-classification/:classificationId
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get(
  "/delete-classification/:classificationId",
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.buildDeleteClassification)
);

// NEW ROUTE: Process the classification deletion
// Path: /inv/delete-classification
// *** PROTECTED PROCESS: Requires 'Employee' or 'Admin' ***
router.post(
  "/delete-classification",
  checkEmployeeOrAdmin, // <-- Authorization check
  utilities.handleErrors(invController.deleteClassification)
);


// ---------------------------
// INVENTORY BY CLASSIFICATION (PUBLIC)
// ---------------------------
router.get(
  "/classification/:classificationId",
  utilities.handleErrors(invController.buildByClassificationId)
);

// ---------------------------
// VEHICLE DETAIL (PUBLIC)
// ---------------------------
router.get(
  "/detail/:invId",
  utilities.handleErrors(invController.buildByInvId)
);

// ---------------------------
// ERROR TEST (PUBLIC)
// ---------------------------
router.get("/error", utilities.handleErrors(invController.triggerError));

module.exports = router;