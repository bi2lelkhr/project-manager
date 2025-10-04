import express from "express";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { leaderOrAdmin } from "../middleware/leaderOrAdminMiddlware";
import { projectRisquesLeaderOrAdmin } from "../middleware/projectRisquesMiddlware";
import {
  getAllProjectsRisques,
  getProjectRisques,
  assignRisquesToProject,
  
  deleteProjectRisques,
} from "../controllers/projectsRisqueController";

const router = express.Router();

// get all risks of all projects
router.get("/", adminMiddleware , getAllProjectsRisques); //done

// get risks of a specifc project
router.get("/:id", leaderOrAdmin("project"), getProjectRisques); // done

// add risks to project
router.post("/", leaderOrAdmin("project"), assignRisquesToProject); //done

// delete risks from project
router.delete("/",projectRisquesLeaderOrAdmin, deleteProjectRisques); // done

export default router;
