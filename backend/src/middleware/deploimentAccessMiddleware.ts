import { Request, Response, NextFunction } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

export const deploimentAccess = async (
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

    const deploimentId = req.params.id;
    if (!deploimentId) {
      res.status(400).json({ message: "Deploiment ID is required" });
      return;
    }

  
    const deploiment = await prisma.deploiment.findUnique({
      where: { id: deploimentId },
      include: { project: true },
    });

    if (!deploiment) {
      res.status(404).json({ message: "Deploiment not found" });
      return;
    }


    if (user.is_admin) {
      next();
      return;
    }

    const userId = String(user.id);

  
    const isProjectLead = await prisma.project_developpers.findFirst({
      where: {
        projectId: deploiment.projectId,
        userId,
        is_lead: true,
      },
    });

    if (isProjectLead) {
      next();
      return;
    }

  
    res.status(403).json({
      message: "Forbidden: Only admin or project leader can update deployment",
    });
  } catch (error) {
    console.error("Middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
