import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

type TaskPermission = "update" | "updateStatus";

export const taskAccess = (permission: TaskPermission): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = userFromToken(req);
      if (!user) {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
        return;
      }

      const taskId = req.params.taskId;
      if (!taskId) {
        res.status(400).json({ message: "Task ID is required" });
        return;
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { sprint: { include: { project: true } } },
      });

      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      const userId = String(user.id);

      if (user.is_admin) {
        next();
        return;
      }

      const sprintId = task.sprintId;
      const projectId = task.sprint?.projectId;

      if (!sprintId || !projectId) {
        res
          .status(400)
          .json({ message: "Task has no sprint or project assigned" });
        return;
      }

      const isProjectLead = await prisma.project_developpers.findFirst({
        where: { projectId, userId, is_lead: true },
      });

      const isSprintLead = await prisma.sprint_developpers.findFirst({
        where: { sprintId, userId, is_lead: true },
      });

      if (permission === "update") {
        if (isProjectLead || isSprintLead) {
          next();
          return;
        }
        res.status(403).json({
          message:
            "Forbidden: Only admin, project leader, or sprint leader can update task",
        });
        return;
      }

      if (permission === "updateStatus") {
        const isTaskDeveloper = task.developerId === userId;

        if (isProjectLead || isSprintLead || isTaskDeveloper) {
          next();
          return;
        }

        res.status(403).json({
          message:
            "Forbidden: Only admin, project leader, sprint leader, or assigned developer can update task status",
        });
        return;
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  };
};
