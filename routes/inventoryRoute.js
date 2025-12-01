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
  checkEmployeeOrAdmin, // <-- Added authorization check
  utilities.handleErrors(invController.buildManagementView)
);

// ---------------------------
// GET INVENTORY JSON (NEW ROUTE FOR AJAX)
// ---------------------------
// Route to return inventory by classification for the management select tool 
// Note: Since this is used exclusively within the administrative view, it is protected.
// Access: site-name/inv/getInventory/:classification_id
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get(
  "/getInventory/:classification_id",
  checkEmployeeOrAdmin, // <-- Added authorization check
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
  checkEmployeeOrAdmin, // <-- Added authorization check
  // FIX: Changed to match the function name in invController.js
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
  checkEmployeeOrAdmin, // <-- Added authorization check
  // Reuse inventory validation rules
  invValidation.inventoryRules(), 
  // You should have a separate check function for update to handle the redirect path differently
  invValidation.checkUpdateData,
  utilities.handleErrors(invController.updateInventory) 
);


// ---------------------------
// ADD CLASSIFICATION
// ---------------------------
// *** PROTECTED ROUTE: Requires 'Employee' or 'Admin' ***
router.get(
  "/add-classification",
  checkEmployeeOrAdmin, // <-- Added authorization check
  utilities.handleErrors(invController.buildAddClassification)
);

// *** PROTECTED PROCESS: Requires 'Employee' or 'Admin' ***
router.post(
  "/add-classification",
  checkEmployeeOrAdmin, // <-- Added authorization check
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
  checkEmployeeOrAdmin, // <-- Added authorization check
  utilities.handleErrors(invController.buildAddInventory)
);

// ***** FIX START: THIS WAS THE MISSING ROUTE *****
// Route to process the inventory add form submission
// *** PROTECTED PROCESS: Requires 'Employee' or 'Admin' ***
router.post(
  "/add-inventory",
  checkEmployeeOrAdmin, // <-- Added authorization check
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
// PUBLIC ROUTE: Accessible to all visitors
router.get(
  "/classification/:classificationId",
  utilities.handleErrors(invController.buildByClassificationId)
);

// ---------------------------
// VEHICLE DETAIL
// ---------------------------
// PUBLIC ROUTE: Accessible to all visitors
router.get(
  "/detail/:invId",
  utilities.handleErrors(invController.buildByInvId)
);

// ---------------------------
// ERROR TEST
// ---------------------------
// PUBLIC ROUTE: Accessible to all visitors
router.get("/error", utilities.handleErrors(invController.triggerError));

// New Task: Route to deliver the delete confirmation view
// Path: /inv/delete/:inv_id (Matches the Delete link structure)
// *** PROTECTED ROUTE: Replaced checkLogin with checkEmployeeOrAdmin ***
router.get("/delete/:inv_id", 
  checkEmployeeOrAdmin, 
  utilities.handleErrors(invController.buildDeleteConfirmation)
);

// New Task: Route to handle the actual item deletion
// The route will call the function 'deleteInventory' which we will build next.
// *** PROTECTED PROCESS: Replaced checkLogin with checkEmployeeOrAdmin ***
router.post(
  "/delete/", 
  checkEmployeeOrAdmin, 
  utilities.handleErrors(invController.deleteInventory)
);

module.exports = router;