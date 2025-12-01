const utilities = require("../utilities/"); // Import necessary utilities
const accountModel = require("../models/account-model"); // Account model for database interactions
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator"); // <-- ADDED for changePassword error checking
require("dotenv").config(); // To access process.env.ACCESS_TOKEN_SECRET

/* ****************************************
 * Deliver Login view
 * *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();
  
  // Retrieve specific flash messages
  // This replaces the old global middleware's job for this specific view
  const errors = req.flash("error");
  const notice = req.flash("notice");

  res.render("account/login", {
    title: "Login",
    nav,
    // Pass the specific message variables
    errors: errors.length > 0 ? errors : null,
    notice: notice.length > 0 ? notice : null,
    account_email: "", // Always define to prevent EJS crash
  });
}

/* ****************************************
 * Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
  });
}

/* ****************************************
 * Process registration
 * *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav();
  
  const { 
    account_firstname, 
    account_lastname, 
    account_email, 
    account_password 
  } = req.body;

  try {
    // 1. Hash the password before storing
    const hashedPassword = await bcrypt.hash(account_password, 10); // 10 salt rounds

    // 2. Store account in the database
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    );

    // 3. Handle result
    if (regResult) {
      req.flash(
        "notice",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      );
      res.redirect("/account/login");
    } else {
      req.flash("error", "Sorry, the registration failed.");
      res.redirect("/account/register");
    }
  } catch (error) {
    console.error("Registration Error:", error);
    req.flash("error", "An unexpected error occurred during registration.");
    res.redirect("/account/register");
  }
}

/* ****************************************
 * Process login request with debugging
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav();

  const { account_email, account_password } = req.body;

  try {
    // 1. Fetch account data
    const accountData = await accountModel.getAccountByEmail(account_email);

    // 2. Handle email not found
    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        // Pass the specific message variables
        notice: req.flash("notice"), 
        account_email, // preserve email for sticky form
      });
    }

    // 3. Compare passwords
    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
    if (!passwordMatch) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        // Pass the specific message variables
        notice: req.flash("notice"),
        account_email,
      });
    }

    // 4. Successful login
    delete accountData.account_password;
    const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

    // 5. Set HTTP-only cookie
    const cookieOptions = { httpOnly: true, maxAge: 3600 * 1000 };
    if (process.env.NODE_ENV !== "development") cookieOptions.secure = true;
    res.cookie("jwt", accessToken, cookieOptions);

    return res.redirect("/account/");
  } catch (error) {
    console.error(error);
    req.flash("error", "An unexpected error occurred. Please try again.");
    return res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      // Pass the specific message variables
      notice: req.flash("error"),
      account_email,
    });
  }
}

/* ****************************************
 * Deliver account management view 
 * *************************************** */
async function buildAccountManagement(req, res, next) {
  let nav = await utilities.getNav();
  
  const errors = req.flash("error");
  const notice = req.flash("notice");

  res.render("account/account-management", {
    title: "Account Management",
    nav,
    errors: errors.length > 0 ? errors : null, 
    notice: notice.length > 0 ? notice : null,
  });
}

/* ****************************************
 * Deliver Account Update View (NEW)
 * *************************************** */
async function buildAccountUpdateView(req, res, next) {
  let nav = await utilities.getNav();
  // We rely on res.locals.accountData which is set by the checkLogin utility
  const accountData = res.locals.accountData; 
  
  const errors = req.flash("error");
  const notice = req.flash("notice");


  res.render("account/account-update", {
    title: "Edit Account",
    nav,
    errors: errors.length > 0 ? errors : null,
    notice: notice.length > 0 ? notice : null,
    account_firstname: accountData.account_firstname,
    account_lastname: accountData.account_lastname,
    account_email: accountData.account_email,
    account_id: accountData.account_id,
  });
}

/* ****************************************
 * Process Account Update (Name/Email) (NEW)
 * *************************************** */
