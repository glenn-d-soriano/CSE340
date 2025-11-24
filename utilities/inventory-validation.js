const { body, validationResult } = require("express-validator");

// ===========================
// Classification Validation
// ===========================
function classificationRules() {
    return [
        body("classification_name")
            .trim()
            .isAlpha()
            .withMessage("Classification name must contain letters only.")
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
            .isInt({ min: 1886, max: new Date().getFullYear() + 1 })
            .withMessage(`Year must be between 1886 and ${new Date().getFullYear() + 1}.`),
        body("inv_price")
            .isFloat({ min: 0 })
            .withMessage("Price must be a positive number."),
        body("inv_miles")
            .isInt({ min: 0 })
            .withMessage("Miles must be a positive number."),
        body("inv_color")
            .trim()
            .notEmpty()
            .withMessage("Color is required."),
        body("classification_id")
            .notEmpty()
            .withMessage("Classification must be selected."),
    ];
}

function checkInventoryData(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

module.exports = {
    classificationRules,
    checkClassificationData,
    inventoryRules,
    checkInventoryData,
};
