const { body, validationResult } = require("express-validator");
const utilities = require("../utilities/"); 
const invModel = require('../models/inventory-model');
const reviewModel = require('../models/review-model'); 

// ===========================
// Review Submission Validation
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
    // Though often verified by res.locals.accountData, it's safe to validate the passed value too
    body("account_id")
      .trim()
      .isInt({ min: 1 })
      .withMessage("Account ID is missing or invalid."), 
  ];
}

/* **************************************
 * Check data and return to detail view with errors
 * ************************************ */
async function checkReviewData(req, res, next) {
  const { review_text, inv_id } = req.body;
  // Account data is available via res.locals.accountData, set by JWT middleware
  const accountData = res.locals.accountData; 
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    // If errors exist, we must rebuild the detail page with the errors and sticky data

    // 1. Get vehicle data and associated reviews
    const invData = await invModel.getInventoryById(inv_id); 
    const reviews = await reviewModel.getReviewsByInventoryId(inv_id);
    
    // 2. Build the required HTML part (re-using function names from invController/utilities)
    const detail = await utilities.buildInventoryDetails(invData, reviews, accountData);
    
    // 3. Get navigation
    const nav = await utilities.getNav();
    
    // 4. Extract vehicle details for the page title
    const title = `${invData.inv_make} ${invData.inv_model}`;

    // 5. Flash an error message
    req.flash("error", "Failed to submit review. Please check the content.");
    
    // 6. Render the detail view
    return res.status(400).render("inventory/detail", {
      title: title,
      nav,
      detail, // The rebuilt vehicle details section (including the form)
      errors: errors.array(), // Pass the array of validation errors
      // Sticky data:
      review_text,
      // Variables needed for the form/page:
      inv_id: parseInt(inv_id),
      reviews, // Pass the list of reviews
      accountData, // Required for displaying the review form
    });
  }
  next();
}


module.exports = {
    reviewRules, 
    checkReviewData, 
};