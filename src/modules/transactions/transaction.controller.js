import { Router } from "express";
import authMiddleware from "../../common/Middlewares/auth.middleware.js";
import * as transactionService from "./transaction.service.js";

const router = Router();

router.use(authMiddleware);

router.get("/", transactionService.getMyTransactions);

router.get("/:id", transactionService.getTransaction);

export default router;
