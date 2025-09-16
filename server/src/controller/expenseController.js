import Expense from "../models/Expense.js";

// Get all expenses with pagination and time-based filtering
export const getAllExpenses = async (req, res) => {
  try {
    // Get pagination parameters from query with defaults
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const filter = req.query.filter; // Get time filter (day, week, month)
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Create query object for filtering
    let query = {};
    
    // Apply time-based filtering if specified
    if (filter) {
      const now = new Date();
      
      if (filter === 'day') {
        // Filter for today
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        query.date = { $gte: startOfDay, $lt: endOfDay };
      } else if (filter === 'week') {
        // Filter for current week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week (next Sunday)
        
        query.date = { $gte: startOfWeek, $lt: endOfWeek };
      } else if (filter === 'month') {
        // Filter for current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        query.date = { $gte: startOfMonth, $lte: endOfMonth };
      }
    }
    
    // Get total count for pagination metadata based on filter
    const total = await Expense.countDocuments(query);
    
    // Find expenses with pagination and filter
    const expenses = await Expense.find(query)
      .populate("category_id")
      .populate("subcat_id")
      .skip(skip)
      .limit(pageSize);
    
    // Return paginated results with metadata
    res.json({
      data: expenses,
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

// Get expense by ID
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("category_id")
      .populate("subcat_id");
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create expense
export const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};