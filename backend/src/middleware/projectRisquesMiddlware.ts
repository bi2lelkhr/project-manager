import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

export const projectRisquesLeaderOrAdmin: RequestHandler = async (
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
    if (req.params.id) {
      ids = [req.params.id];
    } else if (Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else {
      res.status(400).json({ message: "ProjectRisque ID(s) are required" });
      return;
    }

  
    const links = await prisma.projects_risques.findMany({
      where: { id: { in: ids } },
    });

    
    if (links.length !== ids.length) {
      const foundIds = links.map((l) => l.id);
      const missing = ids.filter((id) => !foundIds.includes(id));
      res.status(404).json({ message: `ProjectRisque not found: ${missing.join(", ")}` });
      return;
    }

  
    if (user.is_admin) {
      next();
      return;
    }

    
    for (const link of links) {
      const lead = await prisma.project_developpers.findFirst({
        where: {
          projectId: link.projectId,
          userId: String(user.id),
          is_lead: true,
        },
      });

      if (!lead) {
        res.status(403).json({
          message: `Forbidden: Not project leader for ProjectRisque ${link.id}`,
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

