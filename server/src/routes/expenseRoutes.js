import express from "express";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from "../controller/expenseController.js";

const router = express.Router();

// Get all expenses
router.get("/", getAllExpenses);

// Get expense by ID
router.get("/:id", getExpenseById);

// Create expense
router.post("/", createExpense);

// Update expense
router.put("/:id", updateExpense);

// Delete expense
router.delete("/:id", deleteExpense);

export default router;
