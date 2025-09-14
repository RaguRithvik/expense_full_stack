import Budget from "../models/Budget.js";

// Get all budgets
export const getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find()
      // .populate("category_id")
      // .populate("subcat_id");
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get budget by ID
export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate("category_id")
      .populate("subcat_id");
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create budget
export const createBudget = async (req, res) => {
  try {
    const budget = await Budget.create(req.body);
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update budget
export const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete budget
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    res.json({ message: "Budget deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};