/**
 * Script to fix the broken import statements in API route files
 * 
 * This script will:
 * 1. Find all API route files
 * 2. Fix the broken import statements
 * 
 * Usage:
 * node scripts/fix-api-imports.js
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

// Fix a single API route file
async function fixApiRouteFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  // Read the file content
  let content = await readFile(filePath, 'utf8');
  
  // Check if the file has the broken import pattern
  if (!content.includes('import { NextRequest, NextResponse }\nimport { createApiLogger }') &&
      !content.includes('import { NextRequest, NextResponse }\r\nimport { createApiLogger }') &&
      !content.match(/import.*?from 'next\/server';\s+const logger/) &&
      !content.match(/const logger = createApiLogger.*?\s+import/)) {
    console.log(`  No issues found, skipping...`);
    return;
  }
  
  // Fix the broken import statements - first pattern
  content = content.replace(
    /import { NextRequest, NextResponse }\s+import { createApiLogger } from '@\/lib\/utils\/logger';\s+const logger = createApiLogger\('(\w+)'\);\s+from 'next\/server';/,
    "import { NextRequest, NextResponse } from 'next/server';\nimport { createApiLogger } from '@/lib/utils/logger';\n\nconst logger = createApiLogger('$1');"
  );
  
  // Fix the broken import statements - second pattern
  content = content.replace(
    /import { NextRequest, NextResponse } from 'next\/server';\s+import { createApiLogger } from '@\/lib\/utils\/logger';\s+const logger = createApiLogger\('(\w+)'\);\s+import { db } from '@\/lib\/db';/,
    "import { NextRequest, NextResponse } from 'next/server';\nimport { createApiLogger } from '@/lib/utils/logger';\nimport { db } from '@/lib/db';\n\nconst logger = createApiLogger('$1');"
  );
  
  // Write the updated content back to the file
  await writeFile(filePath, content, 'utf8');
  console.log(`  Fixed successfully!`);
}

// Main function
async function main() {
  try {
    // Find all API route files
    const routeFiles = await findApiRouteFiles(API_ROUTES_DIR);
    console.log(`Found ${routeFiles.length} API route files.`);
    
    // Fix each file
    for (const filePath of routeFiles) {
      await fixApiRouteFile(filePath);
    }
    
    console.log('All API route files fixed successfully!');
  } catch (error) {
    console.error('Error fixing API route files:', error);
    process.exit(1);
  }
}

// Run the script
main(); 