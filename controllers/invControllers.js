const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

/* *************************
 * Build single vehicle detail view
 * ************************* */
invCont.buildByInvId = utilities.handleErrors(async (req, res, next) => {
  const inv_id = req.params.invId
  const data = await invModel.getInventoryByInvId(inv_id)
  
  // Throw a 404 error if no vehicle is found
  if (!data || data.length === 0) {
    const err = new Error("No vehicle found")
    err.status = 404
    next(err)
    return
  }
  
  // We expect only one vehicle, so use data[0]
  const vehicle = data[0]
  
  const detailHTML = utilities.buildVehicleDetail(vehicle)
  let nav = await utilities.getNav()

  // Use the vehicle's make and model for the page title
  const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`

  res.render("./inventory/detail", {
    title: title,
    nav,
    detailHTML,
  })
})

module.exports = invCont
