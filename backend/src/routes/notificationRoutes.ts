import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadNotifications , 
  deleteAllNotifications
} from "../controllers/notificationController";
import { notificationAccess } from "../middleware/notificationAccessMiddleware";

const router = express.Router();

// in the notificationAccessMiddleware you can undertand the logic to make the diff between the ids 

// get all notifications for user (id of user here )
router.get("/user/:id", notificationAccess, getNotifications); // done

// get number of unread notifications  (id of user here )
router.get("/user/:id/unread-count", notificationAccess, getUnreadCount); // done

// get all unread notifications for user
router.get("/user/:id/unread", notificationAccess, getUnreadNotifications);

// Mark a single notification as read (id of notification )
router.put("/:id/read",notificationAccess, markAsRead);  // done

// Mark all notifications as read
router.put("/user/:id/read-all", notificationAccess, markAllAsRead); // done

// Delete a notification 
router.delete("/:id",notificationAccess ,deleteNotification); //done

// Delete all notifications for a user
router.delete("/user/:id/all", notificationAccess, deleteAllNotifications); // done

export default router;
