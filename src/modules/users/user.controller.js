import { Router } from "express";
import Joi from "joi";
import validate from "../../common/Middlewares/validate.middleware.js";
import authMiddleware from "../../common/Middlewares/auth.middleware.js";
import * as userService from "./user.service.js";

const router = Router();

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});


router.post("/register", validate(registerSchema), userService.register);

router.post("/login", validate(loginSchema), userService.login);

router.get("/me", authMiddleware, userService.getProfile);

export default router;
