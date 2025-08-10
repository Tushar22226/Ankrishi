// This is a patch file to handle the Firebase postinstall.mjs issue
// It exports an empty module that can be used as a replacement for the missing file

// Support both CommonJS and ES modules
// CommonJS export
module.exports = {
  // Empty implementation
};

// ES module export
export default {
  // Empty implementation
};

// Named exports that might be used
export const install = () => {};
export const uninstall = () => {};
export const isNode = true;
