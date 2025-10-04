// import express from 'express';
// import { createProject, getAllProjects,  updateProject, deleteProject,updateProjectDevelopers, updateProjectRisks } from '../controllers/projectController';
// import { adminMiddleware } from '../middleware/adminMiddleware';
// import { authMiddleware } from '../middleware/authMiddleware';

// const router = express.Router();

// // Create a new project
// router.post('', adminMiddleware,createProject);

// // Get all projects
// router.get('',authMiddleware, getAllProjects);

// // Update project by ID
// router.put('/:id',adminMiddleware, updateProject);

// // Delete project by ID
// router.delete('/:id', adminMiddleware,deleteProject);

// router.put('/:projectId/developers', adminMiddleware,updateProjectDevelopers);

// router.put('/:projectId/risques', adminMiddleware,updateProjectRisks);

// export default router;

// import express from 'express';
// import {
//   createProject,
//   getAllProjects,
//   updateProject,
//   deleteProject,
//   updateProjectDevelopers,
//   updateProjectRisks
// } from '../controllers/projectController';
// import { adminMiddleware } from '../middleware/adminMiddleware';
// import { authMiddleware } from '../middleware/authMiddleware';

// const router = express.Router();

// router.post('/create', authMiddleware, adminMiddleware, createProject); // done

// router.get('/all', authMiddleware, adminMiddleware, getAllProjects); // done

// router.put('/update/:id', authMiddleware, adminMiddleware, updateProject); // done + pm ?

// router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteProject); // done

// router.put('/update/:id/developers', authMiddleware, adminMiddleware, updateProjectDevelopers); // done + pm ?

// router.put('/update/:id/risks', authMiddleware, adminMiddleware, updateProjectRisks); // not yet pm + admin

// export default router;

import express from "express";
import {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
  addProjectDevelopers,
  getProjectSprints,
  getInfrastructuresByProject,
} from "../controllers/projectController";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
// import { projectLeaderOrAdmin } from "../middleware/test1";
import { leaderOrAdmin } from "../middleware/leaderOrAdminMiddlware";

const router = express.Router();

// create project
router.post("", adminMiddleware, createProject); // done

// get all project exsiting 
router.get("", authMiddleware, getAllProjects); // done

// update project
router.put("/:id", leaderOrAdmin("project"), updateProject); // done + pm

//delete project
router.delete("/:id", adminMiddleware, deleteProject); // done

// add developers to projects
router.put("/:id/developers", leaderOrAdmin("project"), addProjectDevelopers); // done + pm

router.get("/:id/sprints", leaderOrAdmin("project"), getProjectSprints); // done

// Get infrastructures of a specific project
router.get(
  "/infrastructure/:id",
  leaderOrAdmin("project"),
  getInfrastructuresByProject
); // done

// i already impliment the ones that add and delete risk of project in (projectrisques)
// router.put("/:id/risks", authMiddleware, adminMiddleware, updateProjectRisks);

export default router;
