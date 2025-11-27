import { Router } from 'express';
import { captureController } from '../controllers';

const router = Router();

// Routes
router.get('/capture', (req, res) => 
  captureController.capture(req, res)
);

router.get('/logs', (req, res) => 
  captureController.getLogs(req, res)
);

router.get('/logs/:id', (req, res) => 
  captureController.getLog(req, res)
);

router.delete('/logs/:id', (req, res) => 
  captureController.deleteLog(req, res)
);

router.get('/stats', (req, res) => 
  captureController.getStats(req, res)
);

router.get('/health', (req, res) => 
  captureController.health(req, res)
);

export default router;
