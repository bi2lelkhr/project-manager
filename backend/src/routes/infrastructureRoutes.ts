import express from "express";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { leaderOrAdmin } from "../middleware/leaderOrAdminMiddlware";
import { infrastructureLeaderOrAdmin } from "../middleware/infrastructureLeaderOrAdmin";
import {
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
  getAllInfrastructures,
  getInfrastructureById,
} from "../controllers/infrastructureController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// create infrastructure
router.post("/:id", leaderOrAdmin("noeud"), createInfrastructure); // done

// update infrastructure
router.put("/:id", infrastructureLeaderOrAdmin, updateInfrastructure); // fone

// delete infrastructure
router.delete("/:id", infrastructureLeaderOrAdmin, deleteInfrastructure); // change

// get all infrastructures of all projects
router.get("/", authMiddleware, getAllInfrastructures); // done

// Get infrastructure by id
router.get("/:id", infrastructureLeaderOrAdmin, getInfrastructureById); // done

export default router;
