# Parlor

A lightweight web platform for playing two-player and single-player games, built for personal use.

Deployed at `parlor.marstol.com`.

## Architecture Overview

### Tech Stack

- **Backend:** FastAPI (Python 3.11+) with Jinja2 templates
- **Frontend:** Vanilla JavaScript with shared utility library
- **WebSockets:** Native FastAPI/Starlette WebSocket support
- **Database:** None initially (games exist only in memory)
- **Deployment:** Single process, no external dependencies

### Design Philosophy

This platform is intentionally simple. With only two concurrent users expected, there's no need for horizontal scaling, Redis, worker processes, or any distributed systems complexity. Games exist as Python objects in a dictionary. When both players disconnect, the game eventually evaporates.

## Project Structure

```
/
├── main.py                     # FastAPI application entry point
├── requirements.txt            # Python dependencies
├── static/
│   ├── css/
│   │   ├── common.css          # Shared styles
│   │   ├── puppet-animations.css # CSS animations for Curtain Call puppets
│   │   ├── games/              # Multiplayer game styles
│   │   └── solo/               # Single-player game styles
│   └── js/
│       ├── game-client.js      # WebSocket wrapper and game lifecycle (multiplayer)
│       ├── game-utils.js       # Shared UI utilities
│       └── solo/               # Single-player game scripts
│           └── curtain-call/   # Curtain Call (19 JS files, see curtain_call docs)
├── templates/
│   ├── base.html               # Base template with common head/scripts
│   ├── index.html              # Game selection landing page
│   ├── games/                  # Multiplayer game templates
│   │   ├── rps.html
│   │   ├── image-reveal.html
│   │   └── event-dash.html
│   └── solo/                   # Single-player game templates
│       ├── curtain-call.html
│       └── eldrow.html
├── games/
│   ├── base.py                 # Abstract base class for multiplayer games
│   ├── rps.py                  # Rock Paper Scissors
│   ├── image_reveal.py         # Image Reveal
│   └── event_dash.py           # Event Dash
└── documentation/
    └── games/                  # Per-game design docs and rules
```

## Games

### Multiplayer

| Game | Route | Description |
|------|-------|-------------|
| Rock Paper Scissors | `/game/rps` | Classic RPS with continuous rounds and running score |
| Image Reveal | `/game/image-reveal` | Co-op puzzle — one player uploads an image and gives hints, the other guesses as tiles reveal on an 8×8 grid |
| Event Dash | `/game/event-dash` | Competitive scavenger hunt — find restaurants and activities in a random US city using Google Maps (requires `GOOGLE_MAPS_API_KEY`) |

### Solo

| Game | Route | Description |
|------|-------|-------------|
| Curtain Call | `/solo/curtain-call` | Shadow puppet deck-builder roguelike — two protagonists defend a shared MacGuffin across 3 acts. See `documentation/games/curtain_call/` for full docs |
| Eldrow | `/solo/eldrow` | Configurable word puzzle (Wordle variant) with adjustable word length, board count, and guess limit |

## URL Structure

**Multiplayer:**

- `/` - Landing page with game selection (multiplayer and single-player sections)
- `/game/{game_id}` - Game lobby (SSR page with name entry, then WebSocket connection)
- `/game/{game_id}/{instance_id}` - Active game instance (URL updates via pushState after matchmaking)

**Single-player:**

- `/solo/{game_id}` - Single-player game (pure static, no WebSocket)

## HTTP vs WebSocket Responsibilities

**HTTP (SSR Templates):** Page shells, initial render, navigation. User visits a URL, server returns complete HTML.

**WebSocket (JSON):** All real-time game communication. Matchmaking, game state updates, player moves, disconnection handling.

## WebSocket Message Format

All messages are JSON with a `type` field and additional fields depending on message type.

### Client → Server Messages

```json
{ "type": "join", "player_name": "Ziggy" }
```

Sent when player connects and enters their name.

```json
{"type": "move", "data": {...}}
```

Game-specific move data. Structure depends on the game.

```json
{ "type": "rematch_request" }
```

Player wants to play again.

```json
{ "type": "rematch_accept" }
```

Player accepts rematch request.

### Server → Client Messages

```json
{ "type": "waiting", "message": "Waiting for opponent..." }
```

Player is in queue, no opponent yet.

```json
{ "type": "matched", "instance_id": "abc123", "opponent_name": "Partner" }
```

Opponent found, game starting. Client should update URL.

