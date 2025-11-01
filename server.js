/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const env = require("dotenv").config()
const app = express()
const static = require("./routes/static")

/* ***********************
 * Static File Middleware (NEW ADDITION)
 * Tells Express where to find files like CSS, JS, and images.
 * This is critical for serving your homepage.
 *************************/
app.use(express.static("public"))


/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") // not at views root


/* ***********************
 * Routes
 *************************/
app.use(static) 
app.get("/", function (req, res) {
  res.render("index", {title: "Home"})
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
// IMPORTANT FIX: Added fallback values (|| 5500 and || '0.0.0.0') 
// to ensure the server always has a port and host to listen on, even if 
// environment variables fail to load.
const port = process.env.PORT || 5500
const host = process.env.HOST || '0.0.0.0'

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})