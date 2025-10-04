import express from "express";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createAndAttachTaskToSprint,
  createSprint,
  deleteSprint,
  deleteTask,
  getAllSprints,
  getSprintById,
  updateSprint,
  updateTask,
  getUserTasks,
  updateTaskStatus,
  addDeveloperToSprint,
  removeDeveloperFromSprint,
  updateSprintStatus,
  getSprintTasks
} from "../controllers/sprintController";
// import { projectLeaderOrAdmin } from "../middleware/test1";
import { leaderOrAdmin } from "../middleware/leaderOrAdminMiddlware";
import { sprintAccess } from "../middleware/sprintAccessMiddlware";
import { taskAccess } from "../middleware/taskPermissionMiddleware";

const router = express.Router();

// Create a new sprint
router.post("/:id", leaderOrAdmin("project"), createSprint); // done

// Get all sprints
router.get("", authMiddleware, getAllSprints); // done

// get sprint by id
router.get("/:id", sprintAccess("view"), getSprintById); // done

// Update sprint by ID
router.put("/:id", sprintAccess("update"), updateSprint); // done

// Delete sprint by ID
router.delete("/:id", sprintAccess("update"), deleteSprint); // done

router.put("/:id/status", sprintAccess("update"), updateSprintStatus); // done

// add developer to sprint
router.post("/:id/developers", sprintAccess("update"), addDeveloperToSprint); // done

// remove developer from sprint
router.delete(
  "/:id/developers/:userId",
  sprintAccess("update"),
  removeDeveloperFromSprint
); // done

// Attach Task to Sprint
router.post(
  "/tasks/attach-to-sprint/:id",
  sprintAccess("update"),
  createAndAttachTaskToSprint
); // done

router.put("/tasks/:taskId", taskAccess("update"), updateTask); // done

//update status of a task
router.put(
  "/tasks/status/:taskId",
  taskAccess("updateStatus"),
  authMiddleware,
  updateTaskStatus
); // done

// delete Task
router.delete("/tasks/:taskId", taskAccess("update"), deleteTask); // done

// get all tasks of a user
router.get("/tasks/user-tasks", authMiddleware, getUserTasks); // done

router.get("/:id/tasks", sprintAccess("view"), getSprintTasks); // done

export default router;
