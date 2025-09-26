import Income from "../models/Income.js";

export const getAllIncomes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { filter, reportType } = req.query;

    const skip = (page - 1) * pageSize;
    let query = {};
    const now = new Date();

    // --- Time-based filter for listing ---
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

    // --- Report logic ---
    if (reportType) {
      let reportData = [];
      let groupId = null;
      let labels = [];
      const currentYear = now.getFullYear();

      switch (reportType) {
        case "daily":
          groupId = { $dayOfWeek: "$date" };
          labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          break;
        case "weekly":
          const startOfMonth = new Date(currentYear, now.getMonth(), 1);
          const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0);
          query.date = { $gte: startOfMonth, $lte: endOfMonth };
          groupId = { $week: "$date" };
          labels = Array.from({ length: Math.ceil(endOfMonth.getDate() / 7) }, (_, i) => `Week ${i + 1}`);
          break;
        case "monthly":
          groupId = { $month: "$date" };
          labels = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          query.date = { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) };
          break;
        case "yearly":
          groupId = { $year: "$date" };
          labels = Array.from({ length: 4 }, (_, i) => (currentYear - (3 - i)).toString());
          break;
      }

      const agg = await Income.aggregate([
        { $match: query },
        { $group: { _id: groupId, total: { $sum: "$amount" } } },
      ]);

      if (reportType === "yearly") {
        reportData = labels.map(label => {
          const found = agg.find(a => a._id === parseInt(label));
          return { name: label, total: found ? found.total : 0 };
        });
      } else {
        reportData = labels.map((label, i) => {
          const found = agg.find(a => a._id === i + 1);
          return { name: label, total: found ? found.total : 0 };
        });
      }

      const topIncomes = await Income.find(query)
        .sort({ amount: -1 })
        .limit(5);

      return res.json({ report: reportData, data: topIncomes });
    }

    // --- Paginated list ---
    const [total, totalAmountResult, incomes] = await Promise.all([
      Income.countDocuments(query),
      Income.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
      Income.find(query).skip(skip).limit(pageSize),
    ]);

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

    return res.json({
      data: incomes,
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