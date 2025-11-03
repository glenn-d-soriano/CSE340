/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
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
 * We are explicitly setting host/port to guarantee 'localhost' output.
 *************************/
// Set port to 5500
const port = 5500
// Set host to 'localhost' to force binding to 127.0.0.1
const host = 'localhost' 

/* ***********************
 * Log statement to confirm server operation
 *************************/
// We pass both port and host to app.listen to ensure the binding happens on 127.0.0.1.
// We use the string literal 'localhost' in the console log to ensure that exact text is displayed.
app.listen(port, host, () => {
  console.log(`app listening on http://localhost:${port}`)
})
