const utilities = require("../utilities/"); // Import necessary utilities
const accountModel = require("../models/account-model"); // <-- Add this

/* ****************************************
 * Deliver Login view
 * *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();
  const errors = req.flash("error");
  const notice = req.flash("notice");

  res.render("account/login", {
    title: "Login",
    nav,
    errors: errors.length > 0 ? errors : null,
    notice: notice.length > 0 ? notice : null,
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
    messages: null
  });
}

/* ****************************************
 * Process registration
 * *************************************** */
/* ****************************************
*  Process registration
* *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav();
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    account_password
  );

  if (regResult) {
    // Add flash message for successful registration
    req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`);
    
    // Redirect to login page (flash message will show there)
    res.redirect("/account/login");
  } else {
    req.flash("error", "Sorry, the registration failed.");
    res.redirect("/account/register");
  }
}


module.exports = { buildLogin, buildRegister, registerAccount };
