const jwt = require("jsonwebtoken");
const utilities = require("../utilities/"); 

/**
 * Middleware to check if the user is authenticated (has a valid JWT)
 * and has the necessary authorization (account_type is 'Employee' or 'Admin')
 * to access inventory management views.
 *
 * This function is used to protect routes that only employees or admins should access.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const checkEmployeeOrAdmin = (req, res, next) => {
    // 1. Check for JWT authentication (Is the user logged in?)
    if (!req.cookies.jwt) {
        req.flash("notice", "Access Denied. You must be logged in to view this page.");
        // If not logged in, redirect them to the login page
        return res.redirect("/account/login");
    }

    // 2. Verify and decode the JWT using the secret key
    jwt.verify(
        req.cookies.jwt,
        process.env.ACCESS_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) {
                // If token is invalid (e.g., expired or tampered with)
                req.flash("notice", "Invalid or expired token. Please log in again.");
                return res.redirect("/account/login");
            }

            // 3. Check for Authorization (Does the user have the right role?)
            const accountType = decoded.account_type;

            if (accountType === "Employee" || accountType === "Admin") {
                // User is authorized: store decoded data (which includes user details)
                // into res.locals so the controller can access it.
                res.locals.accountData = decoded; 
                next(); // Continue to the next middleware or the controller
            } else {
                // User is authenticated but is not an authorized role (e.g., 'Client')
                req.flash("notice", `Access Denied. Your account type (${accountType}) is not authorized for this action.`);
                // Redirect unauthorized users back to their account dashboard
                return res.redirect("/account");
            }
        }
    );
};

module.exports = { checkEmployeeOrAdmin };