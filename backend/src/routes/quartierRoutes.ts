// import express from 'express';
// import { adminMiddleware } from '../middleware/adminMiddleware';
// import { createQuartier, deleteQuartier, getAllQuartiers, updateQuartier } from '../controllers/quartierController';
// import { authMiddleware } from '../middleware/authMiddleware';

// const router = express.Router();

// // Create a new Quartier
// router.post('',adminMiddleware, createQuartier);

// // Get all Quartiers
// router.get('',authMiddleware, getAllQuartiers);


// // Update Quartier by ID
// router.put('/:id', adminMiddleware,updateQuartier);

// // Delete Quartier by ID
// router.delete('/:id', adminMiddleware,deleteQuartier);

// export default router;



import express from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { createQuartier, deleteQuartier, getAllQuartiers, updateQuartier } from '../controllers/quartierController';
import { authMiddleware } from '../middleware/authMiddleware';
import { auth } from 'firebase-admin';
import { adminOrProjectLeadViewMiddleware } from "../middleware/pmAndAdminAccessView";

const router = express.Router();


router.post('/' ,authMiddleware, adminMiddleware, createQuartier); // done


router.get('/',adminOrProjectLeadViewMiddleware, getAllQuartiers); //done


router.put('/:id',authMiddleware,  adminMiddleware, updateQuartier); // done


router.delete('/:id', authMiddleware,adminMiddleware, deleteQuartier); // done

export default router;
