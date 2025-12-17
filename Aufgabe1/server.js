const express = require('express');
const app = express();

const currentPort = Number(process.env.PORT || 3000);

// erstellt Backend List aus den Docker Variabeln
const backendList = (process.env.BACKENDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(express.json());

let counter = 0;

// Just to simulate non-zero latency
function simulateLatency() {
  return new Promise(resolve => setTimeout(resolve, Math.random() * 200));
}

async function fetchWithTimeout(url, opts = {}, ms = 5000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

app.get('/counter', async (_req, res) => {
  res.json({ counter });
});

// Task also mentions /increment
app.get('/increment', async (_req, res) => {
  await simulateLatency();

  // 1) Local increment
  counter++;
  console.log(`[${process.env.HOSTNAME}] /increment -> ${counter}`);

  // 2) Best-effort replication to peers (fire sequentially for clarity)
  for (const peer of backendList) {
    try {
      await fetchWithTimeout(`http://${peer}/replicate-increment`, { method: 'POST' }, 2000);
    } catch (e) {
      // Peer down? That's fine; they'll catch up on restart via reconcile.
      console.warn(`[${process.env.HOSTNAME}] failed to notify ${peer}: ${e.message}`);
    }
  }

  // 3) Reply
  res.json({ counter });
});

// Internal endpoint: apply ONE increment with no fan-out (prevents infinite loops)
app.post('/replicate-increment', async (_req, res) => {
  await simulateLatency();
  counter++;
  console.log(`[${process.env.HOSTNAME}] /replicate-increment -> ${counter}`);
  res.json({ ok: true, counter });
});

// On startup, pull the max counter from peers (server that was down catches up)
async function reconcileFromPeers() {
  let maxVal = counter;
  for (const peer of backendList) {
    try {
      const r = await fetchWithTimeout(`http://${peer}/counter`, {}, 2000);
      if (r.ok) {
        const data = await r.json();
        if (typeof data.counter === 'number') {
          maxVal = Math.max(maxVal, data.counter);
        }
      }
    } catch (_) {
    }
  }
  if (maxVal !== counter) {
    counter = maxVal;
    console.log(`[${process.env.HOSTNAME}] reconciled to ${counter}`);
  }
  return counter;
}

app.listen(currentPort, async () => {
  console.log(`Server running on port ${currentPort}`);
  console.log(`[${process.env.HOSTNAME}] peers: ${backendList.join(', ') || 'none'}`);

  await reconcileFromPeers();
});
