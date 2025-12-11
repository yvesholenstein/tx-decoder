// Bundle entry point for bitcoinjs-lib (esbuild - NOT USED)
// NOTE: This file is kept for reference but NOT currently used.
// We use browserify-entry.js with browserify instead, which properly handles
// CommonJS modules and exposes Buffer globally.

// If switching back to esbuild, uncomment below:
// import * as bitcoinjsModule from 'bitcoinjs-lib';
// const bitcoinjs = bitcoinjsModule.default || bitcoinjsModule;
// if (typeof window !== 'undefined') {
//     window.bitcoin = bitcoinjs;
// }
// export default bitcoinjs;
