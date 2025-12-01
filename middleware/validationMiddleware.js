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
    const { account_email, account_firstname, account_lastname } = req.body
    const errors = validationResult(req)

    // 1. If express-validator found basic format/presence errors, proceed to next step 
    //    (usually the controller) to handle those errors.
    if (!errors.isEmpty()) {
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

            // Manually render the view to retain the submitted data and display the error
            let nav = await utilities.getNav()
            res.render("account/account-update", {
                title: "Edit Account",
                nav,
                // Pass a simple array of string errors for display in the view
                errors: ["That email address is already in use by another account."],
                firstName: account_firstname,
                lastName: account_lastname,
                email: account_email,
                // We need to pass back the original account data (which includes account_id) 
                // so the form can submit the correct ID if successful later.
                accountData: res.locals.accountData 
            })
            return // STOP EXECUTION
        }
    }

    // 5. Success: Email is either the same, or it's new and doesn't exist. Proceed.
    next()
}


/* ****************************************
 * Example: Password Update Validation Rules
 * *************************************** */
const passwordRules = () => {
    return [
        body("account_password")
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