async function updateAccount(req, res) {
  let nav = await utilities.getNav();
  // We rely on res.locals.accountData for original data in case of re-render
  const accountData = res.locals.accountData; 
  const { account_firstname, account_lastname, account_email, account_id } = req.body;

  // NOTE: If validation (including custom email check) failed, the middleware 
  // (checkUpdateEmail) will render the view and return, preventing this function from running.
  // We only run here if validation passed.
  
  const updateResult = await accountModel.updateAccount(
    account_firstname,
    account_lastname,
    account_email,
    account_id
  );

  if (updateResult) {
    // Successful update
    req.flash("notice", "Account information successfully updated.");

    // IMPORTANT: Re-issue JWT cookie with updated data 
    // 1. Get the updated account data
    const updatedAccountData = await accountModel.getAccountById(account_id);
    delete updatedAccountData.account_password;
    
    // 2. Create a new JWT
    const accessToken = jwt.sign(
        updatedAccountData,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
    );
    
    // 3. Set the new cookie
    const cookieOptions = { httpOnly: true, maxAge: 3600 * 1000 };
    if (process.env.NODE_ENV !== "development") cookieOptions.secure = true;
    res.cookie("jwt", accessToken, cookieOptions);
    
    // 4. Update res.locals for the next page load (redirect to /account/)
    res.locals.accountData = updatedAccountData;
    res.locals.loggedin = 1;

    res.redirect("/account/");
  } else {
    // Failed database update (should be rare)
    req.flash("notice", "Sorry, the account update failed due to a server error.");
    
    // Re-render the update form with current request data (sticky form)
    res.status(500).render("account/account-update", {
        title: "Edit Account",
        nav,
        errors: [{ msg: "Database update failed." }], 
        notice: req.flash("notice"),
        // Pass the data that was attempted to be saved
        account_firstname,
        account_lastname,
        account_email,
        account_id,
    });
  }
}

/* ****************************************
 * Process Password Change (NEW)
 * *************************************** */
async function changePassword(req, res) {
    let nav = await utilities.getNav();
    const { current_password, new_password, account_id } = req.body;
    // Get existing data from res.locals for re-rendering sticky form data
    const accountData = res.locals.accountData; 

    // 1. Check for express-validator errors (New password complexity)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        // Pass back all sticky data + the validation errors
        return res.status(400).render("account/account-update", {
            title: "Edit Account",
            nav,
            errors: errors.array(), // Pass validation errors
            notice: null,
            // Sticky data for Name/Email section
            account_firstname: accountData.account_firstname, 
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id: accountData.account_id,
        })
    }
    
    // 2. Get full account data from the DB to access the hashed password
    const fullAccountData = await accountModel.getAccountById(account_id);
    
    // 3. Check if the current password matches the one in the DB
    if (!(await bcrypt.compare(current_password, fullAccountData.account_password))) {
        req.flash("notice", "The current password entered is incorrect.");
        // Re-render the update view with existing data
        return res.status(400).render("account/account-update", {
            title: "Edit Account",
            nav,
            // Manually add the error message to the errors array for display
            errors: [{ msg: "The current password entered is incorrect." }],
            notice: req.flash("notice"),
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id,
        });
    }

    // 4. Hash the new password
    let newHashedPassword;
    try {
        newHashedPassword = await bcrypt.hash(new_password, 10);
    } catch (error) {
        console.error("Password Hashing Error:", error);
        req.flash("notice", "Sorry, there was an error processing the new password.");
        res.status(500).render("account/account-update", {
            title: "Edit Account",
            nav,
            errors: null,
            notice: req.flash("notice"),
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id,
        });
        return;
    }

    // 5. Update the password in the database
    const updateResult = await accountModel.updatePassword(account_id, newHashedPassword);

    if (updateResult) {
        req.flash("notice", "Password successfully changed. Please log in with your new password.");
        // Logout the user by clearing the JWT cookie
        res.clearCookie("jwt");
        res.redirect("/account/login");
    } else {
        req.flash("notice", "Sorry, the password change failed.");
        res.status(500).render("account/account-update", {
            title: "Edit Account",
            nav,
            errors: null,
            notice: req.flash("notice"),
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id,
        });
    }
}

/* ****************************************
 * Process logout request
 * ************************************ */
async function accountLogout(req, res) {
  res.clearCookie("jwt");
  req.flash("notice", "You have been logged out.");
  res.redirect("/");
}

module.exports = { 
  buildLogin, 
  buildRegister, 
  registerAccount, 
  accountLogin,
  buildAccountManagement,
  buildAccountUpdateView, 
  updateAccount,          
  changePassword,         
  accountLogout
};