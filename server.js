/* ******************************************
 * server.js — main application file
 *******************************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const env = require("dotenv").config()
const app = express()

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
app.get("/", baseController.buildHome)
app.use("/inv", inventoryRoute)

/* ***********************
 * Server Configuration
 *************************/
const port = process.env.PORT || 5500
const host = process.env.HOST || "0.0.0.0"

app.listen(port, host, () => {
  console.log(`App listening on ${host}:${port}`)
})
