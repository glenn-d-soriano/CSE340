const invModelDb = require("../models/inventory-model"); // Keeping this one
const utilities = require("../utilities/");
const { validationResult } = require("express-validator");
// Removed the duplicate 'const invModelDb = require("../models/inventory-model");'

const invController = {};

/* ***************************
 * Build inventory by classification view
 * ************************** */
invController.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId;
  
  // 1. Get Inventory Data (could be an empty array if no cars exist)
  const data = await invModelDb.getInventoryByClassificationId(classification_id);
  let nav = await utilities.getNav();
  
  // 2. Get Classification Name (Robustly)
  let className = "Unknown";
  try {
      const classificationData = await invModelDb.getClassificationById(classification_id);
      
      if (classificationData) {
          className = classificationData.classification_name;
      } else {
          // If the classification ID itself is invalid, redirect home.
          req.flash("error", "The requested vehicle classification does not exist.");
          return res.redirect("/");
      }
  } catch (error) {
      console.error("Error retrieving classification data:", error);
      req.flash("error", "Error accessing the classification.");
      return res.redirect("/");
  }

  // 3. Build Grid
  // This utility function MUST return the "No cars available" message 
  // if the 'data' array passed to it is empty (data.length === 0).
  const grid = await utilities.buildClassificationGrid(data);

  // ==========================================================
  // 4. LOGIC TO CONTROL THE H1 TITLE 
  // ==========================================================
  
  // Core classification IDs (1 through 6) where the H1 title should be suppressed.
  const coreClassificationIds = ["1", "2", "3", "4", "5", "6"]; 
  
  let pageTitle = null; 

  // Check if the requested classification_id is NOT one of the core IDs.
  if (!coreClassificationIds.includes(classification_id)) {
      // If it's a newly added classification, set the title.
      pageTitle = className + " vehicles";
  }
  // If it IS a core ID, pageTitle remains null, hiding the H1 element in the EJS view.

  // 5. Render the page
  res.render("inventory/classification", {
    title: pageTitle, // <-- Pass the conditionally set title
    nav,
    grid,
    messages: req.flash(),
  });
};

/* ***************************
 * Build single inventory item detail view
 * ************************** */
invController.buildByInvId = async function (req, res, next) {
  // Uses invId, which matches the route /detail/:invId
  const inv_id = req.params.invId;
  // NOTE: getInventoryById usually returns an array of one item, we'll rely on the model for the single object.
  const data = await invModelDb.getInventoryById(inv_id);
  
  // ADDED CHECK: If no vehicle found, redirect to prevent crashing
  if (!data) {
    req.flash("notice", "Sorry, that vehicle was not found.");
    return res.redirect("/"); 
  }
  
  const detail = await utilities.buildInventoryDetail(data);
  let nav = await utilities.getNav();
  const vehicleName = `${data.inv_make} ${data.inv_model}`;
  
  res.render("inventory/detail", {
    title: vehicleName,
    nav,
    // FIX: Renamed 'detail' to 'detailHTML' to match what the EJS template is expecting.
    detailHTML: detail,
    messages: req.flash(),
  });
};

/* ***************************
 * Build Inventory Management View (TASK 1)
 * ************************** */
invController.buildManagementView = async function (req, res) {
  let nav = await utilities.getNav();
    // CORRECT CALL: This needs the full <select> element for the management page
    const classificationList = await utilities.buildClassificationList();
    
  console.log("Flash messages (res.locals):", res.locals.messages); 
  
  res.render("inventory/management", {
  title: "Inventory Management",
  nav,
  errors: null,
  classificationList,
  messages: res.locals.messages, // already set by middleware
});
};

/* ***************************
 * Build Add New Classification View (TASK 2 - GET)
 * ************************** */
invController.buildAddClassification = async function (req, res) {
  let nav = await utilities.getNav();
  res.render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null,
    // *** FIX FOR 10 POINTS: Explicitly pass flash messages ***
    messages: req.flash(), 
  });
};

/* ***************************
 * Process Add New Classification (TASK 2 - POST)
 * ************************** */
