/**
 * Script to update all loading states in the app to use the LoadingQuote component
 * 
 * This script:
 * 1. Finds all screen files
 * 2. Adds the LoadingQuote import if needed
 * 3. Updates loading state views to use the LoadingQuote component
 * 
 * Usage: node scripts/update-loading-states.js
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

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
  
  scanDir(path.join(__dirname, '../screens'));
  return result;
};

// Add LoadingQuote import if needed
const addImportIfNeeded = (content) => {
  // Check if LoadingQuote is already imported
  if (content.includes("import LoadingQuote from")) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /import .* from ['"].*['"];?/g;
  const imports = [...content.matchAll(importRegex)];
  
  if (imports.length === 0) {
    return content;
  }
  
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = lastImport.index + lastImport[0].length;
  
  // Add LoadingQuote import after the last import
  const importStatement = "\nimport LoadingQuote from '../../components/LoadingQuote';";
  
  return content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
};

// Update loading state views to use LoadingQuote
const updateLoadingStates = (content) => {
  // Find loading state views
  const loadingStateRegex = /if\s*\(\s*loading\s*\)\s*{\s*return\s*\(\s*<View[^>]*>\s*<ActivityIndicator[^>]*>\s*<\/ActivityIndicator>\s*<Text[^>]*>[^<]*<\/Text>\s*<\/View>\s*\);?\s*}/g;
  
  // Replace with LoadingQuote
  return content.replace(loadingStateRegex, (match) => {
    // Extract the loading text
    const loadingTextMatch = match.match(/<Text[^>]*>([^<]*)<\/Text>/);
    const loadingText = loadingTextMatch ? loadingTextMatch[1].trim() : "Loading...";
    
    // Extract the style
    const styleMatch = match.match(/<View[^>]*style=\{([^}]*)\}/);
    const style = styleMatch ? styleMatch[1].trim() : "styles.loadingContainer";
    
    // Create the LoadingQuote component
    return `if (loading) {
    return (
      <LoadingQuote
        loadingText="${loadingText}"
        style={${style}}
      />
    );
  }`;
  });
};

// Process a single file
const processFile = (filePath) => {
  console.log(`${YELLOW}Processing ${filePath}...${RESET}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if the file has loading states
    if (content.includes("loading") && content.includes("ActivityIndicator")) {
      // Add import if needed
      content = addImportIfNeeded(content);
      
      // Update loading states
      content = updateLoadingStates(content);
      
      // Only write if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`${GREEN}Updated ${filePath}${RESET}`);
      } else {
        console.log(`${YELLOW}No changes needed for ${filePath}${RESET}`);
      }
    } else {
      console.log(`${YELLOW}No loading states found in ${filePath}${RESET}`);
    }
  } catch (error) {
    console.error(`${RED}Error processing ${filePath}:${RESET}`, error);
  }
};

// Main function
const main = () => {
  console.log(`${YELLOW}Updating loading states to use LoadingQuote component...${RESET}`);
  
  // Get all screen files
  const screenFiles = getAllScreenFiles();
  console.log(`${YELLOW}Found ${screenFiles.length} screen files${RESET}`);
  
  // Process each file
  screenFiles.forEach(processFile);
  
  console.log(`${GREEN}Done!${RESET}`);
};

// Run the script
main();
