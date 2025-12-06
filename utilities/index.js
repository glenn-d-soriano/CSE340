const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const Util = {}

/* ****************************************
 * Check JWT (runs on every page load to populate res.locals)
 * ************************************ */
Util.checkJWT = (req, res, next) => {
    // FIX: Ensure req.cookies exists before accessing req.cookies.jwt
    if (req.cookies && req.cookies.jwt) {
        jwt.verify(
            req.cookies.jwt,
            process.env.ACCESS_TOKEN_SECRET,
            function (err, accountData) {
                if (err) {
                    req.flash("notice", "Please log in")
                    res.clearCookie("jwt")
                    // IMPORTANT: When JWT is invalid, clear session data just in case
                    req.session.accountData = null;
                    return res.redirect("/account/login") 
                }
                
                // CRITICAL ADDITION 1: Save data to the SESSION (req.session) 
                // This makes the data persistently available across controllers and middlewares.
                req.session.accountData = accountData

                // Keep setting res.locals here so Util.checkLogin (and the header) works immediately.
                res.locals.accountData = accountData
                res.locals.loggedin = 1
                next()
            })
    } else {
        // CRITICAL ADDITION 2: Explicitly define locals when no JWT is present.
        // This prevents the "variable is not defined" error in EJS views.
        res.locals.loggedin = 0;
        res.locals.accountData = null;
        next()
    }
}

/* **************************************
 * Middleware to check if user is logged in (PROTECTED ROUTE CHECK)
 * This runs on specific routes (e.g., /account) to force a login/redirect.
 * ************************************ */
Util.checkLogin = (req, res, next) => {
  // Checks the flag set by checkJWT
  if (res.locals.loggedin) { 
    next() // User is logged in, continue to the controller
  } else {
    // User is NOT logged in, redirect to login page
    req.flash("notice", "Please log in.") 
    return res.redirect("/account/login") // <-- The redirect logic
  }
}

/* **************************************
 * Middleware to check for Employee or Admin account type
 * REQUIRED FOR THE INVENTORY MANAGEMENT ROUTE (/inv)
 * ************************************ */
Util.checkEmployeeOrAdmin = (req, res, next) => {
    // Check if accountData exists and extract the account_type, default to an empty string if not
    const accountType = res.locals.accountData ? res.locals.accountData.account_type : '';
  
    if (accountType === 'Employee' || accountType === 'Admin') {
      next(); // User is authorized, proceed to the next middleware/controller
    } else {
      // CRITICAL: Set the flash message before redirecting
      req.flash("notice", "You do not have the necessary authorization to access inventory management.");
      
      // Redirect to the account management page for unauthorized users
      return res.redirect("/account");
    }
  };

/* **************************************
 * Build the navigation menu
 * ************************************ */
Util.getNav = async function () {
    let data = await invModel.getClassifications()
    // Since invModel.getClassifications() already returns the array of rows.
    const classificationData = data; 

    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'

    if (Array.isArray(classificationData)) {
        classificationData.forEach((row) => {
            list += "<li>"
            list +=
                '<a href="/inv/classification/' + 
                row.classification_id +
                '" title="See our inventory of ' +
                row.classification_name +
                ' vehicles">' +
                row.classification_name +
                "</a>"
            list += "</li>"
        })
    }
    list += "</ul>"
    return list
}

/* ****************************************
 * Build the classification view grid
 * *************************************** */
Util.buildClassificationGrid = async function (data) {
    let grid
    if (data.length > 0) {
        grid = '<ul class="inv-grid">'
        data.forEach(vehicle => {
            grid += '<li>'
            // Sanitizing path by removing public/ and lowercasing
            const thumbnailPath = (vehicle.inv_thumbnail || "").replace("public/", "").toLowerCase(); 
            grid += '<a href="../../inv/detail/' + vehicle.inv_id + '" title="View ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' details"><img src="' + thumbnailPath + '" alt="Image of ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' on CSE Motors"></a>'
            grid += '<div class="namePrice">'
            grid += '<h2>'
            grid += '<a href="../../inv/detail/' + vehicle.inv_id + '" title="View ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
            grid += '</h2>'
            grid += '<span>$' +
                new Intl.NumberFormat('en-US').format(vehicle.inv_price) +
                '</span>'
            grid += '</div>'
            grid += '</li>'
        })
        grid += '</ul>'
    } else {
        grid = '<p class="notice">Sorry, no vehicles could be found.</p>'
    }
    return grid
}

/* ****************************************
 * Build the HTML for the vehicle detail view
 * *************************************** */
