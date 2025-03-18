import initApp from "./server";
import { initializeDirectories } from './utils/init';
import express from 'express';
import path from 'path';
import fs from 'fs';

const port = process.env.PORT;

// Initialize required directories
initializeDirectories();

// Go back to passing app to initApp if that's what server.ts expects
initApp().then((app) => {  // Catch the app returned from initApp
  // We don't need to serve static files from Express since Nginx will handle it directly
  // But we'll keep the directory creation logic
  const uploadsDir = path.join(__dirname, '../../Backend/uploads');
  const usersUploadsDir = path.join(uploadsDir, 'users');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(usersUploadsDir)) {
    fs.mkdirSync(usersUploadsDir, { recursive: true });
  }
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch((err) => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});