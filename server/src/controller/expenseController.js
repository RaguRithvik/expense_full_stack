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

    // --- Time-based filter for pagination/listing ---
    if (filter) {
      if (filter === "today") {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        query.date = { $gte: startOfDay };
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

    // --- REPORT TYPE LOGIC ---
    if (reportType || category || subcategory) {
      let reportData = [];

      // --- Report based on daily/weekly/monthly/yearly ---
      if (reportType) {
        const currentYear = now.getFullYear();

        switch (reportType) {
          case "daily": {
            const agg = await Expense.aggregate([
              { $match: query },
              { $group: { _id: { $dayOfWeek: "$date" }, total: { $sum: "$amount" } } },
            ]);
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            reportData = days.map((d, i) => {
              const found = agg.find(a => a._id === i + 1);
              return { name: d, total: found ? found.total : 0 };
            });
            break;
          }

          case "weekly": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const agg = await Expense.aggregate([
              { $match: { ...query, date: { $gte: startOfMonth, $lte: endOfMonth } } },
              { $group: { _id: { $week: "$date" }, total: { $sum: "$amount" } } },
            ]);

            const weeksInMonth = Math.ceil(endOfMonth.getDate() / 7);
            reportData = Array.from({ length: weeksInMonth }, (_, i) => {
              const weekNum = i + 1;
              const found = agg.find(a => a._id === weekNum);
              return { name: `Week ${weekNum}`, total: found ? found.total : 0 };
            });
            break;
          }

          case "monthly": {
            const agg = await Expense.aggregate([
              { $match: { ...query, date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) } } },
              { $group: { _id: { $month: "$date" }, total: { $sum: "$amount" } } },
            ]);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            reportData = months.map((m, i) => {
              const found = agg.find(a => a._id === i + 1);
              return { name: m, total: found ? found.total : 0 };
            });
            break;
          }

          case "yearly": {
            const startYear = currentYear - 3;
            const endYear = currentYear;
            const agg = await Expense.aggregate([
              { $match: { ...query, date: { $gte: new Date(startYear, 0, 1), $lt: new Date(endYear + 1, 0, 1) } } },
              { $group: { _id: { $year: "$date" }, total: { $sum: "$amount" } } },
            ]);
            reportData = Array.from({ length: 4 }, (_, i) => {
              const year = startYear + i;
              const found = agg.find(a => a._id === year);
              return { name: year.toString(), total: found ? found.total : 0 };
            });
            break;
          }
        }
      }

      // --- Category / Subcategory report ---
      if (category || subcategory) {
        const groupField = category ? "$category_id" : "$subcat_id";
        const lookupCollection = category ? "categories" : "subcategories";
        const lookupField = category ? "category" : "subcategory";

        reportData = await Expense.aggregate([
          { $match: query },
          { $group: { _id: groupField, total: { $sum: "$amount" } } },
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
      }

      // --- Top 5 expenses based on same filter ---
      const topExpenses = await Expense.find(query)
        .populate("category_id")
        .populate("subcat_id")
        .sort({ amount: -1 })
        .limit(5);

      return res.json({ report: reportData, data: topExpenses });
    }

    // --- Normal paginated list ---
    const [total, totalAmountResult, expenses] = await Promise.all([
      Expense.countDocuments(query),
      Expense.aggregate([{ $match: query }, { $group: { _id: null, totalAmount: { $sum: "$amount" } } }]),
      Expense.find(query).populate("category_id").populate("subcat_id").skip(skip).limit(pageSize),
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