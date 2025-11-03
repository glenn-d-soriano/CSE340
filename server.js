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
// Use process.env.PORT, falling back to 5500
const port = process.env.PORT || 5500
// Use process.env.HOST (which Render sets to 0.0.0.0), falling back to '0.0.0.0'
const host = process.env.HOST || '0.0.0.0'

/* ***********************
 * Log statement to confirm server operation
 *************************/
// We now explicitly log the host variable, which will be 0.0.0.0 on Render.
app.listen(port, host, () => {
  console.log(`app listening on ${host}:${port}`)
})
