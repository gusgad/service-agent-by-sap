import express from 'express';
import { createJob, getJobs, getJobById } from './controllers/jobController';

const router = express.Router();

router.post('/jobs', createJob as any);
router.get('/jobs', getJobs as any);
router.get('/jobs/:id', getJobById as any);

export default router;