import { Router } from 'express';
import { register, login, getSettings, updateSettings } from '../controllers/usersController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/settings', auth, getSettings);
router.put('/settings', auth, updateSettings);

export default router;
