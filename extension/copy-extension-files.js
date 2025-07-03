import fs from 'fs';
import path from 'path';

// Define source and destination directories
const sourceDir = path.join(__dirname, 'public');
const destDir = path.join(__dirname, 'dist');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Function to copy files
function copyFiles() {
  // List of files to copy
  const files = [
    'manifest.json',
    'background.js',
    'content.js',
    'icon16.png',
    'icon48.png',
    'icon128.png'
  ];

  // Copy each file
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to dist directory`);
    } else {
      console.error(`File not found: ${sourcePath}`);
    }
  });
}

// Execute the copy function
copyFiles(); 