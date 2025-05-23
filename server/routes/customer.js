import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

router.get("/checkDuplicate", async (req, res) => {
  const { name, email } = req.query;

  try {
    const [nameResult] = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE Name = ?",
      [name]
    );
    const [emailResult] = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE Email = ?",
      [email]
    );

    res.json({
      nameExists: nameResult[0].count > 0,
      emailExists: emailResult[0].count > 0,
    });
  } catch (err) {
    console.error("Error checking duplicates:", err.stack);
    res.status(500).json({
      nameExists: false,
      emailExists: false,
      error: "Error checking duplicates",
    });
  }
});

router.post("/add_customer", async (req, res) => {
  const formData = req.body;

  try {
    const [nameResult] = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE Name = ?",
      [formData.Name]
    );
    const [emailResult] = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE Email = ?",
      [formData.Email]
    );

    if (nameResult[0].count > 0) {
      return res.status(400).json({
        added: false,
        message: "A customer with this name already exists",
      });
    }
    if (emailResult[0].count > 0) {
      return res.status(400).json({
        added: false,
        message: "A customer with this email already exists",
      });
    }

    const sql = `
      INSERT INTO customers 
      (Name, Email, Phone, Address, Area, City, State, Status, GST, ProviderID) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      formData.Name,
      formData.Email,
      formData.Phone,
      formData.Address,
      formData.Area,
      formData.City,
      formData.State,
      formData.Status,
      formData.GST,
      formData.ProviderID || 1,
    ];

    const [result] = await pool.query(sql, values);
    res.json({ added: true, data: formData });
  } catch (err) {
    console.error("Error inserting data:", err.stack);
    res.status(500).send("Error inserting data");
  }
});

router.get("/getCustomerData", async (req, res) => {
  const sql = "SELECT * FROM customers";
  try {
    const [result] = await pool.query(sql);
    res.json(result);
  } catch (err) {
    console.error("Error fetching customer data:", err.stack);
    res.status(500).send("Error fetching customer data");
  }
});

router.delete("/deleteCustomer", async (req, res) => {
  const { email } = req.body;
  const sql = "DELETE FROM customers WHERE Email = ?";

  try {
    const [result] = await pool.query(sql, [email]);
    res.json({
      status: result.affectedRows > 0,
      message:
        result.affectedRows > 0
          ? "Customer deleted successfully"
          : "Customer not found",
    });
  } catch (err) {
    console.error("Error deleting customer:", err.stack);
    res.status(500).json({ status: false, message: "Error deleting customer" });
  }
});

router.post("/updateCustomer", async (req, res) => {
  const { Email, Name, Phone, Area, Address, City, State, Status, GST } =
    req.body;

  try {
    const [nameResult] = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE Name = ? AND Email != ?",
      [Name, Email]
    );
    const [emailResult] = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE Email = ?",
      [Email]
    );

    if (nameResult[0].count > 0) {
      return res.status(400).json({
        status: false,
        message: "Another customer with this name already exists",
      });
    }

    const sql = `
      UPDATE customers
      SET Name = ?, Phone = ?, Area = ?, Address = ?, City = ?, State = ?, Status = ?, GST = ?
      WHERE Email = ?
    `;

    const [result] = await pool.query(sql, [
      Name,
      Phone,
      Area,
      Address,
      City,
      State,
      Status,
      GST,
      Email,
    ]);

    res.json({
      status: result.affectedRows > 0,
      message:
        result.affectedRows > 0
          ? "Customer data updated successfully"
          : "Customer not found",
    });
  } catch (err) {
    console.error("Error updating customer:", err.stack);
    res
      .status(500)
      .json({ status: false, message: "Error updating customer data" });
  }
});

export { router as customerRouter };
