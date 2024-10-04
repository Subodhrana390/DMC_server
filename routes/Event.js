import express from 'express';
import controller from '../controllers/eventController.js';
import { upload } from '../middlewares/Cloudinary.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

// Routes
router.post('/', upload.fields([{ name: 'flyer', maxCount: 1 }, { name: 'photos', maxCount: 12 }]),verifyToken, controller.createEvent);
router.get('/', controller.getEvents);
router.get('/:id',controller.getEventById);
router.put('/:id',verifyToken, upload.fields([{ name: 'flyer', maxCount: 1 }, { name: 'photos', maxCount: 12 }]),controller.updateEvent);
router.delete('/:id',verifyToken, controller.deleteEvent);

export default router;
