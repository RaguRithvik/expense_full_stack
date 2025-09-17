import express from "express";
import {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} from "../controller/budgetController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all budgets
router.get("/", auth, getAllBudgets);

// Get budget by ID
router.get("/:id", auth, getBudgetById);

// Create budget
router.post("/", auth, createBudget);

// Update budget
router.put("/:id", auth, updateBudget);

// Delete budget
router.delete("/:id", auth, deleteBudget);

export default router;