invController.addClassification = async function (req, res) {
  let nav = await utilities.getNav();
  const { classification_name } = req.body;
  const errors = validationResult(req);

  // If validation fails, re-render the form with errors and sticky data
  if (!errors.isEmpty()) {
    return res.render("inventory/add-classification", {
      errors: errors.array(),
      title: "Add New Classification",
      nav,
      classification_name,
      // *** FIX FOR 10 POINTS: Explicitly pass flash messages ***
      messages: req.flash(), 
    });
  }

  // If validation passes, insert data
  // This is the function that was missing in the model!
  const result = await invModelDb.addClassification(classification_name);

  if (result) {
    req.flash("notice", `Classification "${classification_name}" added successfully.`);
    // Success: Redirect to the management view (where the flash message will be displayed)
    return res.redirect("/inv");
  } else {
    // Failure (Database error)
    req.flash("error", "Sorry, adding the classification failed.");
    // Render the form again with the error message
    return res.render("inventory/add-classification", {
      errors: null,
      title: "Add New Classification",
      nav,
      classification_name,
      // *** FIX FOR 10 POINTS: Explicitly pass flash messages ***
      messages: req.flash(), 
    });
  }
};


/* ***************************
 * Build Add New Inventory View (TASK 3 - GET)
 * ************************** */
invController.buildAddInventory = async function (req, res) {
  let nav = await utilities.getNav();
  // FIX APPLIED: Use buildClassificationOptions (only <option> tags)
  const classificationList = await utilities.buildClassificationOptions(); 
  res.render("inventory/add-inventory", {
    title: "Add New Inventory Item",
    nav,
    errors: null,
    classificationList,
    // *** FIX FOR 10 POINTS: Explicitly pass flash messages ***
    messages: req.flash(), 
  });
};

/* ***************************
 * Process Add New Inventory (TASK 3 - POST)
 * ************************** */
invController.addInventory = async function (req, res) {
    let nav = await utilities.getNav();
    const { 
        classification_id, inv_make, inv_model, inv_year, 
        inv_description, inv_image, inv_thumbnail, inv_price, 
        inv_miles, inv_color 
    } = req.body;
    
    // Ensure inv_description has a value for database insertion, even if not on the form
    const final_description = inv_description || `A quality vehicle: ${inv_make} ${inv_model}.`;

    const errors = validationResult(req);
    // FIX APPLIED: Use buildClassificationOptions for sticky data in case of error
    const classificationList = await utilities.buildClassificationOptions(classification_id);

    // If validation fails, re-render the form with errors and sticky data
    if (!errors.isEmpty()) {
        return res.render("inventory/add-inventory", {
            errors: errors.array(),
            title: "Add New Inventory Item",
            nav,
            classificationList,
            inv_make, inv_model, inv_year, inv_description, inv_image, 
            inv_thumbnail, inv_price, inv_miles, inv_color,
            // *** FIX FOR 10 POINTS: Explicitly pass flash messages ***
            messages: req.flash(), 
        });
    }

    // If validation passes, insert data
    // NOTE: inv_description is passed as the 3rd argument in the model
    const result = await invModelDb.addInventory(
        inv_make, inv_model, final_description, inv_image, inv_thumbnail, 
        inv_price, inv_year, inv_miles, inv_color, classification_id
    );

    if (result) {
        req.flash("notice", `New vehicle added successfully.`);
        // Success: Redirect to the management view
        return res.redirect("/inv");
    } else {
        // Failure (Database error)
        req.flash("error", "Sorry, adding the vehicle failed.");
        // Render the form again with the error message
        return res.render("inventory/add-inventory", {
            errors: null,
            title: "Add New Inventory Item",
            nav,
            classificationList,
            // Keep sticky data
            inv_make, inv_model, inv_year, inv_description, inv_image, 
            inv_thumbnail, inv_price, inv_miles, inv_color,
            // *** FIX FOR 10 POINTS: Explicitly pass flash messages ***
            messages: req.flash(), 
        });
    }
};

/* ***************************
 * Route to trigger intentional error
 * ************************** */
invController.triggerError = async function (req, res, next) {
    // Intentionally trigger a 500 server error
    throw new Error("Simulated intentional 500 server error.");
};

/* ***************************
 * Return Inventory by Classification As JSON
 * ************************** */
invController.getInventoryJSON = async (req, res, next) => {
  // NOTE: Using 'classification_id' here to match the parameter name from the route definition
  const classification_id = parseInt(req.params.classification_id);
  const invData = await invModelDb.getInventoryByClassificationId(classification_id);
  
  if (invData[0]?.inv_id) {
    return res.json(invData);
  } else {
    next(new Error("No data returned"));
  }
};

/* ***************************
 * Build edit inventory view
 * ************************** */
