// ✅ Register Routes
import express from "express";
import budgetRoutes from "./budgetRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import subcategoryRoutes from "./subcategoryRoutes.js";
import expenseRoutes from "./expenseRoutes.js";
import incomeRoutes from "./incomeRoutes.js";

// Create router
const router = express.Router();

// Mount routes on router
router.use("/budgets", budgetRoutes);        // GET /api/budgets
router.use("/categories", categoryRoutes);   // GET /api/categories
router.use("/subcategories", subcategoryRoutes); // GET /api/subcategories
router.use("/expenses", expenseRoutes);      // GET /api/expenses
router.use("/income", incomeRoutes);  

// Export router for use in server.js
export default router;