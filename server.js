/* ******************************************
 * server.js — main application file
 *******************************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const env = require("dotenv").config()
const app = express()
// REQUIRED: Import utilities for the error handler's navigation call and handleErrors
const utilities = require("./utilities/")

// Route imports
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.set("views", __dirname + "/views")
app.set("layout", "./layouts/layout")

/* ***********************
 * Middleware
 *************************/
app.use(express.static("public"))
app.use(expressLayouts)

/* ***********************
 * Routes
 *************************/
app.use(static)

// Index route - NOW WRAPPED with the new handleErrors function
// If baseController.buildHome throws an error, handleErrors catches it 
// and forwards it to the Express Error Handler below.
app.get("/", utilities.handleErrors(baseController.buildHome))

app.use("/inv", inventoryRoute)

// File Not Found Route - must be the LAST route in the list
app.use(async (req, res, next) => {
  // Sends an error object (status 404, custom message) to the Express Error Handler
  next({status: 404, message: 'Sorry, we appear to have lost that page. Maybe it was abducted by space squirrels.'})
})

/* ***********************
* Express Error Handler
* Place after all other middleware
*************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav()
  
  // Log the detailed error to the console for internal use
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  
  let message 
  
  // REVISED LOGIC: Check for 404, otherwise use a generic message 
  // to prevent revealing internal server details (like 'nav is undefined').
  if(err.status == 404){ 
      message = err.message
  } else {
      message = 'Oh no! There was a crash. Maybe try a different route?'
  }

  res.render("errors/error", {
    // Pass the status code as the title, or a generic 'Server Error'
    title: err.status || 'Server Error', 
    message, 
    nav
  })
})


/* ***********************
 * Server Configuration
 *************************/
const port = process.env.PORT || 5500
const host = process.env.HOST || "0.0.0.0"

app.listen(port, host, () => {
  console.log(`App listening on ${host}:${port}`)
})