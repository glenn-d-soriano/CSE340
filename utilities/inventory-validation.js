const { body, validationResult } = require("express-validator");

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

module.exports = {
    classificationRules,
    checkClassificationData,
    inventoryRules,
    checkInventoryData,
    checkUpdateData, // <-- Exported to fix the Express crash
};