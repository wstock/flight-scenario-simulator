/**
 * Script to update all API routes with the new logger utility
 * 
 * This script will:
 * 1. Find all API route files
 * 2. Add the import for the createApiLogger
 * 3. Replace console.log/error calls with logger calls
 * 4. Remove "API route:" prefixes from log messages
 * 
 * Usage:
 * node scripts/update-api-logging.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify fs functions
const readdir = fs.promises.readdir;
const readFile = fs.promises.readFile;
const writeFile = fs.promises.writeFile;
const stat = fs.promises.stat;

// API routes directory
const API_ROUTES_DIR = path.join(__dirname, '..', 'src', 'app', 'api');

// Find all API route files recursively
async function findApiRouteFiles(dir) {
  const files = await readdir(dir);
  const routeFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      const nestedRouteFiles = await findApiRouteFiles(filePath);
      routeFiles.push(...nestedRouteFiles);
    } else if (file === 'route.ts' || file === 'route.js') {
      routeFiles.push(filePath);
    }
  }

  return routeFiles;
}

// Update a single API route file
async function updateApiRouteFile(filePath) {
  console.log(`Updating ${filePath}...`);
  
  // Read the file content
  let content = await readFile(filePath, 'utf8');
  
  // Check if the file already has the logger import
  if (content.includes('createApiLogger')) {
    console.log(`  Already updated, skipping...`);
    return;
  }
  
  // Extract the route name from the file path
  const routeName = path.basename(path.dirname(filePath));
  const routeNamePascalCase = routeName.charAt(0).toUpperCase() + routeName.slice(1) + 'Route';
  
  // Add the import for the createApiLogger
  if (content.includes('import { NextRequest, NextResponse }')) {
    content = content.replace(
      'import { NextRequest, NextResponse }',
      'import { NextRequest, NextResponse }\nimport { createApiLogger } from \'@/lib/utils/logger\';'
    );
  } else if (content.includes('import { NextResponse }')) {
    content = content.replace(
      'import { NextResponse }',
      'import { NextResponse }\nimport { createApiLogger } from \'@/lib/utils/logger\';'
    );
  } else {
    content = `import { createApiLogger } from '@/lib/utils/logger';\n${content}`;
  }
  
  // Add the logger instance
  content = content.replace(
    /import.*?;(\s*)/s,
    (match, whitespace) => `${match}${whitespace}const logger = createApiLogger('${routeNamePascalCase}');\n`
  );
  
  // Replace console.log calls with logger.info
  content = content.replace(
    /console\.log\(`API route: (.*?)`(.*?)\)/g,
    (_, message, args) => `logger.info(\`${message}\`${args})`
  );
  
  // Replace console.error calls with logger.error
  content = content.replace(
    /console\.error\('API route: (.*?)'(.*?)\)/g,
    (_, message, args) => `logger.error('${message}'${args})`
  );
  
  // Write the updated content back to the file
  await writeFile(filePath, content, 'utf8');
  console.log(`  Updated successfully!`);
}

// Main function
async function main() {
  try {
    // Find all API route files
    const routeFiles = await findApiRouteFiles(API_ROUTES_DIR);
    console.log(`Found ${routeFiles.length} API route files.`);
    
    // Update each file
    for (const filePath of routeFiles) {
      await updateApiRouteFile(filePath);
    }
    
    console.log('All API route files updated successfully!');
  } catch (error) {
    console.error('Error updating API route files:', error);
    process.exit(1);
  }
}

// Run the script
main(); 