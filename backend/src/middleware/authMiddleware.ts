import { userFromToken } from "../utils/token";
import { Request, Response } from 'express';
import { NextFunction } from "express";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = userFromToken(req);

  if (user == null) {
    res.status(403).json({
      message: "UnAuthorized , no user",
    });
    return;
  }

  next();
};