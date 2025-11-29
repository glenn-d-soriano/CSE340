const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const Util = {}

/* ****************************************
 * Check Login
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
                    return res.redirect("/account/login") 
                }
                res.locals.accountData = accountData
                res.locals.loggedin = 1
                next()
            })
    } else {
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
 * Build the classification select list
 * *************************************** */
Util.buildClassificationList = async function (classification_id = null) {
    let data = await invModel.getClassifications()
    
    // The required fix: wrap the <option> tags in a <select> element
    // IMPORTANT: It MUST have the ID "classificationList" for the AJAX event listener to work.
    let classificationList = '<select name="classification_id" id="classificationList" required>'

    // Add the default 'Choose a Classification' option
    classificationList += "<option value=''>Choose a Classification</option>"
    
    // Data is already an array of classification objects from the model
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

    // Close the <select> element
    classificationList += '</select>'
    
    return classificationList
  }


/* ****************************************
* Middleware to handle errors
* Wrap an async function in this middleware to catch errors
* *************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)


module.exports = Util