const pool = require("../database/");

/* *****************************
* Submit a new review
* *************************** */
async function submitReview(review_text, inv_id, account_id) {
    try {
        const sql = "INSERT INTO review (review_text, inv_id, account_id) VALUES ($1, $2, $3) RETURNING *";
        const result = await pool.query(sql, [review_text, inv_id, account_id]);
        return result.rows[0];
    } catch (error) {
        console.error("submitReview error: " + error);
        return error;
    }
}

/* *****************************
* Get all reviews for a specific inventory item
* *************************** */
async function getReviewsByInventoryId(inv_id) {
    try {
        const sql = `
            SELECT 
                review_id,
                review_text,
                review_date,
                -- FIX: Qualify the ambiguous column name 'account_id'
                review.account_id, 
                review.inv_id,
                account_firstname,
                account_lastname
            FROM 
                review
            JOIN 
                account ON review.account_id = account.account_id
            WHERE 
                review.inv_id = $1
            ORDER BY 
                review_date DESC
        `;
        const result = await pool.query(sql, [inv_id]);
        return result.rows;
    } catch (error) {
        console.error("getReviewsByInventoryId error: " + error);
        // Do NOT return the error directly, but an empty array/null if needed
        return null; 
    }
}

module.exports = {
    submitReview,
    getReviewsByInventoryId,
};