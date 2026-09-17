import { Router } from 'express';
import { catalogRouter } from './catalog';
import { userRouter } from './user';

const router = Router();

router.get('/health', (_req, res) => res.send({ status: 'ok' }));
router.use('/catalog', catalogRouter);
router.use('/user', userRouter);

export { router as apiRouter };
