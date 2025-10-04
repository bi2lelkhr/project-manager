import { prisma } from "..";
import { Request, Response } from "express";

// get all notifications for a user
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};

// get number of unread notifications
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.status(200).json({ unreadCount: count });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error counting unread notifications", error });
  }
};

// mark a notification as read
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Notification ID is required" });
    return;
  }

  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res
      .status(200)
      .json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error marking notification as read", error });
  }
};

// mark all notifications as read for a user
export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error marking all notifications as read", error });
  }
};

// delete a notification
export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Notification ID is required" });
    return;
  }

  try {
    await prisma.notification.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification", error });
  }
};

// get all unread notifications for a user
export const getUnreadNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(notifications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching unread notifications", error });
  }
};

// delete all notifications for a user
export const deleteAllNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    await prisma.notification.deleteMany({
      where: { userId },
    });

    res
      .status(200)
      .json({ success: true, message: "All notifications deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting all notifications", error });
  }
};
