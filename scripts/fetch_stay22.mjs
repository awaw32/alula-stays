const urls = [
  'https://booking.stay22.com/koko4800/jmfGCif6QY',
  'https://booking.stay22.com/koko4800/a1NSiVqmp1',
  'https://booking.stay22.com/koko4800/MsEdv8nk6W',
  'https://booking.stay22.com/koko4800/yooslrkZN7',
  'https://booking.stay22.com/koko4800/IsWEC8_-f0',
  'https://booking.stay22.com/koko4800/Z2HSm2umda',
  'https://booking.stay22.com/koko4800/MDBwPJgGPh',
  'https://booking.stay22.com/koko4800/_mCY30IB6I',
  'https://booking.stay22.com/koko4800/V_ZmfeguHL',
  'https://booking.stay22.com/koko4800/3PQ62-D8Gu',
  'https://booking.stay22.com/koko4800/_sCR92ORTW',
  'https://booking.stay22.com/koko4800/WRVj-7DJaE'
];

async function getBookingLink(url) {
  const res = await fetch(url, {
    method: 'HEAD',
    redirect: 'manual',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const loc = res.headers.get('location');
  if (!loc) return null;
  const match = loc.match(/link=([^&]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return loc;
}

async function run() {
  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const bookingUrl = await getBookingLink(u);
    console.log(JSON.stringify({ index: i + 1, stay22Url: u, bookingUrl }, null, 2));
    results.push({ index: i + 1, stay22Url: u, bookingUrl });
  }
}

run();
