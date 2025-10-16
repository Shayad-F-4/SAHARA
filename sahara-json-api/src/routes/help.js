import { Router } from 'express';
import { listHelp, createHelp } from '../controllers/helpController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', listHelp);
router.post('/', auth, createHelp);

export default router;
