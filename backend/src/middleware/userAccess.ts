import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

// only admnin  , project leaders , sprint leaders can see the users 

export const usersAccess: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = userFromToken(req);

    if (!user) {
      res.status(401).json({ message: "Unauthorized: Invalid token" });
      return;
    }

    if (user.is_admin) {
      next();
      return;
    }

    const userId = String(user.id);

    const isProjectLead = await prisma.project_developpers.findFirst({
      where: { userId, is_lead: true },
    });

    if (isProjectLead) {
      next();
      return;
    }

    const isSprintLead = await prisma.sprint_developpers.findFirst({
      where: { userId, is_lead: true },
    });

    if (isSprintLead) {
      next();
      return;
    }

    res.status(403).json({
      message:
        "Forbidden: Only admin, project leader, or sprint leader can view users",
    });
  } catch (error) {
    console.error("usersAccess middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
