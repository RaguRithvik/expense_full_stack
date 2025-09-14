import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
});

export default mongoose.model("Budget", budgetSchema);
