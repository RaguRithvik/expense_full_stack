import express from "express";
import {
  getAllSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from "../controller/subcategoryController.js";

const router = express.Router();

// Get all subcategories
router.get("/", getAllSubcategories);

// Get subcategory by ID
router.get("/:id", getSubcategoryById);

// Create subcategory
router.post("/", createSubcategory);

// Update subcategory
router.put("/:id", updateSubcategory);

// Delete subcategory
router.delete("/:id", deleteSubcategory);

export default router;
