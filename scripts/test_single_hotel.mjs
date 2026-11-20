async function testHotel(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'ar,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  console.log('HTML length:', html.length);

  // Look for og tags
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
  const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  console.log('og:title:', ogTitle);
  console.log('og:description:', ogDesc);
  console.log('og:image:', ogImage);

  // Look for title tag
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  console.log('title:', title);

  // Look for images
  const imgMatches = [...html.matchAll(/https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/[^\s"']+/g)].map(m => m[0]);
  const uniqueImgs = [...new Set(imgMatches.map(u => u.replace(/\?.*$/, '')))];
  console.log('Images found:', uniqueImgs.slice(0, 10));

  // Look for JSON-LD schema
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const m of jsonLdMatches) {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed['@type'] === 'Hotel' || parsed['@type'] === 'LodgingBusiness' || parsed['@type'] === 'Accommodation') {
        console.log('Found Schema JSON-LD:', JSON.stringify(parsed, null, 2));
      }
    } catch {}
  }
}

testHotel('https://www.booking.com/hotel/sa/hmm-llshqq-lmkhdwm-l-l.ar.html');
