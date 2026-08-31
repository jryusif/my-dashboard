async function testGold() {
  const urls = [
    'https://api.gold-api.com/price/XAU',
    'https://data-asg.goldprice.org/dbXRates/USD',
    'https://api.frankfurter.app/latest?from=USD&to=EGP'
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await res.json();
      console.log(`Success for ${u}:`, data);
    } catch (e) {
      console.log(`Failed for ${u}:`, e.message);
    }
  }
}
testGold();
