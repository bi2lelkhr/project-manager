import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

type EntityType = "project" | "noeud";

export const leaderOrAdmin =
  (entity: EntityType): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = userFromToken(req);
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      let projectId: string | undefined;

      if (entity === "project") {
        projectId = req.params.id;

        if (!projectId) {
          projectId = req.body.projectId;
        }

        if (!projectId) {
          res.status(400).json({ message: "Project ID is required" });
          return;
        }
      } else if (entity === "noeud") {
        const noeudId = req.params.id || req.body.noeudId;
        if (!noeudId) {
          res.status(400).json({ message: "Noeud ID is required" });
          return;
        }

        const noeud = await prisma.noeud.findUnique({ where: { id: noeudId } });
        if (!noeud) {
          res.status(404).json({ message: "Noeud not found" });
          return;
        }

        projectId = noeud.projectId;
      }

      if (user.is_admin) {
        next();
        return;
      }

      const lead = await prisma.project_developpers.findFirst({
        where: { projectId, userId: String(user.id), is_lead: true },
      });

      if (!lead) {
        res
          .status(403)
          .json({ message: "Forbidden: Not project leader or admin" });
        return;
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
