import express from "express";
import {
  getAllIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome
} from "../controller/incomeController.js";

const router = express.Router();

// Get all incomes
router.get("/", getAllIncomes);

// Get income by ID
router.get("/:id", getIncomeById);

// Create income
router.post("/", createIncome);

// Update income
router.put("/:id", updateIncome);

// Delete income
router.delete("/:id", deleteIncome);

export default router;
