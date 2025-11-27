import { Router } from 'express';
import multer from 'multer';
import { steganographyController } from '../controllers';
import config from '../config';
import { SUPPORTED_MIME_TYPES } from '../types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize
  },
  fileFilter: (_req, file, cb) => {
    if (SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`));
    }
  }
});

// Routes
router.post('/encode', upload.single('image'), (req, res) => 
  steganographyController.encode(req, res)
);

router.post('/decode', upload.single('image'), (req, res) => 
  steganographyController.decode(req, res)
);

router.post('/capacity', upload.single('image'), (req, res) => 
  steganographyController.capacity(req, res)
);

router.get('/supported-formats', (req, res) => 
  steganographyController.supportedFormats(req, res)
);

router.get('/health', (req, res) => 
  steganographyController.health(req, res)
);

export default router;
