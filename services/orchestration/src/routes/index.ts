import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { orchestrationController } from '../controllers';
import config from '../config';

const router = Router();

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindow * 1000,
  max: config.rateLimitMax,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Health and metrics (no rate limiting)
router.get('/health', (req, res) => 
  orchestrationController.health(req, res)
);

router.get('/metrics', (req, res) => 
  orchestrationController.metrics(req, res)
);

// Apply rate limiting to API routes
router.use('/api', apiLimiter);

// Steganography service proxy
router.all('/api/steganography/*', (req, res) => 
  orchestrationController.proxySteganography(req, res)
);

router.all('/api/steganography', (req, res) => 
  orchestrationController.proxySteganography(req, res)
);

// IP Capture service proxy
router.all('/api/ip-capture/*', (req, res) => 
  orchestrationController.proxyIpCapture(req, res)
);

router.all('/api/ip-capture', (req, res) => 
  orchestrationController.proxyIpCapture(req, res)
);

export default router;