```json
{ "type": "rejoined", "instance_id": "abc123", "opponent_name": "Partner" }
```

Successfully rejoined an existing game instance.

```json
{ "type": "game_state", "data": {...} }
```

Game-specific state update. Structure depends on the game. Always includes `my_name`, `opponent_name`, and `opponent_connected` for UI convenience.

```json
{ "type": "round_result", "winner": "Ziggy", "reason": "Rock beats scissors", "choices": {...}, "scores": {...} }
```

Round ended (for games with multiple rounds). Winner is null for ties.

```json
{ "type": "new_round", "round": 2 }
```

New round starting (for games with multiple rounds).

```json
{ "type": "game_over", "winner": "Ziggy", "reason": "..." }
```

Game ended. Winner is null for draws.

```json
{ "type": "opponent_disconnected" }
```

Opponent's WebSocket closed. Game paused pending reconnection.

```json
{ "type": "opponent_reconnected" }
```

Opponent reconnected. Game resumes.

```json
{ "type": "rematch_requested", "by": "Partner" }
```

Opponent wants a rematch.

```json
{ "type": "rematch_starting" }
```

Both players agreed, new game beginning.

```json
{ "type": "error", "message": "..." }
```

Something went wrong.

## Game Implementation Contract

Each game is a Python class inheriting from `BaseGame`:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

@dataclass
class Player:
    name: str
    websocket: Optional[WebSocket] = None
    connected: bool = True

class BaseGame(ABC):
    game_id: str  # e.g., "rps" - used in URLs
    display_name: str  # e.g., "Rock Paper Scissors"
    min_players = 2
    max_players = 2

    def __init__(self, instance_id: str):
        self.instance_id = instance_id
        self.players: list[Player] = []
        self.state: dict = {}

    @abstractmethod
    async def handle_move(self, player: Player, data: dict) -> None:
        """Process a player's move. Should update state and broadcast as needed."""
        pass

    @abstractmethod
    def get_game_state(self, for_player: Player) -> dict:
        """Return game state from this player's perspective (hide opponent's hidden info).
        Should include: my_name, opponent_name, opponent_connected for UI convenience."""
        pass

    @abstractmethod
    def reset_for_rematch(self) -> None:
        """Reset game state for a new round/rematch."""
        pass

    def get_opponent(self, player: Player) -> Optional[Player]:
        """Get the opponent of the given player."""
        for p in self.players:
            if p != player:
                return p
        return None

    async def broadcast(self, message: dict, exclude: Player = None) -> None:
        """Send message to all connected players except excluded one."""
        for player in self.players:
            if player.connected and player.websocket and player != exclude:
                await player.websocket.send_json(message)

    async def send_to(self, player: Player, message: dict) -> None:
        """Send message to specific player."""
        if player.connected and player.websocket:
            await player.websocket.send_json(message)

    async def broadcast_game_state(self) -> None:
        """Send personalized game state to each player."""
        for player in self.players:
            if player.connected:
                state = self.get_game_state(player)
                await self.send_to(player, {"type": "game_state", "data": state})
```

## Frontend Game Client

`game-client.js` provides a `GameClient` class that handles WebSocket lifecycle:

```javascript
class GameClient {
  constructor(gameId, handlers) {
    this.gameId = gameId;
    this.handlers = handlers;
    this.ws = null;
    this.instanceId = null;
    this.playerName = null;
  }

