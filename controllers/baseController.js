const utilities = require("../utilities/")
const baseController = {}

/* ****************************************
 * Build home view
 * *************************************** */
baseController.buildHome = async function (req, res) {
  // TEMPORARILY COMMENTED OUT TO TEST ERROR HANDLER
  const nav = await utilities.getNav() 
  res.render("index", { title: "Home", nav })
}

module.exports = baseController
