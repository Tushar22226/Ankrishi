// Custom resolver for Firebase modules
const path = require('path');
const fs = require('fs');

// This function will be used by Metro to resolve modules
module.exports = (request, options) => {
  try {
    // Ensure request is a string
    if (typeof request !== 'string') {
      console.log('Request is not a string:', typeof request);
      return options.defaultResolver(request, options);
    }

    // Handle the specific case we're encountering
    if (request === './postinstall.mjs' &&
        options.originModulePath &&
        typeof options.originModulePath === 'string' &&
        options.originModulePath.includes('@firebase/util/dist/index.esm2017.js')) {

      console.log('Intercepted Firebase postinstall.mjs request from index.esm2017.js');

      // Return the actual postinstall.mjs file path
      const postinstallPath = path.resolve(__dirname, 'node_modules/@firebase/util/dist/postinstall.mjs');

      if (fs.existsSync(postinstallPath)) {
        console.log('Using existing postinstall.mjs file');
        return {
          filePath: postinstallPath,
          type: 'sourceFile',
        };
      } else {
        console.log('Using our patch file instead');
        return {
          filePath: path.resolve(__dirname, 'firebase-patch.js'),
          type: 'sourceFile',
        };
      }
    }

    // For all other requests, use the default resolver
    return options.defaultResolver(request, options);
  } catch (error) {
    console.error('Error in firebase-resolver:', error);
    // In case of any error, fall back to the default resolver
    return options.defaultResolver(request, options);
  }
};
