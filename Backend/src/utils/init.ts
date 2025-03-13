import fs from 'fs';
import path from 'path';

export const initializeDirectories = () => {
  const uploadDir = path.join(__dirname, '../../uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Create .gitkeep if it doesn't exist
  const gitkeepPath = path.join(uploadDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }
}; 