async function testEgp() {
  const urls = [
    'https://open.er-api.com/v6/latest/USD',
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u);
      const data = await res.json();
      console.log(`Success for ${u}: EGP =`, data.rates?.EGP || data.usd?.egp);
    } catch (e) {
      console.log(`Failed for ${u}:`, e.message);
    }
  }
}
testEgp();
