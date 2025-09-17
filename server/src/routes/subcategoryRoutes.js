import express from "express";
import {
  getAllSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from "../controller/subcategoryController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get all subcategories
router.get("/", auth, getAllSubcategories);

// Get subcategory by ID
router.get("/:id", auth, getSubcategoryById);

// Create subcategory
router.post("/", auth, createSubcategory);

// Update subcategory
router.put("/:id", auth, updateSubcategory);

// Delete subcategory
router.delete("/:id", auth, deleteSubcategory);

export default router;
