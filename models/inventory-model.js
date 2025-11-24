const pool = require("../database/");

/* ***************************
 * Get all classification data
 * ************************** */
async function getClassifications() {
  // Return the rows array directly
  const data = await pool.query("SELECT * FROM public.classification ORDER BY classification_name");
  return data.rows;
}

/* ***************************
 * Get all inventory items for a specific classification Id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
    try {
        const data = await pool.query(
            `SELECT * FROM public.inventory AS i
            JOIN public.classification AS c
            ON i.classification_id = c.classification_id
            WHERE i.classification_id = $1`,
            [classification_id]
        );
        // Return the rows array directly
        return data.rows;
    } catch (error) {
        console.error("getInventoryByClassificationId error: " + error);
        // Throw the error so the controller can properly catch and handle the 500.
        throw new Error("Database query failed while fetching classification inventory.");
    }
}

/* ***************************
 * Get inventory item by inv_id
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
        );
        // Returns single vehicle object
        return data.rows[0]; 
    } catch (error) {
        console.error("getInventoryById error: " + error);
        throw new Error("Database query failed while fetching single inventory item.");
    }
}

/* ***************************
 * Add new classification (TASK 2 - NEW CODE BLOCK)
 * ************************** */
async function addClassification(classification_name) {
    try {
        const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *";
        const result = await pool.query(sql, [classification_name]);
        // Returns true if one or more rows were inserted
        return result.rowCount > 0;
    } catch (error) {
        console.error("addClassification error: " + error);
        throw new Error("Database query failed while adding classification.");
    }
}

/* ***************************
 * Add new inventory item (TASK 3 - NEW CODE BLOCK)
 * ************************** */
async function addInventoryItem(item) {
    try {
        const sql = `
            INSERT INTO inventory (
                inv_make, inv_model, inv_year, inv_description, inv_image, 
                inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            item.inv_make,
            item.inv_model,
            item.inv_year,
            item.inv_description,
            item.inv_image,
            item.inv_thumbnail,
            item.inv_price,
            item.inv_miles,
            item.inv_color,
            item.classification_id
        ]);
        // Returns true if one or more rows were inserted
        return result.rowCount > 0;
    } catch (error) {
        console.error("addInventoryItem error: " + error);
        throw new Error("Database query failed while adding inventory item.");
    }
}

module.exports = { 
    getClassifications, 
    addClassification, // <--- NEWLY EXPORTED
    getInventoryByClassificationId, 
    getInventoryById, 
    addInventoryItem // <--- NEWLY EXPORTED
};