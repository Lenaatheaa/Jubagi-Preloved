const urls = [
  'https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?w=600&q=80', // Should be 404
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80' // Working one
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(url, res.status);
    } catch (e) {
      console.error(url, e.message);
    }
  }
}
check();
