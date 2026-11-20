import fs from 'node:fs';

const path = 'C:\\Users\\majed\\.gemini\\antigravity-ide\\brain\\a60790e9-498e-4e3f-939d-f555200b0a5b\\.system_generated\\steps\\53\\content.md';
const content = fs.readFileSync(path, 'utf8');

console.log('Length:', content.length);
const titleMatch = content.match(/<title>([^<]+)<\/title>/);
console.log('Title:', titleMatch ? titleMatch[1] : null);

const ogDesc = content.match(/<meta property="og:description" content="([^"]+)"/);
console.log('OG Desc:', ogDesc ? ogDesc[1] : null);

const ogImg = content.match(/<meta property="og:image" content="([^"]+)"/);
console.log('OG Img:', ogImg ? ogImg[1] : null);

const imgs = content.match(/https:\/\/[^"'\s]+bstatic\.com\/[^"'\s]+\.(?:jpg|jpeg|png)/g);
console.log('Images count:', imgs ? imgs.length : 0);
if (imgs) {
  const clean = [...new Set(imgs.map(u => u.replace(/&amp;/g, '&')))];
  console.log('Clean unique images:', clean.slice(0, 10));
}

// Check for hotel details like bedrooms, price, rating
const ratingMatch = content.match(/data-review-score="([^"]+)"/) || content.match(/"ratingValue":\s*"([^"]+)"/) || content.match(/class="[^"]*d6667e0704[^"]*">([0-9.]+)</);
console.log('Rating:', ratingMatch ? ratingMatch[1] : null);

// Check for address / location
const addrMatch = content.match(/data-node_tt_id="location_score_tooltip"[^>]*>([^<]+)</) || content.match(/"addressRegion":\s*"([^"]+)"/);
console.log('Address:', addrMatch ? addrMatch[1] : null);
