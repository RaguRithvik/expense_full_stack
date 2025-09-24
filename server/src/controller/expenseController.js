import Expense from "../models/Expense.js";

// Get all expenses with pagination, filtering, and reporting
export const getAllExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { filter, category, subcategory, reportType } = req.query;

    const skip = (page - 1) * pageSize;
    let query = {};
    const now = new Date();

    // --- Common filters ---
    if (category) query.category_id = category;
    if (subcategory) query.subcat_id = subcategory;

    if (filter) {
      if (filter === "day") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        query.date = { $gte: start, $lt: end };
      } else if (filter === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        query.date = { $gte: start, $lt: end };
      } else if (filter === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      } else if (filter === "year") {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear() + 1, 0, 1);
        query.date = { $gte: start, $lt: end };
      }
    }

    // --- REPORT TYPE (daily/weekly/monthly/yearly) ---
    if (reportType || category || subcategory) {
      let reportData = [];
      let aggQuery = { ...query }; // base filter

      // --- Determine aggregation key ---
      let groupId = null;
      let labels = [];

      if (reportType) {
        const now = new Date();
        switch (reportType) {
          case "daily":
            groupId = { $dayOfWeek: "$date" };
            labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            break;
          case "weekly":
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            aggQuery.date = { $gte: startOfMonth, $lte: endOfMonth };
            groupId = { $week: "$date" };
            labels = Array.from({ length: Math.ceil(endOfMonth.getDate() / 7) }, (_, i) => `Week ${i + 1}`);
            break;
          case "monthly":
            groupId = { $month: "$date" };
            labels = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];
            aggQuery.date = { $gte: new Date(now.getFullYear(), 0, 1), $lt: new Date(now.getFullYear() + 1, 0, 1) };
            break;
          case "yearly":
            groupId = { $year: "$date" };
            const currentYear = new Date().getFullYear();
            labels = Array.from({ length: 4 }, (_, i) => (currentYear - (3 - i)).toString());
            break;
        }
      } else if (category) {
        groupId = "$category_id";
      } else if (subcategory) {
        groupId = "$subcat_id";
      }

      // --- Aggregation ---
      let agg = await Expense.aggregate([
        { $match: aggQuery },
        { $group: { _id: groupId, total: { $sum: "$amount" } } },
      ]);

      // --- Map aggregation results to labels if applicable ---
      if (reportType) {
        reportData = labels.map((label, i) => {
          let found;
          if (reportType === "yearly") {
            found = agg.find(a => a._id === parseInt(label));
          } else {
            found = agg.find(a => a._id === i + 1);
          }
          return { name: label, total: found ? found.total : 0 };
        });
      } else {
        // category/subcategory mapping
        const lookupCollection = category ? "categories" : "subcategories";
        const lookupField = category ? "category" : "subcategory";

        agg = await Expense.aggregate([
          { $match: aggQuery },
          { $group: { _id: groupId, total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: lookupCollection,
              localField: "_id",
              foreignField: "_id",
              as: lookupField,
            },
          },
          { $unwind: `$${lookupField}` },
          { $project: { _id: 0, name: `$${lookupField}.name`, total: 1 } },
        ]);

        reportData = agg;
      }

      // --- Top 5 expenses ---
      const topExpenses = await Expense.find(query)
        .populate("category_id")
        .populate("subcat_id")
        .sort({ amount: -1 })
        .limit(5);

      return res.json({ report: reportData, data: topExpenses });
    }

    // --- NORMAL LIST (no reportType/category/subcategory) ---
    const [total, totalAmountResult, expenses] = await Promise.all([
      Expense.countDocuments(query),
      Expense.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
      Expense.find(query)
        .populate("category_id")
        .populate("subcat_id")
        .skip(skip)
        .limit(pageSize),
    ]);

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

    return res.json({
      data: expenses,
      totalAmount,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
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