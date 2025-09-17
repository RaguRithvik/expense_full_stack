import express from "express";
import {
  getAllIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome
} from "../controller/incomeController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all incomes
router.get("/", auth, getAllIncomes);

// Get income by ID
router.get("/:id", auth, getIncomeById);

// Create income
router.post("/", auth, createIncome);

// Update income
router.put("/:id", auth, updateIncome);

// Delete income
router.delete("/:id", auth, deleteIncome);

export default router;
