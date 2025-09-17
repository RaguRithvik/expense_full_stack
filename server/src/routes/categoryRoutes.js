import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controller/categoryController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all categories
router.get("/", auth, getAllCategories);

// Get category by ID
router.get("/:id", auth, getCategoryById);

// Create category
router.post("/", auth, createCategory);

// Update category
router.put("/:id", auth, updateCategory);

// Delete category
router.delete("/:id", auth, deleteCategory);

export default router;
