const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* ***************************
 * Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = utilities.handleErrors(async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)

  // If no vehicles found, handle gracefully
  if (!data || data.length === 0) {
    const nav = await utilities.getNav()
    return res.render("./inventory/classification", {
      title: "No Vehicles Found",
      nav,
      grid: '<p class="notice">Sorry, no vehicles could be found for this classification.</p>'
    })
  }

  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name || "Vehicles"
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
})

/* *************************
 * Build single vehicle detail view
 * ************************* */
invCont.buildByInvId = utilities.handleErrors(async (req, res, next) => {
  const inv_id = req.params.invId
  const vehicle = await invModel.getInventoryById(inv_id)
  
  // Throw a 404 error if no vehicle is found
  if (!vehicle) {
    const err = new Error("No vehicle found")
    err.status = 404
    next(err)
    return
  }

  const detailHTML = await utilities.buildInventoryDetail(vehicle)
  let nav = await utilities.getNav()

  // Safe defaults for title
  const title = `${vehicle.inv_year || ""} ${vehicle.inv_make || ""} ${vehicle.inv_model || ""}`.trim() || "Vehicle Details"

  console.log(vehicle)

  res.render("./inventory/detail", {
    title,
    nav,
    detailHTML,
  })
})
// In controllers/invController.js
invCont.triggerError = async function (req, res, next) {
  throw new Error("Intentional 500 Server Error");
}
module.exports = invCont
