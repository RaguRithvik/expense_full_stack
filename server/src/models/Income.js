import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  source: { type: String, required: true },
  amount: { type: Number, required: true },
  image_url: { type: String, required: false },
  icon: { type: String, required: false },
  date: { type: Date, required: true },
  description: { type: String }
});

export default mongoose.model("Income", incomeSchema);
