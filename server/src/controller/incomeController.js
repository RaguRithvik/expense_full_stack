import Income from "../models/Income.js";

// Get all incomes with pagination
export const getAllIncomes = async (req, res) => {
  try {
    // Get pagination parameters from query with defaults
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Get total count for pagination metadata
    const total = await Income.countDocuments();
    
    // Find incomes with pagination
    const incomes = await Income.find()
      .skip(skip)
      .limit(pageSize);
    
    // Return paginated results with metadata
    res.json({
      data: incomes,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get income by ID
export const getIncomeById = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }
    
    res.json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create income
export const createIncome = async (req, res) => {
  try {
    const income = await Income.create(req.body);
    res.status(201).json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update income
export const updateIncome = async (req, res) => {
  try {
    const income = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }
    
    res.json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete income
export const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }
    
    res.json({ message: "Income deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};