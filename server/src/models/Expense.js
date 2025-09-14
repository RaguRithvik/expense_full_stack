import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  subcat_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String }
});

export default mongoose.model("Expense", expenseSchema);
