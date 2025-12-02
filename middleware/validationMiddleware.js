// This file is used to define and export validation rules using express-validator
const utilities = require("../utilities/")
const accountModel = require("../models/account-model") // Ensure this path is correct for your project
const { body, validationResult } = require("express-validator") 

/* ****************************************
 * Registration Data Validation Rules
 * *************************************** */
const registrationRules = () => {
    return [
        // firstname is required and must be a string
        body("account_firstname")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a first name."), // on error this message is sent.

        // lastname is required and must be a string
        body("account_lastname")
            .trim()
            .isLength({ min: 2 })
            .withMessage("Please provide a last name."),

        // valid email is required and cannot already exist in the DB
        body("account_email")
            .trim()
            .isEmail()
            .normalizeEmail() // refer to sanitization handbook
            .withMessage("A valid email is required.")
            .custom(async (account_email) => {
                const emailExists = await accountModel.checkExistingEmail(account_email)
                if (emailExists) {
                    throw new Error("Email exists. Please log in or use a different email")
                }
            }),

        // password is required and must meet complexity rules
        body("account_password")
            .trim()
            .isLength({ min: 12 })
            .withMessage("Password does not meet requirements.")
    ]
}


/* ****************************************
 * Account Update Data Validation Rules
 * *************************************** */
const accountUpdateRules = () => {
    return [
        body("account_firstname")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a first name."),

        body("account_lastname")
            .trim()
            .isLength({ min: 2 })
            .withMessage("Please provide a last name."),

        body("account_email")
            .trim()
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required."),
    ]
}

/* ****************************************
 * Check if the email address is already in use by another account
 * and is different from the current account's email.
 * * NOTE: This function relies on res.locals.accountData being set by the 
 * authentication middleware that runs BEFORE this.
 *****************************************/
const checkUpdateEmail = async (req, res, next) => {
    const { account_email, account_firstname, account_lastname, account_id } = req.body
    const errors = validationResult(req)
    
    // --- DEBUGGING LOG 1: Check incoming request body and current path ---
    console.log("--- DEBUG: checkUpdateEmail executed ---")
    console.log("Request Method:", req.method)
    console.log("Request URL:", req.originalUrl)
    console.log("Incoming Form Data:", { account_id, account_firstname, account_lastname, account_email })
    console.log("------------------------------------------")


    // 1. If express-validator found basic format/presence errors, proceed to next step 
    if (!errors.isEmpty()) {
        console.log("DEBUG: Basic validation errors found. Proceeding to next middleware/controller.")
        return next()
    }

    // 2. Get the current account data from res.locals
    const accountData = res.locals.accountData

    // 3. Check if the submitted email is DIFFERENT from the current email
    if (account_email !== accountData.account_email) {
        // 4. If it's different, check if the new email exists in the database
        const emailExists = await accountModel.checkExistingEmail(account_email)

        if (emailExists) {
            // Failed: Email exists and is different from current user's email
            req.flash("notice", "That email address is already in use by another account.")
            
            // --- DEBUGGING LOG 2: Failure case (Email Conflict) ---
            console.log("DEBUG: FAILURE - New email already exists in DB.")
            console.log("------------------------------------------")


            // Manually render the view to retain the submitted data and display the error
            let nav = await utilities.getNav()
            res.render("account/account-update", {
                title: "Edit Account",
                nav,
                // Pass a simple array of string errors for display in the view
                errors: [{ msg: "That email address is already in use by another account." }],
                // Ensure correct keys are passed for view rendering
                account_firstname: account_firstname,
                account_lastname: account_lastname,
                account_email: account_email,
                account_id: account_id,
            })
            return // STOP EXECUTION
        }
    }
    
    // --- DEBUGGING LOG 3: Success case ---
    console.log("DEBUG: SUCCESS - Validation passed. Calling next() to proceed to controller.")
    console.log("------------------------------------------")

    // 5. Success: Email is either the same, or it's new and doesn't exist. Proceed.
    next()
}


/* ****************************************
 * Example: Password Update Validation Rules
 * *************************************** */
const passwordRules = () => {
    return [
        body("new_password") // Changed from account_password to match form field name
            .trim()
            .isLength({ min: 12 })
            .withMessage("Password does not meet requirements."),
    ]
}


module.exports = {
    registrationRules,
    accountUpdateRules,
    checkUpdateEmail,
    passwordRules
}