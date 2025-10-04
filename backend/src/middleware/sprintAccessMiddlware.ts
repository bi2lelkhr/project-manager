import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

type SprintPermission = "view" | "update";

export const sprintAccess =
  (permission: SprintPermission): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = userFromToken(req);

      if (!user) {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
        return;
      }

      const sprintId = req.params.id;
      if (!sprintId) {
        res.status(400).json({ message: "Sprint ID is required" });
        return;
      }

      const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { project: true },
      });

      if (!sprint) {
        res.status(404).json({ message: "Sprint not found" });
        return;
      }

      if (user.is_admin) {
        next();
        return;
      }

      const userId = String(user.id);

      const isProjectLead = await prisma.project_developpers.findFirst({
        where: {
          projectId: sprint.projectId!,
          userId,
          is_lead: true,
        },
      });

      if (isProjectLead) {
        next();
        return;
      }

      const sprintDev = await prisma.sprint_developpers.findFirst({
        where: { sprintId, userId },
      });

      if (permission === "update") {
        if (sprintDev?.is_lead) {
          next();
          return;
        }
        res.status(403).json({
          message:
            "Forbidden: Only admin, project leader, or sprint leader can update sprint",
        });
        return;
      }

      if (permission === "view") {
        if (sprintDev) {
          next();
          return;
        }
        res.status(403).json({
          message:
            "Forbidden: Only admin, project leader, sprint leader, or sprint developer can view sprint",
        });
        return;
      }
    } catch (error) {
      console.error("Middleware error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
