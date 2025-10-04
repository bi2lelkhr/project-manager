import { Request, Response, NextFunction } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

export const infrastructureLeaderOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = userFromToken(req);
    if (!user) {
      res.status(401).json({ message: "Unauthorized: Invalid token" });
      return;
    }

    const infraId = req.params.id;
    if (!infraId) {
      res.status(400).json({ message: "Infrastructure ID is required" });
      return;
    }

    const infra = await prisma.infrastructure.findUnique({
      where: { id: infraId },
      include: { noeud: true },
    });

    if (!infra) {
      res.status(404).json({ message: "Infrastructure not found" });
      return;
    }

    const projectId = infra.noeud.projectId;

    if (user.is_admin) {
      next();
      return;
    }

    const lead = await prisma.project_developpers.findFirst({
      where: {
        projectId,
        userId: String(user.id),
        is_lead: true,
      },
    });

    if (!lead) {
      res
        .status(403)
        .json({ message: "Forbidden: Not project leader or admin" });
      return;
    }

    next();
  } catch (error) {
    console.error("infraLeaderOrAdmin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
