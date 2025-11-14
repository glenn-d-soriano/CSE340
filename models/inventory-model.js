const pool = require("../database/")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
       JOIN public.classification AS c 
       ON i.classification_id = c.classification_id 
       WHERE i.classification_id = $1`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getInventoryByClassificationId error " + error)
    throw new Error("Database error while fetching classification inventory.");
  }
}

/* ***************************
 * Get inventory item by inv_id
 * Uses a Prepared Statement (parameterized query)
 * ************************** */
async function getInventoryById(inv_id) {
  try {
    const data = await pool.query(
      `SELECT 
        inv_id, inv_make, inv_model, inv_year, inv_description, inv_image, 
        inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
      FROM public.inventory
      WHERE inv_id = $1`,
      [inv_id]
    )
    return data.rows[0] // Returns the single vehicle object
  } catch (error) {
    console.error("getInventoryById error: " + error)
    // IMPORTANT: Throw a new error to be caught by the middleware/controller
    throw new Error("Database error while fetching single inventory item.");
  }
}

// Export all functions
module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getInventoryById
}
 