import express from "express";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from "../controller/expenseController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all expenses
router.get("/", auth, getAllExpenses);

// Get expense by ID
router.get("/:id", auth, getExpenseById);

// Create expense
router.post("/", auth, createExpense);

// Update expense
router.put("/:id", auth, updateExpense);

// Delete expense
router.delete("/:id", auth, deleteExpense);

export default router;
