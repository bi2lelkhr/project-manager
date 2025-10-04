import { userFromToken } from "../utils/token";
import { Request, Response } from 'express';
import { NextFunction } from "express";

export const developperMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = userFromToken(req);
  if (user == null) {
    res.status(403).json({
      message: "UnAuthorized.",
    });
    return;
  }
  else if(user.is_developper) {
    next();
  } else {
    res.status(403).json({
      message: "UnAuthorized.",
    });
  }
};