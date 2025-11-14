const invModel = require("../models/inventory-model")
const Util = {}

/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function(data){
  let grid
  if(data.length > 0){
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => { 
      grid += '<li>'
      grid +=  '<a href="../../inv/detail/'+ vehicle.inv_id 
      + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 
      + 'details"><img src="' + vehicle.inv_thumbnail 
      +'" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 
      +' on CSE Motors" /></a>'
      grid += '<div class="namePrice">'
      grid += '<hr />'
      grid += '<h2>'
      grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View ' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
      grid += '</h2>'
      grid += '<span>$' 
      + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
      grid += '</div>'
      grid += '</li>'
    })
    grid += '</ul>'
  } else { 
    grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */


Util.getNav = async function (req, res, next) {
  let data = await invModel.getClassifications()
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}

/* ****************************************
* Function to build the specific vehicle detail view HTML
* This uses simpler classes and a clean list structure.
* **************************************** */
Util.buildVehicleDetail = function(vehicle) {
  if (!vehicle) {
    return '<p class="notice">Sorry, that vehicle could not be found.</p>'
  }

  // 1. Format price (e.g., $10,000)
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(vehicle.inv_price);
  
  // 2. Format mileage (e.g., 10,000)
  const formattedMileage = new Intl.NumberFormat('en-US').format(vehicle.inv_miles);

  // Responsive outer container
  let detailHTML = '<div class="vehicle-detail">'

  // Vehicle Image Block
  detailHTML += '<div class="detail-image-wrapper">'
  detailHTML += `<img src="${vehicle.inv_image}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model}" class="detail-img">`
  detailHTML += '</div>'

  // Vehicle Details List Block
  detailHTML += '<div class="detail-info-wrapper">'
  detailHTML += `<h2 class="detail-header">${vehicle.inv_make} ${vehicle.inv_model}</h2>`
  
  // Price is separate and bold
  detailHTML += `<p class="price-display">Price: <span>${formattedPrice}</span></p>`

  // Details Section (Table-like list)
  detailHTML += '<h3>Specifications</h3>'
  detailHTML += '<ul class="detail-list">'
  detailHTML += `<li><strong>Description:</strong> ${vehicle.inv_description}</li>`
  detailHTML += `<li><strong>Color:</strong> ${vehicle.inv_color}</li>`
  detailHTML += `<li><strong>Mileage:</strong> ${formattedMileage} Miles</li>`
  detailHTML += `<li><strong>Year:</strong> ${vehicle.inv_year}</li>`
  detailHTML += `<li><strong>Make:</strong> ${vehicle.inv_make}</li>`
  detailHTML += `<li><strong>Model:</strong> ${vehicle.inv_model}</li>`
  detailHTML += '</ul>'

  detailHTML += '</div>'
  detailHTML += '</div>'

  return detailHTML
}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = Util
