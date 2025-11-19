/* ******************************************
 * server.js — main application file
 *******************************************/

// Load environmental variables first
require("dotenv").config()

const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const app = express()
const session = require("express-session")
const pool = require('./database/')

// REQUIRED: Import utilities for the error handler's navigation call and handleErrors
const utilities = require("./utilities/")

// Route imports
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")

/* ***********************
 * Middleware
 * ************************/

// Session Middleware (Must be first)
 app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
 }))

 // Express Messages Middleware (Must be AFTER Session)
app.use(require('connect-flash')())
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res)
  next()
})

// Static Files and Layouts Middleware (Must be BEFORE Routes)
app.use(express.static("public"))
app.use(expressLayouts)


/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.set("views", __dirname + "/views")
app.set("layout", "./layouts/layout")


/* ***********************
 * Routes
 *************************/
app.use(static)

// Index route - NOW WRAPPED with the new handleErrors function
// If baseController.buildHome throws an error, handleErrors catches it 
// and forwards it to the Express Error Handler below.
app.get("/", utilities.handleErrors(baseController.buildHome))

app.use("/inv", inventoryRoute)

// Account routes - add this AFTER inventory routes
const accountRoute = require("./routes/accountRoute")  // require the account route
app.use("/account", accountRoute)

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