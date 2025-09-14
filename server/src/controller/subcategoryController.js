import Subcategory from "../models/Subcategory.js";

// Get all subcategories
export const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find().populate("category_id");
    res.json(subcategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get subcategory by ID
export const getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate("category_id");
    
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    
    res.json(subcategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create subcategory
export const createSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.create(req.body);
    res.status(201).json(subcategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update subcategory
export const updateSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    
    res.json(subcategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete subcategory
export const deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
    
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    
    res.json({ message: "Subcategory deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};