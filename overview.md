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
│   │   ├── games/              # Multiplayer game styles
│   │   └── solo/               # Single-player game styles
│   └── js/
│       ├── game-client.js      # WebSocket wrapper and game lifecycle (multiplayer)
│       ├── game-utils.js       # Shared UI utilities
│       └── solo/               # Single-player game scripts
├── templates/
│   ├── base.html               # Base template with common head/scripts
│   ├── index.html              # Game selection landing page
│   ├── games/                  # Multiplayer game templates
│   │   └── rps.html
│   └── solo/                   # Single-player game templates
└── games/
    ├── base.py                 # Abstract base class for multiplayer games
    └── rps.py                  # Rock Paper Scissors implementation
```

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
{"type": "join", "player_name": "Ziggy"}
```
Sent when player connects and enters their name.

```json
{"type": "move", "data": {...}}
```
Game-specific move data. Structure depends on the game.

```json
{"type": "rematch_request"}
```
Player wants to play again.

```json
{"type": "rematch_accept"}
```
Player accepts rematch request.

### Server → Client Messages

```json
{"type": "waiting", "message": "Waiting for opponent..."}
```
Player is in queue, no opponent yet.

```json
{"type": "matched", "instance_id": "abc123", "opponent_name": "Partner"}
```
Opponent found, game starting. Client should update URL.

```json
{"type": "game_state", "data": {...}}
```
Game-specific state update. Structure depends on the game.

```json
{"type": "game_over", "winner": "Ziggy", "reason": "..."}
```
Game ended. Winner is null for draws.

```json
{"type": "opponent_disconnected"}
```
Opponent's WebSocket closed. Game paused pending reconnection.

```json
{"type": "opponent_reconnected"}
```
Opponent reconnected. Game resumes.

```json
{"type": "rematch_requested", "by": "Partner"}
```
Opponent wants a rematch.

```json
{"type": "rematch_starting"}
```
Both players agreed, new game beginning.

```json
{"type": "error", "message": "..."}
```
Something went wrong.

## Game Implementation Contract

Each game is a Python class inheriting from `BaseGame`:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class Player:
    name: str
    websocket: WebSocket
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
        """Return game state from this player's perspective (hide opponent's hidden info)."""
        pass
    
    @abstractmethod
    def is_game_over(self) -> bool:
        """Check if game has ended."""
        pass
    
    @abstractmethod
    def get_winner(self) -> Player | None:
        """Return winner or None for draw. Only valid if is_game_over()."""
        pass
    
    async def broadcast(self, message: dict, exclude: Player = None) -> None:
        """Send message to all connected players except excluded one."""
        for player in self.players:
            if player.connected and player != exclude:
                await player.websocket.send_json(message)
    
    async def send_to(self, player: Player, message: dict) -> None:
        """Send message to specific player."""
        if player.connected:
            await player.websocket.send_json(message)
    
    def reset_for_rematch(self) -> None:
        """Reset game state for a new round. Override if needed."""
        self.state = {}
```

## Frontend Game Client

`game-client.js` provides a `GameClient` class that handles WebSocket lifecycle:

```javascript
class GameClient {
    constructor(gameId, handlers) {
        this.gameId = gameId;
        this.handlers = handlers; // {onWaiting, onMatched, onGameState, onGameOver, ...}
        this.ws = null;
        this.instanceId = null;
        this.playerName = null;
    }
    
    connect(playerName) {
        this.playerName = playerName;
        const wsUrl = `ws://${window.location.host}/ws/game/${this.gameId}`;
        this.ws = new WebSocket(wsUrl);
        this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
        this.ws.onopen = () => this.send({type: 'join', player_name: playerName});
        this.ws.onclose = () => this.handlers.onDisconnected?.();
    }
    
    send(message) {
        this.ws.send(JSON.stringify(message));
    }
    
    sendMove(data) {
        this.send({type: 'move', data});
    }
    
    handleMessage(msg) {
        switch(msg.type) {
            case 'waiting':
                this.handlers.onWaiting?.(msg);
                break;
            case 'matched':
                this.instanceId = msg.instance_id;
                history.pushState({}, '', `/game/${this.gameId}/${msg.instance_id}`);
                this.handlers.onMatched?.(msg);
                break;
            case 'game_state':
                this.handlers.onGameState?.(msg.data);
                break;
            case 'game_over':
                this.handlers.onGameOver?.(msg);
                break;
            // ... other message types
        }
    }
}
```

Each game's HTML template initializes this with game-specific handlers:

```javascript
const client = new GameClient('rps', {
    onWaiting: (msg) => showWaitingScreen(msg.message),
    onMatched: (msg) => initializeGame(msg.opponent_name),
    onGameState: (state) => renderRPSState(state),
    onGameOver: (msg) => showResults(msg.winner, msg.reason)
});

document.getElementById('join-form').onsubmit = (e) => {
    e.preventDefault();
    client.connect(document.getElementById('name-input').value);
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

1. Client reconnects WebSocket, sends `{type: "join", player_name: "A"}` with same name
2. If URL contains instance_id (`/game/rps/xxx`), also send `{type: "rejoin", instance_id: "xxx"}`
3. Server checks if instance exists and has a disconnected player with that name
4. If match: restore player to game, send current `game_state`, notify opponent of reconnection
5. If no match: treat as new player, enter matchmaking queue

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
{"choice": "rock" | "paper" | "scissors"}
```

### Game Flow

1. Both players in "choosing" phase
2. Player submits choice, server records it (hidden from opponent)
3. Server sends `game_state` with own choice visible, opponent's as `null`
4. When both chosen, phase becomes "reveal"
5. Server sends `game_state` with both choices visible
6. After brief delay, server determines winner, sends `game_over` or advances round
7. First to 3 wins (best of 5)

### Client State Display

- Choosing phase: Show three buttons (rock/paper/scissors), disable after selection
- Reveal phase: Show both choices with animation, then result
- Between rounds: Show scores, brief countdown, then reset to choosing

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
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run with specific host for LAN testing
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Adding a New Multiplayer Game

1. Create `games/{game_id}.py` implementing `BaseGame`
2. Create `templates/games/{game_id}.html` with game-specific UI
3. Register game in `main.py` game registry
4. Add game to index page game list
5. Optionally add `static/css/games/{game_id}.css` for custom styles

The game implementation handles only game logic. Matchmaking, WebSocket management, disconnection handling, and rematch flow are all provided by the platform.

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
{% extends "base.html" %}
{% block content %}
<div id="game-container">
    <!-- Game UI here -->
</div>

<script>
    // All game logic runs client-side
    const state = { /* ... */ };
    
    function init() { /* ... */ }
    function handleInput() { /* ... */ }
    function render() { /* ... */ }
    
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
