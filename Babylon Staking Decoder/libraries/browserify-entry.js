// Expose Buffer globally for browser usage
window.Buffer = require('buffer/').Buffer;

// Export bitcoinjs-lib
module.exports = require('bitcoinjs-lib');
