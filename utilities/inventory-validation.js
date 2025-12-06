const { body, validationResult } = require("express-validator");
// We need to import the inventory model and utilities for the checkReviewData function
// --- FIX 1: Corrected path for utilities assuming it is in the parent directory ---
const utilities = require("../utilities"); 
const invModel = require('../models/inventory-model');

// ===========================
// Classification Validation
// ===========================
function classificationRules() {
    return [
        body("classification_name")
            .trim()
            // Using isAlphanumeric to allow both letters and numbers (common for classifications)
            .isAlphanumeric() 
            .withMessage("Classification name must contain only letters and numbers (no spaces).")
            .notEmpty()
            .withMessage("Classification name cannot be empty."),
    ];
}

function checkClassificationData(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("inventory/add-classification", {
            title: "Add New Classification",
            nav: req.nav,
            errors: errors.array(),
            classification_name: req.body.classification_name,
        });
    }
    next();
}

// ===========================
// Inventory Item Validation
// ===========================
function inventoryRules() {
    const currentYear = new Date().getFullYear();
    return [
        body("inv_make")
            .trim()
            .notEmpty()
            .withMessage("Make is required."),
        body("inv_model")
            .trim()
            .notEmpty()
            .withMessage("Model is required."),
        body("inv_year")
            .isInt({ min: 1886, max: currentYear + 1 })
            .withMessage(`Year must be between 1886 and ${currentYear + 1}.`),
        body("inv_price")
            .isFloat({ min: 0 })
            .withMessage("Price must be a positive number."),
        body("inv_miles")
            .isInt({ min: 0 })
            .withMessage("Miles must be a positive whole number."),
        body("inv_color")
            .trim()
            .notEmpty()
            .withMessage("Color is required."),
        body("classification_id")
            .notEmpty()
            .withMessage("Classification must be selected."),
        
        // Added standard image/thumbnail fields
        body("inv_image")
            .trim()
            .notEmpty()
            .withMessage("Image path is required."),
        body("inv_thumbnail")
            .trim()
            .notEmpty()
            .withMessage("Thumbnail path is required."),
    ];
}

function checkInventoryData(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // req.classifications must be prepared by a prior middleware function
        const classifications = req.classifications || [];
        return res.render("inventory/add-inventory", {
            title: "Add New Inventory Item",
            nav: req.nav,
            classifications,
            errors: errors.array(),
            ...req.body, // sticky fields
        });
    }
    next();
}

// ===========================
// Inventory Item Update Validation Check (NEW)
// ===========================
/**
 * Check update data and return errors or continue to update inventory.
 * If errors exist, it redirects back to the edit view with sticky data.
 */
function checkUpdateData(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // req.classifications must be prepared by a prior middleware function
        const classifications = req.classifications || [];
        const itemName = `${req.body.inv_make} ${req.body.inv_model}`;
        
        // When validation fails on an update, we must render the edit view again.
        return res.render("inventory/edit-inventory", {
            title: "Edit " + itemName,
            nav: req.nav,
            classifications, // The select dropdown list
            errors: errors.array(),
            ...req.body, // CRITICAL: This includes the hidden inv_id and all sticky fields
        });
    }
    next();
}

// ===========================
// Review Submission Validation (NEW)
// ===========================

/* **************************************
 * Review Rules for submitting a new review
 * ************************************ */
function reviewRules() {
  return [
    // review_text is required and must not be empty
    body("review_text")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Review text cannot be empty."), // Error message for review text

    // inv_id is required and must be an integer (It should be passed as hidden input)
    body("inv_id")
      .trim()
      .isInt({ min: 1 })
      .withMessage("Inventory ID is missing or invalid."), // Error message for inv_id

    // account_id is required and must be an integer (It should be passed as hidden input)
    body("account_id")
      .trim()
      .isInt({ min: 1 })
      .withMessage("Account ID is missing or invalid."), // Error message for account_id
  ];
}

/* **************************************
 * Check data and return to detail view with errors
 * ************************************ */
async function checkReviewData(req, res, next) {
  const { review_text, inv_id } = req.body;
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    // If errors exist, we must rebuild the detail page with the errors and sticky data

    // 1. Get the classification list (for the layout/nav)
    const nav = await utilities.getNav();

    // 2. Get vehicle data and associated reviews
    // --- FIX 2: Renaming 'data' to 'invData' for EJS template consistency ---
    const invData = await invModel.getInventoryByInvId(inv_id); 
    const reviews = await invModel.getReviewsByInvId(inv_id);

    // 3. Build the required HTML parts
    const detailHTML = await utilities.buildInvDetailHTML(invData);
    const reviewsListHTML = await utilities.buildReviewsListHTML(reviews);
    
    // 4. Extract vehicle details for the page title/h1
    const title = `${invData.inv_year} ${invData.inv_make} ${invData.inv_model}`;

    // 5. Render the detail view, passing all required data, errors, and sticky text
    res.render("inventory/detail", {
      title: title,
      nav,
      detailHTML,
      reviewsListHTML, // Pass the rebuilt list of reviews
      errors: errors.array(), // Pass the array of validation errors
      // Sticky data:
      review_text,
      // Variables needed for the form/page:
      inv_id: parseInt(inv_id),
      // --- FIX 2: Passing as invData for consistency if the view uses it ---
      invData, 
      // We also need to pass res.locals.loggedin and res.locals.accountData if the 
      // view uses it for the form, but those should already be available 
      // via app.use(res.locals) middleware setup.
    });
    return;
  }
  next();
}


module.exports = {
    classificationRules,
    checkClassificationData,
    inventoryRules,
    checkInventoryData,
    checkUpdateData,
    reviewRules, 
    checkReviewData, 
};