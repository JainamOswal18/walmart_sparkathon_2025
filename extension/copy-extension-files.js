// copy-extension-files.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define source and destination directories
const sourceDir = path.join(__dirname, "public");
const destDir = path.join(__dirname, "dist");

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// List of files to copy
const filesToCopy = [
  "manifest.json",
  "background.js",
  "content.js",
  "icon16.png",
  "icon48.png",
  "icon128.png",
];

// Copy files from sourceDir to destDir
for (const file of filesToCopy) {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied: ${file}`);
  } else {
    console.warn(`⚠️  Skipped (not found): ${file}`);
  }
}
