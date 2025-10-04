import { Request, Response, NextFunction } from "express";
import { userFromToken } from "../utils/token";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const adminOrProjectLeadViewMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = userFromToken(req);

    if (!user) {
      res.status(403).json({ message: "Unauthorized: no user" });
      return;
    }

    if (user.is_admin) {
      return next();
    }

    const isLeader = await prisma.project_developpers.findFirst({
      where: {
        userId: String(user.id),
        is_lead: true,
      },
    });

    if (!isLeader) {
      res
        .status(403)
        .json({ message: "Forbidden: only admins or project leaders allowed" });
      return;
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