  connect(playerName, instanceId = null) {
    this.playerName = playerName;
    this.instanceId = instanceId;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/game/${this.gameId}`;
    this.ws = new WebSocket(wsUrl);
    this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
    this.ws.onopen = () => {
      if (instanceId) {
        // Rejoin existing game
        this.send({ type: "rejoin", instance_id: instanceId, player_name: playerName });
      } else {
        this.send({ type: "join", player_name: playerName });
      }
    };
    this.ws.onclose = () => this.handlers.onDisconnected?.();
  }

  send(message) {
    this.ws.send(JSON.stringify(message));
  }

  sendMove(data) {
    this.send({ type: "move", data });
  }
}
```

### Available Handlers

Games provide handlers for message types they care about:

- `onWaiting(msg)` - Player added to matchmaking queue
- `onMatched(msg)` - Opponent found, game starting
- `onRejoined(msg)` - Successfully rejoined existing game
- `onGameState(data)` - Game state update (personalized per player)
- `onRoundResult(msg)` - Round ended (for multi-round games)
- `onNewRound(msg)` - New round starting
- `onGameOver(msg)` - Game ended
- `onOpponentDisconnected()` - Opponent's connection dropped
- `onOpponentReconnected()` - Opponent reconnected
- `onError(msg)` - Error occurred
- `onDisconnected()` - Own connection dropped

Each game's HTML template initializes this with game-specific handlers:

```javascript
const client = new GameClient("rps", {
  onWaiting: (msg) => showWaitingScreen(msg.message),
  onMatched: (msg) => initializeGame(msg.opponent_name),
  onGameState: (state) => renderRPSState(state),
  onGameOver: (msg) => showResults(msg.winner, msg.reason),
});

document.getElementById("join-form").onsubmit = (e) => {
  e.preventDefault();
  client.connect(document.getElementById("name-input").value);
};
```

## Shared UI Utilities

`game-utils.js` provides common UI functions:

```javascript
function showWaitingScreen(container, message) { ... }
function showResults(container, winner, playerName, onRematch) { ... }
function showOpponentDisconnected(container, onWait, onLeave) { ... }
function showError(container, message) { ... }
```

## Game Instance Lifecycle

1. Player A visits `/game/rps`, enters name, clicks Play
2. Client opens WebSocket to `/ws/game/rps`, sends `{type: "join", player_name: "A"}`
3. Server creates/finds waiting queue for RPS, adds player A
4. Server sends `{type: "waiting"}` to A
5. Player B does the same
6. Server matches A and B, creates game instance with UUID
7. Server sends `{type: "matched", instance_id: "xxx", opponent_name: "..."}` to both
8. Both clients update URL to `/game/rps/xxx`
9. Game proceeds with `move` and `game_state` messages
10. On disconnect: mark player disconnected, notify opponent, start 60-second timeout
11. On reconnect: player re-sends `join` with same name, server matches to existing instance
12. On timeout or game over + both leave: delete game instance from memory

## Reconnection Handling

When a player disconnects and reconnects:

1. Client checks URL for instance_id (e.g., `/game/rps/abc123`)
2. If instance_id present, client sends `{type: "rejoin", instance_id: "abc123", player_name: "A"}`
3. Server checks if instance exists and has a disconnected player with that name
4. If match: restore player to game, send `rejoined` message, send current `game_state`, notify opponent with `opponent_reconnected`
5. If no match: treat as new player, enter matchmaking queue with normal `join` flow

The template extracts instance_id from the URL path:
```javascript
const pathParts = window.location.pathname.split('/');
const instanceId = pathParts.length > 3 ? pathParts[3] : null;
```

## Rock Paper Scissors Specifics

### Game State

```python
state = {
    "phase": "choosing" | "reveal",
    "choices": {"player_a_name": "rock" | None, "player_b_name": None},
    "round": 1,
    "scores": {"player_a_name": 0, "player_b_name": 0}
}
```

### Move Data

```json
{ "choice": "rock" | "paper" | "scissors" }
```

### Client Game State

The `get_game_state()` method returns personalized state:

```python
{
    "phase": "choosing",
    "round": 1,
    "scores": {"Alice": 2, "Bob": 1},
    "choices": {
        "Alice": "rock",       # Own choice visible
        "Bob": "chosen"        # Opponent's choice hidden (or null if not yet chosen)
    },
    "my_name": "Alice",
    "opponent_name": "Bob",
    "opponent_connected": True
}
```

During reveal phase, both actual choices are shown.

### Game Flow

1. Both players in "choosing" phase
2. Player submits choice, server records it (hidden from opponent)
3. Server sends `game_state` with own choice visible, opponent's as `"chosen"` or `null`
4. When both chosen, phase becomes "reveal"
5. Server sends `game_state` with both choices visible
6. Server sends `round_result` with winner, reason, choices, and updated scores
7. After 3-second delay, server sends `new_round` and resets to choosing phase
8. Rounds continue indefinitely - no ultimate winner, just running score

### Client State Display

- Choosing phase: Show three buttons (rock/paper/scissors), disable after selection
- Waiting: Show "Waiting for opponent..." or "Both chosen! Revealing..."
- Reveal phase: Show both choices with animation, display result message
- After 3 seconds: Auto-advance to next round

## CSS Conventions

- Use CSS custom properties for theming in `common.css`
- Each game can have a `games/{game_id}.css` if needed
- Prefer CSS animations/transitions over JavaScript animation
- Mobile-first, should work well on phones

## Development Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python main.py
```

## Production Deployment

**Server:** DigitalOcean droplet at `138.197.71.191`

**Domain:** `parlor.marstol.com` (A record pointing to droplet IP)

**Paths:**

- Repository: `/root/parlor`
- Virtual environment: `/root/parlor/venv`

**Port:** 8500 (configured via `.env` file)

**Running the app:**

```bash
cd /root/parlor
source venv/bin/activate
python main.py
```

**Nginx:** Config at `/etc/nginx/sites-available/parlor`

- HTTP redirects to HTTPS
- HTTPS proxies to `127.0.0.1:8500`
- WebSocket location `/ws/` with upgrade headers and extended timeout

**SSL:** Let's Encrypt certificate via certbot

- Certificate: `/etc/letsencrypt/live/parlor.marstol.com/fullchain.pem`
- Key: `/etc/letsencrypt/live/parlor.marstol.com/privkey.pem`

**Systemd service:** `/etc/systemd/system/parlor.service`

```ini
[Unit]
Description=Parlor Game Platform
After=network.target

[Service]
User=root
WorkingDirectory=/root/parlor
ExecStart=/root/parlor/venv/bin/python main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Service commands:**

```bash
sudo systemctl status parlor    # Check status
sudo systemctl restart parlor   # Restart after code changes
sudo systemctl stop parlor      # Stop
sudo systemctl start parlor     # Start
journalctl -u parlor -f         # Tail logs
```

## Adding a New Multiplayer Game

### Backend (Python)

1. Create `games/{game_id}.py` with a class inheriting from `BaseGame`
2. Set class attributes: `game_id` (URL slug) and `display_name`
3. Implement required methods:
   - `handle_move(player, data)` - Process moves, update state, broadcast updates
   - `get_game_state(for_player)` - Return personalized state dict
   - `reset_for_rematch()` - Reset state for new round/game
4. Register in `main.py`:
   ```python
   GAME_REGISTRY: dict[str, type[BaseGame]] = {
       "rps": RockPaperScissors,
       "yourgame": YourGame,  # Add here
   }
   ```

### Frontend (HTML/JS)

1. Create `templates/games/{game_id}.html` extending `base.html`
2. Include join screen with name input form
3. Initialize `GameClient` with game-specific handlers
4. Implement UI rendering based on game state

### Index Page

Add to `templates/index.html` game grid (automatic if using registry, but may want custom icon/description).

### Optional

- Add `static/css/games/{game_id}.css` for game-specific styles
- Add game-specific emoji/icon to index page

The platform handles: matchmaking, WebSocket lifecycle, disconnection/reconnection, URL management. Your game only handles game logic.

## Single-Player Games

Single-player games are for same-device play (e.g., couch co-op word games). They use a completely separate, simpler architecture with no WebSocket complexity.

### Solo Game Structure

```
/
├── templates/
│   └── solo/
│       └── {game_id}.html      # Self-contained game page
└── static/
    ├── css/
    │   └── solo/
    │       └── {game_id}.css   # Optional game-specific styles
    └── js/
        └── solo/
            └── {game_id}.js    # Game logic (can be inline in template if simple)
```

### Architecture

- **No WebSocket** - all game state lives in the browser
- **No backend game logic** - Python only serves the static page
- **No persistence** - refresh starts over (unless localStorage is added per-game)
- **SSR template** - server renders the HTML, then it's purely client-side

### Adding a Solo Game

1. Create `templates/solo/{game_id}.html` extending base template
2. Include all game logic inline or in `static/js/solo/{game_id}.js`
3. Register route in `main.py` (simple template render, no game class needed)
4. Add to index page under single-player section

### Example Solo Game Template

```html
{% extends "base.html" %} {% block content %}
<div id="game-container">
  <!-- Game UI here -->
</div>

<script>
  // All game logic runs client-side
  const state = {
    /* ... */
  };

  function init() {
    /* ... */
  }
  function handleInput() {
    /* ... */
  }
  function render() {
    /* ... */
  }

  init();
</script>
{% endblock %}
```

Solo games can still use `game-utils.js` for common UI patterns like results screens.

## Error Handling

- WebSocket errors: Log and notify opponent if applicable
- Invalid moves: Send `{type: "error", message: "..."}` to the offending client
- Game not found: Return 404 for HTTP, send error and close for WebSocket
- All exceptions: Catch at top level, log, send generic error to client

## Security Notes

- No authentication - this is for personal use between two known users
- No input sanitization beyond basic type checking - not exposed to public
- No rate limiting - trusted users only
- If deploying publicly in future: add auth, sanitize player names, rate limit connections
