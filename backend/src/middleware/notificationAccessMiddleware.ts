import { Request, Response, NextFunction } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

export const notificationAccess = async (
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

    const userIdFromToken = String(user.id);

    if (req.params.id && req.path.includes("user")) {
      if (req.params.id !== userIdFromToken) {
        res
          .status(403)
          .json({
            message: "Forbidden: You can only access your own notifications",
          });
        return;
      }
      next();
      return;
    }

    if (req.params.id) {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
      });

      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }

      if (notification.userId !== userIdFromToken) {
        res
          .status(403)
          .json({ message: "Forbidden: This notification is not yours" });
        return;
      }

      next();
      return;
    }

    res.status(400).json({ message: "Invalid request" });
  } catch (error) {
    console.error("Middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
