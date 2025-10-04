import express from "express";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
// import { projectLeaderOrAdmin } from "../middleware/test1";
import {
  createNoeud,
  deleteNoeud,
  getAllNoeuds,
  updateNoeud,
  getNoeudsByProject,
  getInfrastructuresByNoeud,
} from "../controllers/noeudController";
import { leaderOrAdmin } from "../middleware/leaderOrAdminMiddlware";
const router = express.Router();

// Create a new Noeud  , here id i mean to be id of prpject
router.post("/:id", leaderOrAdmin("project"), createNoeud); // done

// Get all Noeuds
router.get("", authMiddleware, getAllNoeuds); // done

//get all NOeuds of a specific project  , here id of project
router.get("/:id", leaderOrAdmin("project"), getNoeudsByProject); // done

// Update Noeud by ID here id of noueds
router.put("/:id", leaderOrAdmin("noeud"), updateNoeud); // done

// Delete Noeud by ID
router.delete("/:id", leaderOrAdmin("noeud"), deleteNoeud); // done

// Get infrastructures of a specific noeud
router.get(
  "/infrastructure/:id",
  leaderOrAdmin("noeud"),
  getInfrastructuresByNoeud
); // done

export default router;
