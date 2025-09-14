import express from "express";
import {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} from "../controller/budgetController.js";

const router = express.Router();

// Get all budgets
router.get("/", getAllBudgets);

// Get budget by ID
router.get("/:id", getBudgetById);

// Create budget
router.post("/", createBudget);

// Update budget
router.put("/:id", updateBudget);

// Delete budget
router.delete("/:id", deleteBudget);

export default router;
