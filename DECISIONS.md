# Design Decisions

This document records key design decisions made during development.

## 2026-01-29: Initial Implementation Decisions

### RPS Game Flow (No Ultimate Winner)
**Decision**: Rounds continue indefinitely with no "best of X" winner. Each round displays the winner, waits 3 seconds, then auto-starts the next round. A running score tracks total rounds won by each player.

**Rationale**: Keeps the game simple and casual. Players can play as many rounds as they want and leave whenever.

### Matchmaking Architecture
**Decision**: Single global matchmaking queue per game type. When a player joins `/ws/game/{game_id}`, they enter that game's waiting queue. Once two players are queued, a game instance is spawned with a unique UUID. Both players receive the instance ID and their URLs update to `/game/{game_id}/{instance_id}`.

**Rationale**: Simple approach that works well for low-traffic personal use. The unique instance URL enables easy reconnection - a player can bookmark or share the URL to rejoin.

### WebSocket Disconnect Handling
**Decision**: Use FastAPI's `WebSocketDisconnect` exception to detect disconnects. On disconnect:
1. Mark player as disconnected in the game instance
2. Notify opponent via WebSocket message
3. Schedule a 60-second cleanup task using `asyncio.create_task`
4. If both players still disconnected when timer fires, delete the game instance from memory

**Rationale**: Simpler than a background polling process. Fits naturally with Python's async model and FastAPI's WebSocket handling. No external dependencies needed.

### Visual Style
**Decision**: Playful, mobile-first design. Clean but with personality - subtle animations, friendly colors, works well on phones.

**Rationale**: This is a casual game platform for personal use. Should feel fun, not corporate.

### No Database
**Decision**: All game state exists only in memory as Python objects in dictionaries. No persistence.

**Rationale**: With only ~2 concurrent users expected, there's no need for persistence complexity. Games are ephemeral - when players leave, games eventually disappear. This dramatically simplifies the architecture.

### Single Process Deployment
**Decision**: Run as a single uvicorn process with no workers, no Redis, no message queues.

**Rationale**: Horizontal scaling is unnecessary for personal use. A single process can easily handle the expected load and keeps WebSocket state management trivial (no need to sync state across processes).
