const express = require('express');
const path = require('path');
const axios = require('axios');
const https = require('https');
const app = express();
const PORT = 3000;
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 30 /* seconds */ }); 

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const agent = new https.Agent({
  rejectUnauthorized: false
});

app.get('/api/dexscreener', async (req, res) => {
  try {
    const limit = req.query.limit || '200';
    const cacheKey = `dex:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://api.dexscreener.com/latest/dex/search?limit=${limit}`;
    const resp = await axios.get(url);
    if (!resp.ok) {
      return res.status(502).json({ error: `Upstream error ${resp.status}` });
    }
    const data = await resp.json();
    cache.set(cacheKey, data);
    // optionally sanitize data before returning
    return res.json(data);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: 'internal_proxy_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

