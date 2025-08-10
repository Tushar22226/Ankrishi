/**
 * Script to increase top margin in all screen components by 10dp
 * 
 * This script:
 * 1. Updates the platformUtils.ts file to add an additional 10dp to Android top spacing
 * 2. Updates existing screen files that use getPlatformTopSpacing
 * 
 * Usage: node scripts/increase-android-top-margin.js
 */

const fs = require('fs');
const path = require('path');

// Path to platformUtils.ts
const PLATFORM_UTILS_PATH = path.join(__dirname, '../utils/platformUtils.ts');

// Update platformUtils.ts to add additional margin
const updatePlatformUtils = () => {
  console.log('Updating platformUtils.ts...');
  
  try {
    let content = fs.readFileSync(PLATFORM_UTILS_PATH, 'utf8');
    const originalContent = content;
    
    // Update the getTopSpacing function to add 10dp to Android spacing
    const getTopSpacingRegex = /export const getTopSpacing = \(baseValue: number, androidValue\?: number\): number => {\s*if \(Platform\.OS === 'android'\) {\s*return androidValue !== undefined \? androidValue : baseValue \* 1\.5;\s*}/;
    
    const updatedGetTopSpacing = `export const getTopSpacing = (baseValue: number, androidValue?: number): number => {
  if (Platform.OS === 'android') {
    // Add additional 10dp to Android spacing
    return androidValue !== undefined ? androidValue + 10 : baseValue * 1.5 + 10;
  }`;
    
    content = content.replace(getTopSpacingRegex, updatedGetTopSpacing);
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(PLATFORM_UTILS_PATH, content, 'utf8');
      console.log('Updated platformUtils.ts with additional 10dp margin for Android');
    } else {
      console.log('No changes needed for platformUtils.ts');
    }
  } catch (error) {
    console.error('Error updating platformUtils.ts:', error);
  }
};

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

// Process a single file to check if it uses getPlatformTopSpacing
const processFile = (filePath) => {
  console.log(`Processing ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file uses getPlatformTopSpacing
    if (content.includes('getPlatformTopSpacing')) {
      console.log(`${filePath} uses getPlatformTopSpacing - will automatically get the increased margin`);
    } else {
      console.log(`${filePath} does not use getPlatformTopSpacing - run add-android-top-margin.sh to add it`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

// Main function
const main = () => {
  // Update platformUtils.ts first
  updatePlatformUtils();
  
  // Process screen files to check which ones use getPlatformTopSpacing
  const files = getAllScreenFiles();
  console.log(`Found ${files.length} screen files to process`);
  
  files.forEach(processFile);
  
  console.log('\nDone! To add platform-specific spacing to screens that don\'t have it yet, run:');
  console.log('bash scripts/add-android-top-margin.sh');
};

main();
