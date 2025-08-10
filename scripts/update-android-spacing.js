/**
 * Script to update all screen components with platform-specific top margin for Android
 * 
 * This script:
 * 1. Adds the import for getPlatformTopSpacing if not already present
 * 2. Updates the container/scrollContainer styles to use platform-specific spacing
 * 
 * Usage: node scripts/update-android-spacing.js
 */

const fs = require('fs');
const path = require('path');

// Get all screen files
const getAllScreenFiles = () => {
  const result = [];
  const scanDir = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (file.endsWith('.tsx') && !file.includes('test') && !file.includes('spec')) {
        result.push(filePath);
      }
    });
  };
  
  scanDir('screens');
  return result;
};

// Add import if not present
const addImportIfNeeded = (content) => {
  if (!content.includes('import { getPlatformTopSpacing }')) {
    // Find the last import statement
    const importRegex = /import .+ from ['"].+['"];?\n/g;
    let lastImportMatch;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      lastImportMatch = match;
    }
    
    if (lastImportMatch) {
      const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
      return content.slice(0, insertPosition) + 
        "import { getPlatformTopSpacing } from '../utils/platformUtils';\n" + 
        content.slice(insertPosition);
    }
  }
  
  return content;
};

// Update container styles
const updateContainerStyles = (content) => {
  // Look for container or scrollContainer styles
  const containerStyleRegex = /(scrollContainer|container):\s*{[^}]*paddingTop:\s*([^,}]+)([,}])/g;
  
  return content.replace(containerStyleRegex, (match, styleName, paddingValue, ending) => {
    // Don't replace if already using getPlatformTopSpacing
    if (match.includes('getPlatformTopSpacing')) {
      return match;
    }
    
    // Don't replace if already using Platform.OS check
    if (match.includes('Platform.OS')) {
      return match;
    }
    
    // Replace with platform-specific spacing
    return `${styleName}: {${match.substring(match.indexOf('{') + 1, match.indexOf('paddingTop'))}...getPlatformTopSpacing('paddingTop', ${paddingValue.trim()}, ${paddingValue.trim()} * 1.5)${ending}`;
  });
};

// Process a single file
const processFile = (filePath) => {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Add import if needed
    content = addImportIfNeeded(content);
    
    // Update container styles
    content = updateContainerStyles(content);
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

// Main function
const main = () => {
  const files = getAllScreenFiles();
  console.log(`Found ${files.length} screen files to process`);
  
  files.forEach(processFile);
  
  console.log('Done!');
};

main();
