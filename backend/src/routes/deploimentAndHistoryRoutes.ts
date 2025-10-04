import express from "express";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  bulkInsertDeployHistory,
  createDeploiment,
  deleteDeploiment,
  getAllDeploiments,
  getDeploimentsHistory,
  updateDeploiment,
  deleteDeployHistory
} from "../controllers/deploimentAndHistoryController";
import { leaderOrAdmin } from "../middleware/leaderOrAdminMiddlware";
import { deploimentAccess } from "../middleware/deploimentAccessMiddleware";
import { deployHistoryLeaderOrAdmin } from "../middleware/deployHistoryAccessMiddleware";

const router = express.Router();

// Create a new deployment
router.post("/", leaderOrAdmin("project"), createDeploiment); // done

// Get all deployments
router.get("", authMiddleware, getAllDeploiments); // done

// deployment history of a specific project
router.get("/:id", deploimentAccess, getDeploimentsHistory); 

// Update deployment by ID (i made the update partial)
router.put("/:id", deploimentAccess, updateDeploiment); // done

// Delete deployment by ID
router.delete("/:id", deploimentAccess, deleteDeploiment); // done

// i modified the original bulkInsertDeployHistory
router.post(
  "/deploy-history/:id/bulk",
  deploimentAccess,
  bulkInsertDeployHistory
); // done

// delete deploiment history 
router.delete("/deploy-history/:ids", deployHistoryLeaderOrAdmin, deleteDeployHistory);// done


export default router;
