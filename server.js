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
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const baseRoute = require("./routes/baseRoute");


const app = express();
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");


/* ***********************
 * Middleware
 ************************/

// Session Middleware (must be first)
app.use(
  session({
    store: new (require("connect-pg-simple")(session))({
      createTableIfMissing: true,
      pool,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    name: "sessionId",
  })
);

// Cookie Parser (before flash and JWT)
app.use(cookieParser());

// Flash Middleware
app.use(flash());

/* ***********************
 * Global Locals Middleware (Re-inserted)
 ***********************
 * This middleware ensures the "messages" variable is always defined 
 * in all EJS views (even if empty) to prevent "messages is not defined" error.
 */
// Flash Helper Middleware
app.use((req, res, next) => {
  // res.locals.flash is now an object with arrays for notice and error
  res.locals.flash = {
    notice: req.flash("notice"),
    error: req.flash("error"),
  };
  next();
});


// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files and layouts middleware
app.use(express.static("public"));
app.use(expressLayouts);

/* ***********************
 * Universal JWT Check Middleware
 ************************/
app.use(utilities.checkJWT); // applied to all requests

/* ***********************
 * New Middleware: Set Logged In Status for EJS Views (Task 1 Fix)
 ************************/
app.use((req, res, next) => {
  // Check if session data (set by login or checkJWT) exists
  if (req.session.accountData) {
    // Set locals variables for EJS to use
    res.locals.loggedin = 1; // EJS checks for locals.loggedin
    res.locals.accountData = req.session.accountData; // EJS uses locals.accountData
  } else {
    // Ensure they are always defined, even if the user is logged out
    res.locals.loggedin = 0;
    res.locals.accountData = null;
  }
  next();
});

/* ***********************
 * View Engine and Templates
 ************************/
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "./layouts/layout");

/* ***********************
 * Locals & General Variables
 ************************/
// Global navigation variable
app.use(async (req, res, next) => {
  res.locals.nav = await utilities.getNav();
  // Optional: You can set the notice/error locals here if you prefer to 
  // do it globally, but for now, we rely on the controller passing them.
  next();
});

/* ***********************
 * Routes
 ************************/
app.use("/", baseRoute);        // Home/default route
app.use("/inv", inventoryRoute); 
app.use("/account", accountRoute);
app.use(staticRoute);           // Static routes

// 404 Route (must be last before error handler)
app.use(async (req, res, next) => {
  next({
    status: 404,
    message: "Sorry, we appear to have lost that page. Maybe it was abducted by space squirrels.",
  });
});

/* ***********************
 * Express Error Handler
 ************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav();

  console.error(`Error at "${req.originalUrl}": ${err.message}`);

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