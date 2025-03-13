import initApp from "./server";
import { initializeDirectories } from './utils/init';

const port = process.env.PORT;

// Initialize required directories
initializeDirectories();

initApp().then((app) => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`File uploads will be stored in: ${process.env.UPLOAD_PATH}`);
  });
}).catch((err) => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});