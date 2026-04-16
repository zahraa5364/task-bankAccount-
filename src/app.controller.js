import express from "express";
import connectionDB from "./DB/connectionDB.js";
import userController from "./modules/users/user.controller.js";
import accountController from "./modules/accounts/account.controller.js";
import transactionController from "./modules/transactions/transaction.controller.js";

export const bootstrap = async () => {
  const app = express();

  
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", userController);
  app.use("/api/accounts", accountController);
  app.use("/api/transactions", transactionController);

  app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, message: "Bank API is running 🏦" });
  });

  app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
  });

  app.use((err, req, res, next) => {
    console.error(" Error:", err.message);
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  });

  await connectionDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};