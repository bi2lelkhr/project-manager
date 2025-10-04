import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

export const deployHistoryLeaderOrAdmin: RequestHandler = async (
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

    let ids: string[] = [];

    if (req.params.ids) {
      ids = req.params.ids.split(",");
    } else if (req.body.id) {
      ids = [req.body.id];
    } else if (Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else {
      res.status(400).json({ message: "DeployHistory ID(s) are required" });
      return;
    }

    const histories = await prisma.deploy_history.findMany({
      where: { id: { in: ids } },
      include: {
        deploiment: { select: { projectId: true } },
      },
    });

    if (histories.length !== ids.length) {
      const foundIds = histories.map((h) => h.id);
      const missing = ids.filter((id) => !foundIds.includes(id));
      res.status(404).json({ message: `DeployHistory not found: ${missing.join(", ")}` });
      return;
    }

    if (user.is_admin) {
      next();
      return;
    }

    for (const history of histories) {
      const lead = await prisma.project_developpers.findFirst({
        where: {
          projectId: history.deploiment.projectId,
          userId: String(user.id),
          is_lead: true,
        },
      });

      if (!lead) {
        res.status(403).json({
          message: `Forbidden: Not project leader for DeployHistory ${history.id}`,
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error("Middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

