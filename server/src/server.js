import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";
import apiRoutes from "./routes/index.js";

dotenv.config();
connectDB();

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Root test
app.get("/", (req, res) => {
  res.send("🚀 Expense Manager API Running");
});

// Mount API routes
app.use("/api", apiRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
