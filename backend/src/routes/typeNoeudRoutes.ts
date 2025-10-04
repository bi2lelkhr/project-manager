import express from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { createTypeNoeud,updateTypeNoeud,getAllTypeNoeuds,deleteTypeNoeud } from '../controllers/typeNoeudController';
import { adminOrProjectLeadViewMiddleware } from "../middleware/pmAndAdminAccessView";
const router = express.Router();


router.post('', adminMiddleware,createTypeNoeud); // done
router.get('', adminOrProjectLeadViewMiddleware,getAllTypeNoeuds); // done
router.put('/:id', adminMiddleware,updateTypeNoeud); // checks
router.delete('/:id', adminMiddleware,deleteTypeNoeud); // done

export default router;