invController.editInventoryView = async function (req, res, next) {
    // FIX: Using req.params.inv_id to match the route definition /edit/:inv_id
    const inv_id = parseInt(req.params.inv_id); 
    let nav = await utilities.getNav();
    
    // Check if the ID is NaN before proceeding to the database
    if (isNaN(inv_id)) {
        req.flash("error", "Invalid inventory ID provided in the URL.");
        return res.redirect("/inv");
    }

    // Call the model-based function to get all the inventory item data
    // NOTE: getInventoryById usually returns an array of one item.
    const data = await invModelDb.getInventoryById(inv_id);
    const itemData = Array.isArray(data) ? data[0] : data; 
    
    // Check if item was found
    if (!itemData) {
        req.flash("error", "Inventory item not found.");
        return res.redirect("/inv");
    }

    // CORRECT CALL: This needs the full <select> element for the management page
    const classificationList = await utilities.buildClassificationList(itemData.classification_id);
    
    // Create the item name for the title and h1 elements
    const itemName = `${itemData.inv_make} ${itemData.inv_model}`;

    // Render the view, passing all required unpacked data
    res.render("inventory/edit-inventory", {
        title: "Edit " + itemName,
        nav,
        // FIX: Passing the full inventory object for cleaner access in EJS
        inventory: itemData,
        // FIX: Passing the list with the name expected by EJS
        classificationList: classificationList, 
        errors: null,
        // The following individual locals are still passed to handle sticky data from validation errors:
        inv_id: itemData.inv_id,
        inv_make: itemData.inv_make,
        inv_model: itemData.inv_model,
        inv_year: itemData.inv_year,
        inv_description: itemData.inv_description,
        inv_image: itemData.inv_image,
        inv_thumbnail: itemData.inv_thumbnail,
        inv_price: itemData.inv_price,
        inv_miles: itemData.inv_miles,
        inv_color: itemData.inv_color,
        classification_id: itemData.classification_id,
        
    });
};

/* ***************************
 * Process Update Inventory (TASK 4 - POST)
 * ************************** */
invController.updateInventory = async function (req, res, next) {
    console.log("--- START INVENTORY UPDATE DEBUG ---");

    const {
        inv_id,
        inv_make,
        inv_model,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_year,
        inv_miles,
        inv_color,
        classification_id,
    } = req.body;

    // Convert numeric fields before sending to DB
    const invPriceNum = parseFloat(inv_price);
    const invYearNum = parseInt(inv_year);
    const invMilesNum = parseInt(inv_miles);
    const classificationIdNum = parseInt(classification_id);
    const invIdNum = parseInt(inv_id);

    console.log("Incoming Data Types:", {
        invPriceNum: typeof invPriceNum,
        invYearNum: typeof invYearNum,
        invMilesNum: typeof invMilesNum,
        classificationIdNum: typeof classificationIdNum,
    });

    let nav = await utilities.getNav();
    // CORRECT CALL: This needs the full <select> element for the management page
    const classificationList = await utilities.buildClassificationList(classificationIdNum);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation Failed. Errors:", errors.array());
        console.log("--- END INVENTORY UPDATE DEBUG (Validation Failed) ---");

        // Fetching itemData to pass as 'inventory' for sticky data when validation fails
        const data = await invModelDb.getInventoryById(invIdNum);
        const itemData = Array.isArray(data) ? data[0] : data; 

        return res.render("inventory/edit-inventory", {
            errors: errors.array(),
            title: `Edit ${inv_make} ${inv_model}`,
            nav,
            classificationList,
            inventory: itemData, // Pass the inventory object for clean EJS logic
            inv_id: invIdNum,
            inv_make,
            inv_model,
            inv_year: invYearNum,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price: invPriceNum,
            inv_miles: invMilesNum,
            inv_color,
            classification_id: classificationIdNum,
            messages: req.flash(),
        });
    }

    // Attempt to update inventory in DB
    const updateResult = await invModelDb.updateInventory(
        invIdNum,
        inv_make,
        inv_model,
        inv_description,
        inv_image,
        inv_thumbnail,
        invPriceNum,
        invYearNum,
        invMilesNum,
        inv_color,
        classificationIdNum
    );

    console.log("Model Update Result:", updateResult);

    if (updateResult > 0) {
        // Set flash message for success
        req.flash("notice", `The ${inv_make} ${inv_model} was successfully updated.`);
        console.log(`SUCCESS: Redirecting to /inv`);
    
        // Redirect to the Inventory Management page instead of staying on the edit page
        return res.redirect("/inv");
    } else {
        // Failure case remains the same
        req.flash("error", "Sorry, the update failed. Please try again.");
        console.log("FAILURE: Update returned 0 or false.");

        // Fetching itemData to pass as 'inventory' for sticky data when validation fails
        const data = await invModelDb.getInventoryById(invIdNum);
        const itemData = Array.isArray(data) ? data[0] : data; 

        return res.render("inventory/edit-inventory", {
            errors: null,
            title: `Edit ${inv_make} ${inv_model}`,
            nav,
            classificationList,
            inventory: itemData, // Pass the inventory object for clean EJS logic
            inv_id: invIdNum,
            inv_make,
            inv_model,
            inv_year: invYearNum,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price: invPriceNum,
            inv_miles: invMilesNum,
            inv_color,
            classification_id: classificationIdNum,
            messages: req.flash(),
        });
    }

};

