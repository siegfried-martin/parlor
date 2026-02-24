# Parlor - Claude Code Instructions

## Project Overview
Parlor is a lightweight web platform for two-player and single-player games, built for personal use. See `overview.md` for detailed architecture and `DECISIONS.md` for design decisions.

## Tech Stack
- **Backend**: FastAPI (Python 3.11+) with Jinja2 templates
- **Frontend**: Vanilla JavaScript
- **Real-time**: Native FastAPI WebSockets
- **Database**: None (in-memory only)

## Configuration

Environment variables in `.env` (see `.env.example`):
- `PORT` - Server port (default: 8500)

## Local Development

```bash
# Activate virtual environment
source venv/bin/activate

# Run development server (uses PORT from .env)
python main.py
```

## Project Structure

```
/
├── main.py                 # FastAPI app, routes, WebSocket handling, matchmaking
├── games/
│   ├── base.py             # BaseGame abstract class, Player dataclass
│   └── rps.py              # Rock Paper Scissors implementation
├── templates/
│   ├── base.html           # Base template with head/scripts
│   ├── index.html          # Landing page with game selection
│   └── games/
│       └── rps.html        # RPS game UI
├── static/
│   ├── css/
│   │   └── common.css      # Shared styles (playful, mobile-first)
│   └── js/
│       ├── game-client.js  # WebSocket wrapper class
│       └── game-utils.js   # Shared UI utilities
```

## Key Implementation Details

### Matchmaking Flow
1. Player connects to `/ws/game/{game_id}` and sends `{type: "join", player_name: "..."}`
2. Server adds player to game-specific waiting queue
3. When 2 players in queue, server creates game instance with UUID
4. Server sends `{type: "matched", instance_id: "...", opponent_name: "..."}` to both
5. Clients update URL to `/game/{game_id}/{instance_id}`

### Reconnection Flow
1. If URL has instance_id, client sends `{type: "rejoin", instance_id: "..."}`
2. Server checks if instance exists with disconnected player matching name
3. If match: restore connection, send current state, notify opponent
4. If no match: treat as new player, enter matchmaking

### Disconnect Handling
- Catch `WebSocketDisconnect` exception
- Mark player as disconnected, notify opponent
- Schedule 60-second cleanup task with `asyncio.create_task`
- If both players still disconnected when timer fires, delete instance

### RPS Game Flow
- Rounds continue indefinitely (no ultimate winner)
- Each round: both choose -> reveal -> show result -> 3 second delay -> next round
- Running score tracks total rounds won per player

## New Game Development Workflow

New games are designed in a companion Claude project and documented in `documentation/games/{game_id}.md`. These design docs contain:
- Game rules and state machine
- Complete Python backend implementation
- Complete HTML/JS/CSS frontend
- WebSocket message formats
- Registration instructions
- Testing checklist

**To implement a new game:**
1. Read the design doc in `documentation/games/`
2. Ask clarifying questions if anything is unclear
3. Create the files as specified in the design doc
4. Register in `main.py` and add to index page
5. Test against the testing checklist
6. Commit and push

## Adding a New Multiplayer Game (Quick Reference)

1. Create `games/{game_id}.py` with class inheriting from `BaseGame`
2. Implement required methods: `handle_move`, `get_game_state`, `reset_for_rematch`
3. Add to `GAME_REGISTRY` in `main.py`
4. Create `templates/games/{game_id}.html`
5. Optionally add `static/css/games/{game_id}.css`
6. Add to index page game list

## Adding a Solo Game

1. Create `templates/solo/{game_id}.html` with all logic client-side
2. Add route in `main.py` (simple template render)
3. Add to index page under single-player section

## Git Workflow

- **Do not push directly to main** unless explicitly instructed. Work on feature branches and wait for verification before merging/pushing to main.
- Commit to the current feature branch by default.

## Common Tasks

### Debugging WebSocket issues
- Check browser console for connection errors
- Server logs show connection/disconnection events
- Verify message format matches protocol in `overview.md`

### Styling changes
- Mobile-first approach in `common.css`
- Use CSS custom properties for theming
- Game-specific styles go in `static/css/games/{game_id}.css`
