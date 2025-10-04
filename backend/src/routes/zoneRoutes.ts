import express from 'express';
import { createZone, getAllZones,  updateZone, deleteZone } from './../controllers/zoneController';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Create a new Zone
router.post('',authMiddleware ,adminMiddleware,createZone); //  done

// Get all Zones
router.get('',authMiddleware,adminMiddleware ,getAllZones); // done

// Update Zone by ID
router.put('/:id' ,authMiddleware,adminMiddleware, updateZone); // done

// Delete Zone by ID
router.delete('/:id',authMiddleware ,  adminMiddleware,deleteZone); // done

export default router;
