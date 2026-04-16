import { Router } from "express";
import Joi from "joi";
import validate from "../../common/Middlewares/validate.middleware.js";
import authMiddleware from "../../common/Middlewares/auth.middleware.js";
import * as accountService from "./account.service.js";

const router = Router();



const amountSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().optional(),
});

const transferSchema = Joi.object({
  amount: Joi.number().positive().required(),
  toAccountNumber: Joi.string().required(),
  description: Joi.string().optional(),
});


router.get("/me", accountService.getMyAccount);

router.get("/me/summary", accountService.getSummary);

router.get("/me/statement", accountService.getStatement);

router.post("/me/deposit", validate(amountSchema), accountService.deposit);

router.post("/me/withdraw", validate(amountSchema), accountService.withdraw);

router.post("/me/transfer", validate(transferSchema), accountService.transfer);

export default router;
