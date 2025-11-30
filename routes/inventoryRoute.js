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
// EDIT INVENTORY ITEM (STEP 1: GET)
// ---------------------------
// Route to build the edit inventory view
// Access: site-name/inv/edit/:inv_id
router.get(
  "/edit/:inv_id",
  // FIX: Changed to match the function name in invController.js
  utilities.handleErrors(invController.editInventoryView) 
);

// ---------------------------
// UPDATE INVENTORY ITEM (STEP 2: POST)
// ---------------------------
// Route to process the inventory update form submission
// Access: site-name/inv/update
router.post(
  "/update",
  // Reuse inventory validation rules
  invValidation.inventoryRules(), 
  // You should have a separate check function for update to handle the redirect path differently
  invValidation.checkUpdateData,
  utilities.handleErrors(invController.updateInventory) 
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

// ***** FIX START: THIS WAS THE MISSING ROUTE *****
// Route to process the inventory add form submission
router.post(
  "/add-inventory",
  invValidation.inventoryRules(), 
  invValidation.checkInventoryData,
  utilities.handleErrors(invController.addInventory) // Assuming your controller function is named addInventory
);
// ***** FIX END *****

/* NOTE: The duplicate POST /update route previously here has been removed.
  It was causing confusion and was not the correct handler for /add-inventory.
*/


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

// New Task: Route to deliver the delete confirmation view
// Path: /inv/delete/:inv_id (Matches the Delete link structure)
router.get("/delete/:inv_id", 
  utilities.checkLogin, 
  utilities.handleErrors(invController.buildDeleteConfirmation)
);

// New Task: Route to handle the actual item deletion
// The route will call the function 'deleteInventory' which we will build next.
router.post(
  "/delete/", 
  utilities.checkLogin, 
  utilities.handleErrors(invController.deleteInventory)
);

module.exports = router;