const utilities = require("../utilities/"); // Import necessary utilities
const accountModel = require("../models/account-model"); // Account model for database interactions
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
require("dotenv").config(); // To access process.env.ACCESS_TOKEN_SECRET

/* ****************************************
 * Deliver Login view
 * *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();

  // Clear JWT if it exists (optional)
  res.clearCookie("jwt");

  const errors = req.flash("error");
  const notice = req.flash("notice");
  const singleNotice = notice.length > 0 ? notice[0] : null;

  res.render("account/login", {
    title: "Login",
    nav,
    errors: errors.length > 0 ? errors : null,
    notice: singleNotice,
    account_email: "",
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
    errors: res.locals.errors || null,
    notice: res.locals.notice || null,
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
    const hashedPassword = await bcrypt.hash(account_password, 10);

    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    );

    if (regResult) {
      req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`);
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
 * Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body;

  try {
    const accountData = await accountModel.getAccountByEmail(account_email);

    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", { 
        title: "Login", 
        nav, 
        account_email,
        errors: res.locals.errors || null,
        notice: res.locals.notice || null,
      });
    }

    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
    if (!passwordMatch) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", { 
        title: "Login", 
        nav, 
        account_email,
        errors: res.locals.errors || null,
        notice: res.locals.notice || null,
      });
    }

    delete accountData.account_password;
    const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

    const cookieOptions = { httpOnly: true, maxAge: 3600 * 1000 };
    if (process.env.NODE_ENV !== "development") cookieOptions.secure = true;
    res.cookie("jwt", accessToken, cookieOptions);

    res.redirect("/account/");
  } catch (error) {
    console.error(error);
    req.flash("error", "An unexpected error occurred. Please try again.");
    res.status(500).render("account/login", { 
      title: "Login", 
      nav, 
      account_email,
      errors: res.locals.errors || null,
      notice: res.locals.notice || null,
    });
  }
}

/* ****************************************
 * Deliver account management view 
 * *************************************** */
async function buildAccountManagement(req, res, next) {
  let nav = await utilities.getNav();

  // Retrieve flash messages
  const errors = req.flash("error");
  const notice = req.flash("notice"); // use notice for all success/info messages

  // Pass first notice message if available
  const singleNotice = notice.length > 0 ? notice[0] : null;

  res.render("account/account-management", {
    title: "Account Management",
    nav,
    errors: errors.length > 0 ? errors : null, 
    notice: singleNotice,
  });
}


/* ****************************************
 * Deliver Account Update View
 * *************************************** */
async function buildAccountUpdateView(req, res, next) {
  let nav = await utilities.getNav();
  const accountData = res.locals.accountData; 
  
  res.render("account/account-update", {
    title: "Edit Account",
    nav,
    errors: res.locals.errors || null,
    notice: res.locals.notice || null,
    account_firstname: accountData.account_firstname,
    account_lastname: accountData.account_lastname,
    account_email: accountData.account_email,
    account_id: accountData.account_id,
  });
}

/* ****************************************
 * Process Account Update (Name/Email)
 * *************************************** */
async function updateAccount(req, res) {
  let nav = await utilities.getNav();
  const accountData = res.locals.accountData; 
  const { account_firstname, account_lastname, account_email, account_id } = req.body;

  const updateResult = await accountModel.updateAccount(
    account_firstname,
    account_lastname,
    account_email,
    account_id
  );

  if (updateResult) {
    req.flash("notice", "Account information successfully updated."); 

    const updatedAccountData = await accountModel.getAccountById(account_id);
    delete updatedAccountData.account_password;
    const accessToken = jwt.sign(updatedAccountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

    const cookieOptions = { httpOnly: true, maxAge: 3600 * 1000 };
    if (process.env.NODE_ENV !== "development") cookieOptions.secure = true;
    res.cookie("jwt", accessToken, cookieOptions);

    res.locals.accountData = updatedAccountData;
    res.locals.loggedin = 1;

    res.redirect("/account/");
  } else {
    req.flash("notice", "Sorry, the account update failed due to a server error.");
    res.status(500).render("account/account-update", {
        title: "Edit Account",
        nav,
        account_firstname,
        account_lastname,
        account_email,
        account_id,
        errors: res.locals.errors || null,
        notice: res.locals.notice || null,
    });
  }
}

/* ****************************************
 * Process Password Change
 * *************************************** */
async function changePassword(req, res) {
    let nav = await utilities.getNav();
    const { current_password, new_password, account_id } = req.body;
    const accountData = res.locals.accountData; 

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).render("account/account-update", {
            title: "Edit Account",
            nav,
            errors: errors.array(),
            notice: res.locals.notice || null,
            account_firstname: accountData.account_firstname, 
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id: accountData.account_id,
        })
    }
    
    const fullAccountData = await accountModel.getAccountById(account_id);
    
    if (!(await bcrypt.compare(current_password, fullAccountData.account_password))) {
        req.flash("notice", "The current password entered is incorrect.");
        return res.status(400).render("account/account-update", {
            title: "Edit Account",
            nav,
            errors: [{ msg: "The current password entered is incorrect." }],
            notice: res.locals.notice || null,
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id,
        });
    }

    let newHashedPassword;
    try {
        newHashedPassword = await bcrypt.hash(new_password, 10);
    } catch (error) {
        console.error("Password Hashing Error:", error);
        req.flash("notice", "Sorry, there was an error processing the new password.");
        return res.status(500).render("account/account-update", {
            title: "Edit Account",
            nav,
            notice: res.locals.notice || null,
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id,
        });
    }

    const updateResult = await accountModel.updatePassword(account_id, newHashedPassword);

    if (updateResult) {
        req.flash("notice", "Password successfully changed. Please log in with your new password.");
        res.redirect("/account/login");
    } else {
        req.flash("notice", "Sorry, the password change failed.");
        res.status(500).render("account/account-update", {
            title: "Edit Account",
            nav,
            notice: res.locals.notice || null,
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
  // CRITICAL FIX: Set flash message BEFORE session destruction
  req.flash("notice", "You have been successfully logged out.");

  // Clear the JWT cookie (client-side auth token)
  res.clearCookie("jwt");

  // Destroy the server-side session
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      // In case of error, still try to redirect. We already flashed the success notice.
    }
    
    // Redirect the client. This MUST be done inside the callback 
    // to ensure the session DELETE query is executed first.
    res.redirect("/"); 
  });
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