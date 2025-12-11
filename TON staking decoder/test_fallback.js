const fs = require('fs');
const path = require('path');

// Minimal browser stubs
global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.DEFAULT_SETTINGS = { showAdvanced: true };
global.PROTOCOLS = { UNKNOWN: 'Unknown', TRANSFER: 'Transfer' };
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}
if (typeof btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof atob === 'undefined') {
  global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

// Load decoder code
const configPath = path.join(__dirname, 'config.js');
eval(fs.readFileSync(configPath, 'utf8'));
const decoderPath = path.join(__dirname, 'decoder.js');
const code = fs.readFileSync(decoderPath, 'utf8');
eval(code);

const sampleBoc = 'te6cckECCgEAApMAA7V5/EsejtUs3nJK91C3pWnd18T7FyUNZBmHVpXJez3BbqAAA36rKF+0GmPc+VW7PNx4Ggsf6q3DVpOHCM9b2UqVY+drKAY9NzyQAAN+M+GhLGaMT72gADRkMwWoAQIDAgHgBAUAgnKSPketLU8T8eZm7PrmqgPDNp2dX788FbBuKq01c4BEXuPDYJ43siqyltlOygbjqjFRtN3shAdOXK53SszCc0eXAhEMk9aGGKGGBEAICQHhiAE/iWPR2qWbzkle6hb0rTu6+J9i5KGsgzDq0rkvZ7gt1AODirnHMc0fUQAyzmmAVpycQv+XXhsW6noYLrfb6BMT5//BCIezaQRWsXaPPhQyJQSuI2FpwMAkKZTOTjvooYBhTU0Yu0Yn4kAAABn4ABwGAQHfBwCyQgBCkiH8LM/zUu0afyGCTWJwX1mDjdlf2rMa9UoQlD4UHSBuuLoAAAAAAAAAAAAAAAAAAAAAAAA1MCBUZWxlZ3JhbSBTdGFycyAKClJlZiN0ZkhhUnc0SWUA+0gBP4lj0dqlm85JXuoW9K07uvifYuShrIMw6tK5L2e4LdUAIUkQ/hZn+al2jT+QwSaxOC+swcbsr+1ZjXqlCEofCg6QN1xdAAYII1oAAG/VZQv2hNGJ97QAAAAAGpgQKjK2MrO5MLaQKbowuTmQBQUpMrMRujMkMKk7miSywACdQZ2DE4gAAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABvyYMNQEwII0wAAAAAAAIAAAAAAAO93Od/nD+/0bfoSFGYleS/LCP7qoqw5ieWjwkZWdqGwEBQH0xDL/II';

(async () => {
  const res = await window.decodeTonPayload(sampleBoc);
  console.log(JSON.stringify(res, null, 2));
})();
