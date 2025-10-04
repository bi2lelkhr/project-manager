import express from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { createRisque, getAllRisques, updateRisque, deleteRisque } from '../controllers/risqueController';
import { adminOrProjectLeadViewMiddleware } from "../middleware/pmAndAdminAccessView";
const router = express.Router();


router.post('', adminMiddleware,createRisque); // done
router.get('', adminOrProjectLeadViewMiddleware,getAllRisques); //done
router.put('/:id', adminMiddleware,updateRisque); //done
router.delete('/:id', adminMiddleware,deleteRisque); // done

export default router;
