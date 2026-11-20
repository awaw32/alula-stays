async function testGooglebot() {
  const url = 'https://www.booking.com/hotel/sa/suits-apartment.ar.html';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Length:', text.length);
  const title = text.match(/<title>([^<]+)<\/title>/)?.[1];
  console.log('Title:', title);
}

testGooglebot();
