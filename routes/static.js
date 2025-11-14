const express = require('express');
const router = express.Router();
// Import the 'path' module to correctly join directories
const path = require('path'); 

// Static Routes

// 1. Set up "public" folder as the static root.
// This allows files to be requested relative to the project root (e.g., /css/styles.css or /images/vehicles/car.jpg)
// The path.join ensures that we correctly build the path to the 'public' folder 
// regardless of where static.js lives.
router.use(express.static(path.join(__dirname, '..', 'public')));

// IMPORTANT: Do not add separate lines for /css, /js, or /images 
// if they are all inside the 'public' folder, as the line above covers them all.

module.exports = router;