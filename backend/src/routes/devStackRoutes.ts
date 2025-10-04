import express from "express";
import {
  assginDevToStack,
  createDevStack,
  deleteDevStack,
  getAllDevStacks,
  getDevStack,
  updateDevStack,
  removeDevFromStack,
} from "../controllers/devStackController";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminOrProjectLeadViewMiddleware } from "../middleware/pmAndAdminAccessView";

const router = express.Router();

// Create a new devstack
router.post("", authMiddleware, adminMiddleware, createDevStack); // done

// asign dev stack to user
router.post("/assign_stack", authMiddleware, assginDevToStack); // done

// get devstack of a user
router.get("/developper/:id", authMiddleware, getDevStack); // done

// Get all devstacks
router.get("", adminOrProjectLeadViewMiddleware, getAllDevStacks); // done

// Update devstack by ID
router.put("/:id", adminMiddleware, updateDevStack); // done

// Delete devstack by ID
router.delete("/stack/:id", adminMiddleware, deleteDevStack);
router.delete("/remove_stack", authMiddleware, removeDevFromStack);


export default router;
