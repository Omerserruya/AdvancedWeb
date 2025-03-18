import multer from 'multer';
import path from 'path';

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Create a unique filename
  }
});

// Create the multer instance
const upload = multer({ storage });

export default upload; 