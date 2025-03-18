import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create posts storage configuration
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get user ID from the request params (set by authentication middleware)
    const userId = req.params.userId;
    
    console.log('Multer middleware - userId:', userId);
    console.log('Multer middleware - req.params:', req.params);
    console.log('Multer middleware - req.body:', req.body);
    
    if (!userId) {
      return cb(new Error('User ID not found in request'), '');
    }
    
    // Create directory structure: /uploads/posts/{userId}
    const uploadDir = path.resolve('/app/uploads/posts');
    const userDir = path.join(uploadDir, userId);
    
    console.log('Multer middleware - uploadDir:', uploadDir);
    console.log('Multer middleware - userDir:', userDir);
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads/posts directory');
    }
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
      console.log('Created user directory:', userDir);
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random suffix
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `post-${uniqueSuffix}${ext}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// Configure upload with file size and type restrictions
const postUpload = multer({
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for post images
  fileFilter: (req, file, cb) => {
    // Accept only image files
    console.log('File filter - mimetype:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any);
    }
  }
});

export default postUpload; 