/* ******************************************
 * server.js — main application file
 *******************************************/

// Load environmental variables first
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser"); 
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const pool = require("./database/");
const utilities = require("./utilities/");

// Route imports
const staticRoute = require("./routes/static");
// We don't need to import baseController here anymore as baseRoute handles it
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute"); // Account routes
const baseRoute = require("./routes/baseRoute"); // <-- Ensure this is imported

const app = express();
const cookieParser = require("cookie-parser");


/* ***********************
 * Middleware
 ************************/

// Session Middleware (Must be first)
app.use(
  session({
    store: new (require("connect-pg-simple")(session))({
      createTableIfMissing: true,
      pool,
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: "sessionId",
  })
);

// Express Messages Middleware (after session)
app.use(require("connect-flash")());
app.use(function (req, res, next) {
  res.locals.messages = req.flash(); // make req.flash() available globally
  next();
});

// Body parser middleware (for JSON and form data)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files and layouts middleware (before routes)
app.use(express.static("public"));
app.use(expressLayouts);

// Cookie Parser Middleware (MUST BE BEFORE checkJWT)
app.use(cookieParser());

/* ***********************
 * Universal JWT Check Middleware
 * Applied to ALL requests to check the cookie and set res.locals.loggedin.
 * MUST be after cookieParser.
 * ************************/
app.use(utilities.checkJWT); // <-- CORRECT UNIVERSAL MIDDLEWARE APPLIED

// Removed: app.use(utilities.checkLogin) as it is used only for protected routes.


/* ***********************
 * View Engine and Templates
 ************************/
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "./layouts/layout");

/* ***********************
 * Locals & General Variables
 * ************************/
// Set up global res.locals.nav variable for the navigation bar
// This must run before all route handlers
app.use(async (req, res, next) => {
  res.locals.nav = await utilities.getNav();
  next();
});

/* ***********************
 * Routes
 ************************/
// Default/Home Route - MUST BE LOADED FIRST
app.use("/", baseRoute); // <-- Use modular route file for the root path

// Inventory and Account Routes
app.use("/inv", inventoryRoute);
app.use("/account", accountRoute); // Account routes

// Static route (keep near the end)
app.use(staticRoute); 


// 404 Route - must be last route before error handler
app.use(async (req, res, next) => {
  next({
    status: 404,
    message:
      "Sorry, we appear to have lost that page. Maybe it was abducted by space squirrels.",
  });
});

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 ************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav();

  // Log the detailed error to the console for internal use
  console.error(`Error at: "${req.originalUrl}": ${err.message}`);

  const message =
    err.status === 404
      ? err.message
      : "Oh no! There was a crash. Maybe try a different route?";

  res.status(err.status || 500).render("errors/error", {
    title: err.status || "Server Error",
    message,
    nav,
  });
});

/* ***********************
 * Server Configuration
 *************************/
const port = process.env.PORT || 5500;
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`App listening on ${host}:${port}`);
});