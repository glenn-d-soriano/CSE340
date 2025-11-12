const utilities = require("../utilities/")
const baseController = {}

/* ****************************************
 * Build home view
 * *************************************** */
baseController.buildHome = async function (req, res) {
  const nav = await utilities.getNav()
  res.render("index", { title: "Home", nav })
}

module.exports = baseController