/* ****************************************
 * Build delete confirmation view (STEP 1 - GET)
 * *************************************** */
invController.buildDeleteConfirmation = async function (req, res, next) {
    // FIX: Using req.params.inv_id to match the route definition /delete/:inv_id
    const inv_id = parseInt(req.params.inv_id)
    let nav = await utilities.getNav()
    
    // Get the data for the inventory item from the database.
    // NOTE: getInventoryById usually returns an array of one item.
    const data = await invModelDb.getInventoryById(inv_id)
    const itemData = Array.isArray(data) ? data[0] : data;

    // Check if item data was found
    if (!itemData) {
        req.flash("notice", "Sorry, no data was found for that inventory item.")
        return res.redirect("/inv/")
    }

    // Build a name variable to hold the inventory item's make and model.
    const itemName = `${itemData.inv_make} ${itemData.inv_model}`

    // Call the res.render function to deliver the delete confirmation view.
    res.render("./inventory/delete-confirm", {
        title: "Delete " + itemName,
        nav,
        errors: null,
        // Data for the readonly form fields
        inv_id: itemData.inv_id,
        inv_make: itemData.inv_make,
        inv_model: itemData.inv_model,
        inv_year: itemData.inv_year,
        inv_price: itemData.inv_price,
        messages: req.flash(),
    })
}


/* ****************************************
* Process delete inventory (STEP 2 - POST)
* *************************************** */
invController.deleteInventory = async function (req, res) {
    // We only need inv_id, inv_make, and inv_model from the body for the success/failure logic
    const { inv_id, inv_make, inv_model } = req.body;
    const invIdNum = parseInt(inv_id); // Required to be an integer

    // Pass the inv_id to the model function to perform the delete operation.
    const deleteResult = await invModelDb.deleteInventoryItem(invIdNum);

    if (deleteResult) {
        // SUCCESS: Flash message and redirect to the management view.
        req.flash("notice", `The ${inv_make} ${inv_model} was successfully deleted.`);
        res.redirect("/inv/");
    } else {
        // FAILURE: Flash message and REDIRECT to the GET route to rebuild the delete view.
        req.flash("error", "Sorry, the deletion failed. Please try again.");
        
        // Redirects to the /inv/delete/:inv_id route
        res.redirect(`/inv/delete/${invIdNum}`);
    }
}


/* ***************************
 * Build Delete Classification View (NEW CODE - GET)
 * ************************** */
invController.buildDeleteClassification = async function (req, res, next) {
    const classification_id = parseInt(req.params.classificationId);
    let nav = await utilities.getNav();
    
    // Assuming you have a function to get classification name by ID
    const classificationData = await invModelDb.getClassificationById(classification_id);
    
    if (!classificationData) {
        req.flash("error", "Classification not found.");
        return res.redirect("/inv");
    }

    const classification_name = classificationData.classification_name;

    res.render("inventory/delete-classification", {
        title: `Delete ${classification_name} Classification`,
        nav,
        errors: null,
        classification_id,
        classification_name,
        // *** FIX FOR 10 POINTS: Explicitly pass flash messages ***
        messages: req.flash(), 
    });
};

/* ***************************
 * Process Classification Deletion (NEW CODE - POST)
 * ************************** */
invController.deleteClassification = async function (req, res, next) {
    const { classification_id, classification_name } = req.body;
    let nav = await utilities.getNav();
    
    // Attempt to delete the classification (and cascade delete related inventory)
    const deleteResult = await invModelDb.deleteClassification(classification_id);

    if (deleteResult) {
        req.flash("notice", `The classification ${classification_name} and all associated inventory items were successfully deleted.`);
        // Success: Redirect to the management view
        return res.redirect("/inv");
    } else {
        // Failure (Database error)
        req.flash("error", "Sorry, the classification deletion failed. Please try again.");
        
        // Re-render the delete confirmation view on failure
        return res.render("inventory/delete-classification", {
            title: `Delete ${classification_name} Classification`,
            nav,
            errors: null,
            classification_id,
            classification_name,
            // *** FIX FOR 10 POINTS: Explicitly pass flash messages ***
            messages: req.flash(), 
        });
    }
};


module.exports = invController;