Util.buildInventoryDetail = async function (detailData) {
    // detailData is expected to be a single object from invModel.getInventoryById
    const vehicle = Array.isArray(detailData) ? detailData[0] : detailData;

    if (!vehicle) {
        return `<p class="notice">Sorry, no vehicle information could be found.</p>`;
    }

    // Clean up the image path
    const imageUrl = (vehicle.inv_image || "").replace("public/", "").toLowerCase();


    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(vehicle.inv_price || 0);

    const mileage = vehicle.inv_miles != null ? new Intl.NumberFormat('en-US').format(vehicle.inv_miles) : "N/A";
    const color = vehicle.inv_color || "N/A";
    const year = vehicle.inv_year || "N/A";
    const stock = vehicle.inv_stock != null ? vehicle.inv_stock : "N/A"; 
    const description = vehicle.inv_description || "N/A";
    const makeModel = `${vehicle.inv_make || "N/A"} ${vehicle.inv_model || ""}`;

    let html = `
        <div class="vehicle-detail">
            <div class="detail-image-wrapper">
                <img src="${imageUrl}" alt="${makeModel} image" loading="lazy">
            </div>

            <div class="detail-info-card">
                <h2>${makeModel} Details</h2>

                <section class="price-section">
                    <h3>Price: <span>${formattedPrice}</span></h3>
                </section>

                <section class="description-section">
                    <h4>Description</h4>
                    <p>${description}</p>
                </section>

                <section class="general-info-section">
                    <h4>General Information</h4>
                    <ul class="info-list">
                        <li><strong>Mileage:</strong> ${mileage}</li>
                        <li><strong>Color:</strong> ${color}</li>
                        <li><strong>Year:</strong> ${year}</li>
                        <li><strong>In Stock:</strong> ${stock}</li>
                    </ul>
                </section>
            </div>
        </div>
    `;
    return html;
}

/* ****************************************
 * Build the full classification select list (Used for Inventory Management)
 * This includes the <select> wrapper tags.
 * *************************************** */
Util.buildClassificationList = async function (classification_id = null) {
    let data = await invModel.getClassifications()
    
    // Includes the select wrapper tags, necessary for pages like Inventory Management
    let classificationList = '<select name="classification_id" id="classificationList" required>'; 
    classificationList += "<option value=''>Choose a Classification</option>"
    
    // Loop to build options
    data.forEach((row) => {
      classificationList += `<option value="${row.classification_id}"`
      if (
        classification_id != null &&
        Number(row.classification_id) === Number(classification_id)
      ) {
        classificationList += " selected "
      }
      classificationList += `>${row.classification_name}</option>`
    })

    classificationList += '</select>'
    
    return classificationList
  }

/* ****************************************
 * Build classification options only (Used for Add/Edit Forms)
 * This ONLY returns the <option> tags, assumes the EJS template has the <select> wrapper.
 * *************************************** */
Util.buildClassificationOptions = async function (classification_id = null) {
    let data = await invModel.getClassifications()
    
    // Only includes options, assumes the EJS template provides the <select> tag.
    let classificationOptions = "<option value=''>Choose a Classification</option>"
    
    // Loop to build options
    data.forEach((row) => {
      classificationOptions += `<option value="${row.classification_id}"`
      if (
        classification_id != null &&
        Number(row.classification_id) === Number(classification_id)
      ) {
        classificationOptions += " selected "
      }
      classificationOptions += `>${row.classification_name}</option>`
    })
    
    return classificationOptions
  }

/* ****************************************
 * ENHANCEMENT: Build the HTML list of vehicle reviews
 * *************************************** */
Util.buildReviewsList = function (reviewData) {
    if (!reviewData || reviewData.length === 0) {
        return '<p class="notice">Be the first to leave a review!</p>';
    }

    let html = '<section class="reviews-list-section">';
    html += '<h3>Customer Reviews</h3>';
    html += '<ul class="reviews-list">';

    reviewData.forEach(review => {
        // 1. Format the date (e.g., "November 15, 2023")
        const date = new Date(review.review_date);
        const formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);

        // 2. Format the reviewer's name (e.g., "Jane D.") for display
        const reviewerName = `${review.account_firstname} ${review.account_lastname.charAt(0)}.`;

        html += '<li>';
        // Review header: Name reviewed on Date
        html += `<div class="review-header"><strong>${reviewerName}</strong> reviewed on ${formattedDate}</div>`;
        // Review content
        html += `<p class="review-text">${review.review_text}</p>`;
        html += '</li>';
    });

    html += '</ul>';
    html += '</section>';

    return html;
};

/* ****************************************
 * Middleware to handle errors
 * Wrap an async function in this middleware to catch errors
 * *************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)


module.exports = Util