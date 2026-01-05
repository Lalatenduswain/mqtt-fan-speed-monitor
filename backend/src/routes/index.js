import { Router } from 'express';
import authRouter from './auth.js';
import roomsRouter from './rooms.js';
import devicesRouter from './devices.js';
import schedulesRouter from './schedules.js';
import scenesRouter from './scenes.js';
import powerRouter from './power.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Auth routes (public)
router.use('/auth', authRouter);

// Protected routes - require authentication
router.use('/rooms', requireAuth, roomsRouter);
router.use('/devices', requireAuth, devicesRouter);
router.use('/schedules', requireAuth, schedulesRouter);
router.use('/scenes', requireAuth, scenesRouter);
router.use('/power', requireAuth, powerRouter);

export default router;
