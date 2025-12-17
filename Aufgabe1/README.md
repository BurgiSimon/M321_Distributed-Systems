# Distributed Counter System with Load Balancer

A distributed system with 3 synchronized Node.js servers behind an NGINX load balancer.

## Getting Started

Start the system:

```bash
docker compose up --build
```

## Endpoints (via Load Balancer)

Access via `http://localhost:8080`:

- `GET /increment` - Increment counter (distributed round-robin)
- `GET /counter` - Get current counter value
- `GET /counters` - Debug: View counter state of all nodes

## Architecture

- **Load Balancer**: NGINX (Port 8080) -> distributes traffic
- **Backends**: 3 Node.js instances (Internal network only)
- **Sync**: Servers replicate increments to peers via internal HTTP calls
