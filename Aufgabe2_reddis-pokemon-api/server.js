// server.js
import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from 'redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'public')));


// --- Redis/Valkey Client ---
const redis = createClient({ url: 'redis://localhost:6379' });
redis.on('error', (err) => console.error('Redis error:', err));
await redis.connect();

// API: Einzelnes Pokémon mit Cache
app.get('/api/pokemon/:name', async (req, res) => {
  const name = req.params.name.toLowerCase();
  const key = `pokemon:${name}`;

  try {
    // 1) Cache-Check
    const cached = await redis.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // 2) Upstream holen
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);

    // 3) Im Cache mit TTL (z. B. 300s) speichern
    await redis.set(key, JSON.stringify(data), { EX: 300 });

    res.set('X-Cache', 'MISS');
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Could not fetch Pokémon.' });
  }
});

// API: Liste (100 Namen) – optional cachen
app.get('/api/list', async (_, res) => {
  const key = 'pokemon:list:100';
  try {
    const cached = await redis.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    const { data } = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=100');
    const names = data.results.map((p) => p.name);

    await redis.set(key, JSON.stringify(names), { EX: 300 });

    res.set('X-Cache', 'MISS');
    return res.json(names);
  } catch {
    return res.status(500).json({ error: 'Could not fetch Pokémon list.' });
  }
});

app.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
});
