const invModel = require("../models/inventory-model");
const { validationResult } = require("express-validator");
const utilities = require("../utilities/"); // <--- IMPORT SHARED UTILITIES

const invCont = {};

/* ***************************
 * Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async (req, res, next) => {
    try {
        const classification_id = req.params.classificationId;
        const data = await invModel.getInventoryByClassificationId(classification_id);
        const nav = await utilities.getNav(); // <--- USE SHARED UTILITY

        if (!data || data.length === 0) {
            return res.render("./inventory/classification", {
                title: "No Vehicles Found",
                nav,
                grid: '<p class="notice">Sorry, no vehicles could be found for this classification.</p>'
            });
        }

        // Calling the correct utility function to build the vehicle grid
        const grid = await utilities.buildClassificationGrid(data);

        const className = data[0].classification_name || "Vehicles";

        res.render("./inventory/classification", {
            title: className + " Vehicles",
            nav,
            grid
        });
    } catch (error) {
        // Log error for debugging purposes
        console.error("Error building classification view:", error);
        next(error);
    }
};

/* ***************************
 * Build single vehicle detail view
 * ************************** */
invCont.buildByInvId = async (req, res, next) => {
    try {
        const inv_id = req.params.invId;
        const vehicleData = await invModel.getInventoryById(inv_id);
        const nav = await utilities.getNav(); // <--- USE SHARED UTILITY

        // The model returns an array, but we need the object inside it.
        const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData;

        if (!vehicle) {
            const err = new Error("No vehicle found");
            err.status = 404;
            return next(err);
        }

        // Calling the correct utility function to build the detail HTML
        const detailHTML = await utilities.buildInventoryDetail(vehicle);

        res.render("./inventory/detail", {
            title: `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`,
            nav,
            detailHTML
        });
    } catch (error) {
        // Log error for debugging purposes
        console.error("Error building detail view:", error);
        next(error);
    }
};

/* ***************************
 * Build management view
 * * FIX APPLIED: Re-added messages: req.flash()
 * ************************** */
invCont.buildManagementView = async (req, res) => {
    const nav = await utilities.getNav(); // <--- USE SHARED UTILITY
    
    // 1. Fetch classifications
    const classificationData = await invModel.getClassifications();
    // 2. Build the select list HTML string
    const classificationList = await utilities.buildClassificationList(classificationData);

    res.render("inventory/management", {
        title: "Inventory Management",
        nav,
        messages: req.flash(), // <-- RE-ADDED: Ensure flash messages are passed
        classificationList 
    });
};

/* ***************************
 * Deliver Add Classification View
 * * FIX APPLIED: Re-added messages: req.flash()
 * ************************** */
invCont.buildAddClassification = async (req, res) => {
    const nav = await utilities.getNav(); // <--- USE SHARED UTILITY
    res.render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        messages: req.flash(), // <-- RE-ADDED: Ensure flash messages are passed
        errors: [],
        classification_name: ""
    });
};

/* ***************************
 * Process Add Classification
 * * FIX APPLIED: Re-added messages: req.flash() to the error render
 * ************************** */
invCont.addClassification = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const nav = await utilities.getNav(); // <--- ADDED CALL FOR ERROR PATH
        return res.render("inventory/add-classification", {
            title: "Add New Classification",
            nav,
            errors: errors.array(),
            classification_name: req.body.classification_name,
            messages: req.flash() // <-- RE-ADDED: Ensure flash messages are passed here if needed (e.g. error from a previous action)
        });
    }

    const { classification_name } = req.body;
    const result = await invModel.addClassification(classification_name);

    if (result) {
        req.flash("notice", `Classification "${classification_name}" added successfully.`);
        // Redirect is the correct pattern for success
        return res.redirect("/inv");
    }

    req.flash("error", "Failed to add classification.");
    const nav = await utilities.getNav(); // <--- ADDED CALL FOR FAILURE PATH
    res.render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        messages: req.flash(), // <-- RE-ADDED: Ensure flash messages are passed
        classification_name
    });
};

/* ***************************
 * Deliver Add Inventory View
 * * FIX APPLIED HERE: Re-added messages: req.flash()
 * ************************** */
invCont.buildAddInventory = async (req, res) => {
    const nav = await utilities.getNav(); // <--- USE SHARED UTILITY
    const classificationsResult = await invModel.getClassifications();
    
    // Building the select list HTML string
    const classificationList = await utilities.buildClassificationList(classificationsResult); 

    res.render("inventory/add-inventory", {
        title: "Add New Inventory Item",
        nav,
        classificationList, // <-- Passing the HTML string
        messages: req.flash(), // <-- RE-ADDED: Ensure flash messages are passed
        errors: [],
        classification_id: "",
        inv_make: "",
        inv_model: "",
        inv_year: "",
        inv_price: "",
        inv_miles: "",
        inv_color: "",
        inv_image: "/images/no-image.png",
        inv_thumbnail: "/images/no-image-available.png"
    });
};

/* ***************************
 * Process Add Inventory
 * * FIX APPLIED: Re-added messages: req.flash() to the failure render
 * ************************** */
invCont.addInventory = async (req, res) => {
    const errors = validationResult(req);
    const nav = await utilities.getNav(); // <--- USE SHARED UTILITY
    const classificationsResult = await invModel.getClassifications();
    
    // Building the select list HTML string for use in error path
    const classificationList = await utilities.buildClassificationList(classificationsResult); 

    if (!errors.isEmpty()) {
        return res.render("inventory/add-inventory", {
            title: "Add New Inventory Item",
            nav,
            classificationList, // <-- Passing the HTML string for select list
            errors: errors.array(),
            messages: req.flash(), // <-- RE-ADDED: Ensure flash messages are passed here if needed
            ...req.body
        });
    }

    // IMPORTANT FIX: The model expects 10 parameters, but the form only provides 9.
    // inv_description is missing. We need to add it or the query will fail.
    const { inv_make, inv_model, inv_year, inv_price, inv_miles, inv_color, classification_id, inv_image, inv_thumbnail } = req.body;

    // Setting a temporary placeholder for inv_description to prevent the database error.
    // You should eventually add a description field to your form.
    const inv_description = "Default description for a new vehicle."; 

    const insertResult = await invModel.addInventoryItem({
        inv_make,
        inv_model,
        inv_year,
        inv_description, // <--- ADDED: Must be passed to satisfy the model's 10 parameters
        inv_price,
        inv_miles,
        inv_color,
        classification_id,
        inv_image: inv_image || "/images/no-image.png",
        inv_thumbnail: inv_thumbnail || "/images/no-image-available.png"
    });

    if (insertResult) {
        req.flash("notice", `${inv_make} ${inv_model} added successfully.`);
        return res.redirect("/inv");
    }

    req.flash("error", "Failed to add inventory item.");
    res.render("inventory/add-inventory", {
        title: "Add New Inventory Item",
        nav,
        classificationList, // <-- Passing the HTML string for select list
        messages: req.flash(), // <-- RE-ADDED: Ensure flash messages are passed
        ...req.body
    });
};

/* ***************************
 * Trigger test error
 * ************************** */
invCont.triggerError = async (req, res, next) => {
    throw new Error("Intentional 500 Server Error");
};

module.exports = invCont;