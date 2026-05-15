import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  downloadReportPDF,
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.get('/:id/pdf', downloadReportPDF);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
