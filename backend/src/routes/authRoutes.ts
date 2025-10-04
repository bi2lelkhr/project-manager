// import express from 'express';
// import { account, login, refreshToken, users } from '../controllers/authControllers';
// import { adminMiddleware } from '../middleware/adminMiddleware';
// import { developperMiddleware } from '../middleware/developperMiddlware';
// import { authMiddleware } from '../middleware/authMiddleware';

// const router = express.Router();

// router.post('/login', login);
// router.post('/refresh', refreshToken);

// router.get('/me',authMiddleware, account);
// router.get('/users',authMiddleware, users);

// export default router

import express from "express";
import {
  account,
  login,
  refreshToken,
  users,
  register,
  changePassword,
} from "../controllers/authControllers";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { usersAccess } from "../middleware/userAccess";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/change-password", authMiddleware, changePassword);
router.post("/refresh", refreshToken);
router.get("/me", authMiddleware, account);
router.get("/users", usersAccess, users);

export default router;
