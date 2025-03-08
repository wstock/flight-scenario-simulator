/**
 * Script to more thoroughly fix the broken import statements in API route files
 * 
 * This script will:
 * 1. Find all API route files
 * 2. Apply a more comprehensive fix for import statements
 * 3. Ensure proper order and format of imports
 * 
 * Usage:
 * node scripts/fix-api-imports-thorough.js
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

// Extract route name from file path
function getRouteName(filePath) {
  const dirName = path.basename(path.dirname(filePath));
  // Handle dynamic route names (e.g., [id])
  if (dirName.startsWith('[') && dirName.endsWith(']')) {
    return 'DynamicRoute';
  }
  return dirName.charAt(0).toUpperCase() + dirName.slice(1) + 'Route';
}

// Fix a single API route file
async function fixApiRouteFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  // Read the file content
  let content = await readFile(filePath, 'utf8');
  
  // Get the route name for the logger
  const routeName = getRouteName(filePath);
  
  // Check for common broken import patterns
  const hasImportIssue1 = content.includes('import { NextRequest, NextResponse }\nimport');
  const hasImportIssue2 = content.includes('import { NextRequest, NextResponse }\r\nimport');
  const hasImportIssue3 = content.match(/import.*?from 'next\/server';\s+const logger/);
  const hasImportIssue4 = content.match(/const logger = createApiLogger.*?\s+import/);
  const hasImportIssue5 = content.match(/import { NextRequest, NextResponse }\s+.*?\s+from 'next\/server'/);
  
  if (!hasImportIssue1 && !hasImportIssue2 && !hasImportIssue3 && !hasImportIssue4 && !hasImportIssue5) {
    console.log(`  No issues found, skipping...`);
    return;
  }
  
  // Complete rewrite approach - extract the important parts and rebuild
  let imports = [];
  let loggerDeclaration = '';
  let restOfFile = '';
  
  // Extract imports
  const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
  const importMatches = content.match(importRegex) || [];
  
  // Clean up imports and remove duplicates
  const uniqueImports = new Set();
  importMatches.forEach(imp => {
    // Fix broken imports
    let cleanImport = imp.replace(/\s+/g, ' ').trim();
    if (cleanImport.includes('NextRequest') && cleanImport.includes('NextResponse') && !cleanImport.includes('from')) {
      cleanImport = "import { NextRequest, NextResponse } from 'next/server'";
    }
    if (!cleanImport.includes('from')) return; // Skip incomplete imports
    uniqueImports.add(cleanImport);
  });
  
  // Make sure we have the core imports
  uniqueImports.add("import { NextRequest, NextResponse } from 'next/server'");
  uniqueImports.add("import { createApiLogger } from '@/lib/utils/logger'");
  uniqueImports.add("import { db } from '@/lib/db'");
  
  // Create logger declaration
  loggerDeclaration = `const logger = createApiLogger('${routeName}');`;
  
  // Extract the rest of the file (after imports)
  const contentLines = content.split('\n');
  let foundNonImportLine = false;
  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i];
    if (!line.trim().startsWith('import') && !line.trim().startsWith('const logger') && line.trim() !== '') {
      foundNonImportLine = true;
    }
    if (foundNonImportLine) {
      restOfFile += line + '\n';
    }
  }
  
  // Build the fixed file
  const fixedContent = Array.from(uniqueImports).join(';\n') + ';\n\n' + 
                       loggerDeclaration + '\n\n' + 
                       restOfFile;
  
  // Write the updated content back to the file
  await writeFile(filePath, fixedContent, 'utf8');
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