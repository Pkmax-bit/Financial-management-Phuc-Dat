const fs = require('fs');
const path = require('path');

/**
 * Script to copy icon files to Next.js build output
 * Ensures icons are available in production build
 */

const sourceDir = path.join(__dirname, '..', 'public', 'icon');
const targetDir = path.join(__dirname, '..', '.next', 'static');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy icon directory to .next/static
// In Next.js production build, static files are served from /_next/static/
const targetIconDir = path.join(targetDir, 'icon');
if (!fs.existsSync(targetIconDir)) {
  fs.mkdirSync(targetIconDir, { recursive: true });
}

// Copy all icon files
if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetIconDir, file.toLowerCase()); // Ensure lowercase

    // Skip if it's a directory or README
    if (fs.statSync(sourcePath).isFile() && !file.includes('README')) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${file} to ${targetPath}`);
    }
  });
  console.log('Icon files copied successfully');
} else {
  console.warn('Source icon directory not found:', sourceDir);
}
