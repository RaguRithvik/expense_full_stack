import Income from "../models/Income.js";

// Get all incomes with pagination and time-based filtering
export const getAllIncomes = async (req, res) => {
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
    const total = await Income.countDocuments(query);
    
    // Find incomes with pagination and filter
    const incomes = await Income.find(query)
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