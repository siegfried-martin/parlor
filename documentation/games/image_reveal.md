# Image Reveal Game - Design & Implementation Document

## Overview

**Game ID:** `image-reveal`  
**Display Name:** "Image Reveal"  
**Players:** 2 (one Picker, one Guesser)  
**Type:** Multiplayer WebSocket game

A guessing game where one player (the Picker) uploads an image hidden behind a grid of tiles. The Picker gives hints while tiles are progressively revealed. The Guesser tries to identify the image in as few rounds as possible.

---

## Game Rules

1. **Picker** uploads an image and writes an initial hint
2. The image is covered by an 8×8 grid of opaque tiles (64 total)
3. Round 1 begins: ~11 random tiles are revealed along with the hint
4. **Guesser** submits a guess
5. **Picker** judges the guess as Correct or Incorrect
6. If **Incorrect**: Picker writes another hint, ~11 more tiles reveal, Guesser guesses again
7. If **Correct**: Round ends, score recorded (number of guessing rounds)
8. Both players view the fully revealed image until either clicks "Next Round"
9. New round begins - roles may swap based on Picker's setting
10. Either player can "Give Up" at any time to reveal the full image and end the round

**Reveal Rate:** ~11 tiles per hint (64 tiles ÷ 6 rounds ≈ 10.67 tiles/round)

---

## Files to Create/Modify

### New Files

| File                                | Purpose              |
| ----------------------------------- | -------------------- |
| `games/image_reveal.py`             | Game logic class     |
| `templates/games/image-reveal.html` | Game UI template     |
| `static/css/games/image-reveal.css` | Game-specific styles |

### Files to Modify

| File                   | Change                               |
| ---------------------- | ------------------------------------ |
| `main.py`              | Register game in `GAME_REGISTRY`     |
| `templates/index.html` | Add game card to multiplayer section |

---

## Backend Implementation

### File: `games/image_reveal.py`

```python
import random
from games.base import BaseGame, Player

class ImageReveal(BaseGame):
    game_id = "image-reveal"
    display_name = "Image Reveal"

    GRID_SIZE = 8  # 8x8 = 64 tiles
    TILES_PER_REVEAL = 11  # ~6 rounds to full reveal

    def __init__(self, instance_id: str):
        super().__init__(instance_id)
        self.state = {
            "phase": "waiting_for_image",
            "image_data": None,  # base64 data URL
            "revealed_tiles": [],  # list of (row, col) tuples
            "current_hint": None,
            "current_guess": None,
            "hint_round": 0,  # number of hints given (reveals done)
            "picker_index": 0,  # index in self.players of current picker
            "swap_roles": True,  # whether to swap roles each game round
            "game_round": 1,  # which game round (image) we're on
            "scores": {},  # {player_name: [round1_hints, round2_hints, ...]}
            "chat": [],  # [{from: "picker"|"guesser", text: "..."}]
            "gave_up": None,  # player name who gave up, if any
        }

    def _get_picker(self) -> Player:
        return self.players[self.state["picker_index"]]

    def _get_guesser(self) -> Player:
        return self.players[1 - self.state["picker_index"]]

    def _is_picker(self, player: Player) -> bool:
        return player == self._get_picker()

    def _reveal_tiles(self) -> list[tuple[int, int]]:
        """Reveal TILES_PER_REVEAL random unrevealed tiles."""
        all_tiles = [
            (r, c)
            for r in range(self.GRID_SIZE)
            for c in range(self.GRID_SIZE)
        ]
        unrevealed = [t for t in all_tiles if t not in self.state["revealed_tiles"]]

        to_reveal = min(self.TILES_PER_REVEAL, len(unrevealed))
        newly_revealed = random.sample(unrevealed, to_reveal)
        self.state["revealed_tiles"].extend(newly_revealed)

        return newly_revealed

    def _reveal_all_tiles(self) -> None:
        """Reveal all remaining tiles."""
        self.state["revealed_tiles"] = [
            (r, c)
            for r in range(self.GRID_SIZE)
            for c in range(self.GRID_SIZE)
        ]

    async def handle_move(self, player: Player, data: dict) -> None:
        """Process player actions."""
        action = data.get("action")

        if action == "upload_image":
            await self._handle_upload_image(player, data)
        elif action == "submit_hint":
            await self._handle_submit_hint(player, data)
        elif action == "submit_guess":
            await self._handle_submit_guess(player, data)
        elif action == "judge_guess":
            await self._handle_judge_guess(player, data)
        elif action == "chat":
            await self._handle_chat(player, data)
        elif action == "give_up":
            await self._handle_give_up(player)
        elif action == "next_round":
            await self._handle_next_round(player, data)
        elif action == "set_swap_roles":
            await self._handle_set_swap_roles(player, data)
        else:
            await self.send_to(player, {
                "type": "error",
                "message": f"Unknown action: {action}"
            })

    async def _handle_upload_image(self, player: Player, data: dict) -> None:
        """Picker uploads an image."""
        if not self._is_picker(player):
            await self.send_to(player, {
                "type": "error",
                "message": "Only the picker can upload an image"
            })
            return

        if self.state["phase"] != "waiting_for_image":
            await self.send_to(player, {
                "type": "error",
                "message": "Cannot upload image in current phase"
            })
            return

        image_data = data.get("image_data")
        if not image_data or not image_data.startswith("data:image/"):
            await self.send_to(player, {
                "type": "error",
                "message": "Invalid image data"
            })
            return

        self.state["image_data"] = image_data
        self.state["phase"] = "writing_hint"

        await self.broadcast_game_state()

    async def _handle_submit_hint(self, player: Player, data: dict) -> None:
        """Picker submits a hint, triggering tile reveal."""
        if not self._is_picker(player):
            await self.send_to(player, {
                "type": "error",
                "message": "Only the picker can submit hints"
            })
            return

        if self.state["phase"] != "writing_hint":
            await self.send_to(player, {
                "type": "error",
                "message": "Cannot submit hint in current phase"
            })
            return

        hint = data.get("hint", "").strip()
        if not hint:
            await self.send_to(player, {
                "type": "error",
                "message": "Hint cannot be empty"
            })
            return

        self.state["current_hint"] = hint
        self.state["hint_round"] += 1
        self._reveal_tiles()
        self.state["phase"] = "guessing"
        self.state["current_guess"] = None

        # Add hint to chat
        self.state["chat"].append({
            "from": "picker",
            "text": f"Hint #{self.state['hint_round']}: {hint}",
            "is_hint": True
        })

        await self.broadcast_game_state()

    async def _handle_submit_guess(self, player: Player, data: dict) -> None:
        """Guesser submits a guess."""
        if self._is_picker(player):
            await self.send_to(player, {
                "type": "error",
                "message": "Only the guesser can submit guesses"
            })
            return

        if self.state["phase"] != "guessing":
            await self.send_to(player, {
                "type": "error",
                "message": "Cannot submit guess in current phase"
            })
            return

        guess = data.get("guess", "").strip()
        if not guess:
            await self.send_to(player, {
                "type": "error",
                "message": "Guess cannot be empty"
            })
            return

        self.state["current_guess"] = guess
        self.state["phase"] = "judging"

        # Add guess to chat
        self.state["chat"].append({
            "from": "guesser",
            "text": f"Guess: {guess}",
            "is_guess": True
        })

        await self.broadcast_game_state()

    async def _handle_judge_guess(self, player: Player, data: dict) -> None:
        """Picker judges if guess is correct."""
        if not self._is_picker(player):
            await self.send_to(player, {
                "type": "error",
                "message": "Only the picker can judge guesses"
            })
            return

        if self.state["phase"] != "judging":
            await self.send_to(player, {
                "type": "error",
                "message": "No guess to judge"
            })
            return

        correct = data.get("correct", False)

        if correct:
            # Record score and reveal all
            guesser = self._get_guesser()
            if guesser.name not in self.state["scores"]:
                self.state["scores"][guesser.name] = []
            self.state["scores"][guesser.name].append(self.state["hint_round"])

            self._reveal_all_tiles()
            self.state["phase"] = "round_complete"

            self.state["chat"].append({
                "from": "system",
                "text": f"✓ Correct! Guessed in {self.state['hint_round']} round(s)",
                "is_system": True
            })

            await self.broadcast({
                "type": "round_result",
                "winner": guesser.name,
                "rounds_taken": self.state["hint_round"],
                "game_round": self.state["game_round"]
            })
        else:
            # Back to writing hint
            self.state["phase"] = "writing_hint"

            self.state["chat"].append({
                "from": "system",
                "text": "✗ Incorrect - try again!",
                "is_system": True
            })

        await self.broadcast_game_state()

    async def _handle_chat(self, player: Player, data: dict) -> None:
        """Handle chat messages."""
        text = data.get("text", "").strip()
        if not text:
            return

        role = "picker" if self._is_picker(player) else "guesser"
        self.state["chat"].append({
            "from": role,
            "text": text,
            "player_name": player.name
        })

        await self.broadcast_game_state()

    async def _handle_give_up(self, player: Player) -> None:
        """Either player can give up to reveal the image."""
        if self.state["phase"] in ["waiting_for_image", "round_complete"]:
            await self.send_to(player, {
                "type": "error",
                "message": "Cannot give up in current phase"
            })
            return

        self.state["gave_up"] = player.name
        self._reveal_all_tiles()
        self.state["phase"] = "round_complete"

        self.state["chat"].append({
            "from": "system",
            "text": f"{player.name} gave up - image revealed!",
            "is_system": True
        })

        await self.broadcast({
            "type": "round_result",
            "winner": None,
            "gave_up": player.name,
            "game_round": self.state["game_round"]
        })

        await self.broadcast_game_state()

    async def _handle_next_round(self, player: Player, data: dict) -> None:
        """Start the next round after viewing results."""
        if self.state["phase"] != "round_complete":
            await self.send_to(player, {
                "type": "error",
                "message": "Round is not complete"
            })
            return

        # Swap roles if enabled
        if self.state["swap_roles"]:
            self.state["picker_index"] = 1 - self.state["picker_index"]

        # Reset for new round
        self.state["phase"] = "waiting_for_image"
        self.state["image_data"] = None
        self.state["revealed_tiles"] = []
        self.state["current_hint"] = None
        self.state["current_guess"] = None
        self.state["hint_round"] = 0
        self.state["game_round"] += 1
        self.state["chat"] = []
        self.state["gave_up"] = None

        await self.broadcast({"type": "new_round", "round": self.state["game_round"]})
        await self.broadcast_game_state()

    async def _handle_set_swap_roles(self, player: Player, data: dict) -> None:
        """Picker can toggle role swapping."""
        if not self._is_picker(player):
            await self.send_to(player, {
                "type": "error",
                "message": "Only the picker can change this setting"
            })
            return

        self.state["swap_roles"] = bool(data.get("swap_roles", True))
        await self.broadcast_game_state()

    def get_game_state(self, for_player: Player) -> dict:
        """Return game state personalized for the player."""
        picker = self._get_picker()
        guesser = self._get_guesser()
        is_picker = self._is_picker(for_player)
        opponent = guesser if is_picker else picker

        return {
            "phase": self.state["phase"],
            "my_role": "picker" if is_picker else "guesser",
            "picker_name": picker.name,
            "guesser_name": guesser.name,
            "my_name": for_player.name,
            "opponent_name": opponent.name,
            "opponent_connected": opponent.connected,
            "image_data": self.state["image_data"],
            "revealed_tiles": self.state["revealed_tiles"],
            "grid_size": self.GRID_SIZE,
            "current_hint": self.state["current_hint"],
            "current_guess": self.state["current_guess"],
            "hint_round": self.state["hint_round"],
            "game_round": self.state["game_round"],
            "scores": self.state["scores"],
            "chat": self.state["chat"],
            "swap_roles": self.state["swap_roles"],
            "gave_up": self.state["gave_up"],
        }

    def reset_for_rematch(self) -> None:
        """Reset entire game state for rematch."""
        self.state = {
            "phase": "waiting_for_image",
            "image_data": None,
            "revealed_tiles": [],
            "current_hint": None,
            "current_guess": None,
            "hint_round": 0,
            "picker_index": 0,
            "swap_roles": True,
            "game_round": 1,
            "scores": {},
            "chat": [],
            "gave_up": None,
        }
```

---

## Game State Machine

```
                                    ┌─────────────────────┐
                                    │  waiting_for_image  │
                                    │   (Picker uploads)  │
                                    └──────────┬──────────┘
                                               │ upload_image
                                               ▼
                              ┌─────────────────────────────────┐
                              │          writing_hint           │◄────────┐
                              │    (Picker writes hint)         │         │
                              └──────────────┬──────────────────┘         │
                                             │ submit_hint                │
                                             │ (reveals tiles)            │
                                             ▼                            │
                              ┌─────────────────────────────────┐         │
                              │           guessing              │         │
                              │    (Guesser submits guess)      │         │
                              └──────────────┬──────────────────┘         │
                                             │ submit_guess               │
                                             ▼                            │
                              ┌─────────────────────────────────┐         │
                              │           judging               │         │
                              │   (Picker judges correct/not)   │         │
                              └───────┬─────────────────┬───────┘         │
                                      │                 │                 │
                         correct=true │                 │ correct=false   │
                                      ▼                 └─────────────────┘
                              ┌─────────────────────────────────┐
                              │        round_complete           │
                              │   (View image, click Next)      │
                              └──────────────┬──────────────────┘
                                             │ next_round
                                             │ (may swap roles)
                                             ▼
                                    Back to waiting_for_image

Note: give_up from writing_hint, guessing, or judging → round_complete
```

---

## WebSocket Messages

### Client → Server (Move Data)

**Upload Image (Picker only)**

```json
{
  "action": "upload_image",
  "image_data": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Submit Hint (Picker only)**

```json
{
  "action": "submit_hint",
  "hint": "Something found in a kitchen"
}
```

**Submit Guess (Guesser only)**

```json
{
  "action": "submit_guess",
  "guess": "A blender"
}
```

**Judge Guess (Picker only)**

```json
{
  "action": "judge_guess",
  "correct": true
}
```

**Chat Message (Either player)**

```json
{
  "action": "chat",
  "text": "Can you be more specific?"
}
```

**Give Up (Either player)**

```json
{
  "action": "give_up"
}
```

**Next Round (Either player, after round_complete)**

```json
{
  "action": "next_round"
}
```

**Set Role Swap (Picker only)**

```json
{
  "action": "set_swap_roles",
  "swap_roles": false
}
```

### Server → Client

**Game State** (standard `game_state` message with this data):

```json
{
  "phase": "guessing",
  "my_role": "guesser",
  "picker_name": "Alice",
  "guesser_name": "Bob",
  "my_name": "Bob",
  "opponent_name": "Alice",
  "opponent_connected": true,
  "image_data": "data:image/jpeg;base64,...",
  "revealed_tiles": [
    [0, 1],
    [0, 3],
    [2, 5]
  ],
  "grid_size": 8,
  "current_hint": "Something in a kitchen",
  "current_guess": null,
  "hint_round": 2,
  "game_round": 1,
  "scores": { "Bob": [3], "Alice": [5, 2] },
  "chat": [
    { "from": "picker", "text": "Hint #1: Kitchen item", "is_hint": true },
    { "from": "guesser", "text": "Guess: Toaster", "is_guess": true },
    { "from": "system", "text": "✗ Incorrect - try again!", "is_system": true }
  ],
  "swap_roles": true,
  "gave_up": null
}
```

**Round Result**

```json
{
  "type": "round_result",
  "winner": "Bob",
  "rounds_taken": 3,
  "game_round": 1
}
```

Or if gave up:

```json
{
  "type": "round_result",
  "winner": null,
  "gave_up": "Alice",
  "game_round": 1
}
```

---

## Frontend Implementation

### File: `templates/games/image-reveal.html`

```html
{% extends "base.html" %} {% block title %}Image Reveal - Parlor{% endblock %}
{% block head %}
<link rel="stylesheet" href="/static/css/games/image-reveal.css" />
{% endblock %} {% block content %}
<div id="game-container" class="image-reveal-game">
  <!-- Join Screen -->
  <div id="join-screen" class="screen">
    <h1>🖼️ Image Reveal</h1>
    <p class="game-description">
      One player picks an image and gives hints while it's slowly revealed. The
      other player tries to guess what it is!
    </p>
    <form id="join-form">
      <input
        type="text"
        id="name-input"
        placeholder="Your name"
        maxlength="20"
        required
      />
      <button type="submit">Play</button>
    </form>
  </div>

  <!-- Waiting Screen -->
  <div id="waiting-screen" class="screen hidden">
    <div class="waiting-spinner"></div>
    <p id="waiting-message">Waiting for opponent...</p>
  </div>

  <!-- Main Game Screen -->
  <div id="game-screen" class="screen hidden">
    <!-- Header with scores and roles -->
    <header class="game-header">
      <div class="player-info picker-info">
        <span class="role-badge picker">🎨 Picker</span>
        <span class="player-name" id="picker-name"></span>
      </div>
      <div class="round-info">
        <span id="game-round">Round 1</span>
      </div>
      <div class="player-info guesser-info">
        <span class="role-badge guesser">🔍 Guesser</span>
        <span class="player-name" id="guesser-name"></span>
      </div>
    </header>

    <!-- Image Upload (Picker, waiting_for_image phase) -->
    <div id="upload-section" class="section hidden">
      <h2>Choose an Image</h2>
      <p>Select an image for your opponent to guess</p>
      <div class="upload-area" id="upload-area">
        <input
          type="file"
          id="image-input"
          accept="image/*"
          capture="environment"
        />
        <label for="image-input">
          <span class="upload-icon">📷</span>
          <span>Tap to upload image</span>
        </label>
      </div>
      <img id="image-preview" class="hidden" />
      <button id="confirm-image-btn" class="hidden">Use This Image</button>

      <div class="settings-toggle">
        <label>
          <input type="checkbox" id="swap-roles-toggle" checked />
          Swap roles each round
        </label>
      </div>
    </div>

    <!-- Waiting for Image (Guesser) -->
    <div id="waiting-for-image-section" class="section hidden">
      <div class="waiting-spinner"></div>
      <p>
        Waiting for <span id="picker-name-waiting"></span> to choose an image...
      </p>
    </div>

    <!-- Game Board -->
    <div id="board-section" class="section hidden">
      <div class="image-container">
        <canvas id="game-canvas"></canvas>
      </div>

      <div class="hint-display" id="hint-display">
        <span class="hint-label">Hint #<span id="hint-number">1</span>:</span>
        <span id="hint-text"></span>
      </div>
    </div>

    <!-- Hint Input (Picker, writing_hint phase) -->
    <div id="hint-input-section" class="section hidden">
      <form id="hint-form">
        <input
          type="text"
          id="hint-input"
          placeholder="Write a hint..."
          maxlength="200"
          required
        />
        <button type="submit">Send Hint</button>
      </form>
    </div>

    <!-- Guess Input (Guesser, guessing phase) -->
    <div id="guess-input-section" class="section hidden">
      <form id="guess-form">
        <input
          type="text"
          id="guess-input"
          placeholder="What is it?"
          maxlength="100"
          required
        />
        <button type="submit">Guess</button>
      </form>
    </div>

    <!-- Judging Section (Picker, judging phase) -->
    <div id="judging-section" class="section hidden">
      <p class="guess-display">
        They guessed: <strong id="guess-display-text"></strong>
      </p>
      <div class="judge-buttons">
        <button id="correct-btn" class="correct-btn">✓ Correct!</button>
        <button id="incorrect-btn" class="incorrect-btn">✗ Incorrect</button>
      </div>
    </div>

    <!-- Waiting for judgment (Guesser) -->
    <div id="waiting-judgment-section" class="section hidden">
      <p>
        Waiting for <span id="picker-name-judging"></span> to judge your
        guess...
      </p>
    </div>

    <!-- Round Complete Section -->
    <div id="round-complete-section" class="section hidden">
      <div id="result-message"></div>
      <button id="next-round-btn">Next Round →</button>
    </div>

    <!-- Chat Panel -->
    <div id="chat-panel">
      <div id="chat-messages"></div>
      <form id="chat-form">
        <input
          type="text"
          id="chat-input"
          placeholder="Send a message..."
          maxlength="200"
        />
        <button type="submit">Send</button>
      </form>
    </div>

    <!-- Give Up Button (visible during active play) -->
    <button id="give-up-btn" class="give-up-btn hidden">Give Up</button>
  </div>

  <!-- Disconnection Overlay -->
  <div id="disconnect-overlay" class="overlay hidden">
    <div class="overlay-content">
      <p>Opponent disconnected</p>
      <p class="subtext">Waiting for them to reconnect...</p>
    </div>
  </div>
</div>

<script src="/static/js/game-client.js"></script>
<script src="/static/js/game-utils.js"></script>
<script>
  (function () {
    // DOM Elements
    const screens = {
      join: document.getElementById("join-screen"),
      waiting: document.getElementById("waiting-screen"),
      game: document.getElementById("game-screen"),
    };

    const elements = {
      joinForm: document.getElementById("join-form"),
      nameInput: document.getElementById("name-input"),
      waitingMessage: document.getElementById("waiting-message"),

      // Header
      pickerName: document.getElementById("picker-name"),
      guesserName: document.getElementById("guesser-name"),
      gameRound: document.getElementById("game-round"),

      // Upload
      uploadSection: document.getElementById("upload-section"),
      uploadArea: document.getElementById("upload-area"),
      imageInput: document.getElementById("image-input"),
      imagePreview: document.getElementById("image-preview"),
      confirmImageBtn: document.getElementById("confirm-image-btn"),
      swapRolesToggle: document.getElementById("swap-roles-toggle"),

      // Waiting for image
      waitingForImageSection: document.getElementById(
        "waiting-for-image-section",
      ),
      pickerNameWaiting: document.getElementById("picker-name-waiting"),

      // Board
      boardSection: document.getElementById("board-section"),
      canvas: document.getElementById("game-canvas"),
      hintDisplay: document.getElementById("hint-display"),
      hintNumber: document.getElementById("hint-number"),
      hintText: document.getElementById("hint-text"),

      // Hint input
      hintInputSection: document.getElementById("hint-input-section"),
      hintForm: document.getElementById("hint-form"),
      hintInput: document.getElementById("hint-input"),

      // Guess input
      guessInputSection: document.getElementById("guess-input-section"),
      guessForm: document.getElementById("guess-form"),
      guessInput: document.getElementById("guess-input"),

      // Judging
      judgingSection: document.getElementById("judging-section"),
      guessDisplayText: document.getElementById("guess-display-text"),
      correctBtn: document.getElementById("correct-btn"),
      incorrectBtn: document.getElementById("incorrect-btn"),

      // Waiting judgment
      waitingJudgmentSection: document.getElementById(
        "waiting-judgment-section",
      ),
      pickerNameJudging: document.getElementById("picker-name-judging"),

      // Round complete
      roundCompleteSection: document.getElementById("round-complete-section"),
      resultMessage: document.getElementById("result-message"),
      nextRoundBtn: document.getElementById("next-round-btn"),

      // Chat
      chatPanel: document.getElementById("chat-panel"),
      chatMessages: document.getElementById("chat-messages"),
      chatForm: document.getElementById("chat-form"),
      chatInput: document.getElementById("chat-input"),

      // Other
      giveUpBtn: document.getElementById("give-up-btn"),
      disconnectOverlay: document.getElementById("disconnect-overlay"),
    };

    // State
    let currentState = null;
    let loadedImage = null;
    let pendingImageData = null;

    // Canvas setup
    const ctx = elements.canvas.getContext("2d");
    const CANVAS_SIZE = 320; // Will be responsive via CSS
    elements.canvas.width = CANVAS_SIZE;
    elements.canvas.height = CANVAS_SIZE;

    // Initialize game client
    const pathParts = window.location.pathname.split("/");
    const instanceId = pathParts.length > 3 ? pathParts[3] : null;

    const client = new GameClient("image-reveal", {
      onWaiting: (msg) => {
        showScreen("waiting");
        elements.waitingMessage.textContent =
          msg.message || "Waiting for opponent...";
      },

      onMatched: (msg) => {
        showScreen("game");
        updateURL(msg.instance_id);
      },

      onRejoined: (msg) => {
        showScreen("game");
      },

      onGameState: (data) => {
        currentState = data;
        renderGameState(data);
      },

      onRoundResult: (msg) => {
        // Handled in game state render
      },

      onNewRound: (msg) => {
        elements.hintInput.value = "";
        elements.guessInput.value = "";
        pendingImageData = null;
        loadedImage = null;
      },

      onOpponentDisconnected: () => {
        elements.disconnectOverlay.classList.remove("hidden");
      },

      onOpponentReconnected: () => {
        elements.disconnectOverlay.classList.add("hidden");
      },

      onError: (msg) => {
        alert(msg.message || "An error occurred");
      },

      onDisconnected: () => {
        showScreen("join");
        alert("Connection lost. Please rejoin.");
      },
    });

    // Screen management
    function showScreen(name) {
      Object.values(screens).forEach((s) => s.classList.add("hidden"));
      screens[name].classList.remove("hidden");
    }

    function updateURL(newInstanceId) {
      const newUrl = `/game/image-reveal/${newInstanceId}`;
      history.pushState({}, "", newUrl);
    }

    // Hide all game sections
    function hideAllSections() {
      const sections = [
        elements.uploadSection,
        elements.waitingForImageSection,
        elements.boardSection,
        elements.hintInputSection,
        elements.guessInputSection,
        elements.judgingSection,
        elements.waitingJudgmentSection,
        elements.roundCompleteSection,
      ];
      sections.forEach((s) => s.classList.add("hidden"));
      elements.giveUpBtn.classList.add("hidden");
    }

    // Render game state
    function renderGameState(state) {
      // Update header
      elements.pickerName.textContent = state.picker_name;
      elements.guesserName.textContent = state.guesser_name;
      elements.gameRound.textContent = `Round ${state.game_round}`;

      // Highlight current player's role
      document
        .querySelectorAll(".player-info")
        .forEach((el) => el.classList.remove("current-player"));
      if (state.my_role === "picker") {
        document.querySelector(".picker-info").classList.add("current-player");
      } else {
        document.querySelector(".guesser-info").classList.add("current-player");
      }

      // Update swap roles toggle
      elements.swapRolesToggle.checked = state.swap_roles;

      hideAllSections();

      const isPicker = state.my_role === "picker";
      const phase = state.phase;

      // Phase-specific rendering
      if (phase === "waiting_for_image") {
        if (isPicker) {
          elements.uploadSection.classList.remove("hidden");
        } else {
          elements.waitingForImageSection.classList.remove("hidden");
          elements.pickerNameWaiting.textContent = state.picker_name;
        }
      } else if (phase === "writing_hint") {
        elements.boardSection.classList.remove("hidden");
        renderCanvas(state);
        if (isPicker) {
          elements.hintInputSection.classList.remove("hidden");
          elements.giveUpBtn.classList.remove("hidden");
        } else {
          elements.giveUpBtn.classList.remove("hidden");
        }
        updateHintDisplay(state);
      } else if (phase === "guessing") {
        elements.boardSection.classList.remove("hidden");
        renderCanvas(state);
        updateHintDisplay(state);
        if (isPicker) {
          elements.giveUpBtn.classList.remove("hidden");
        } else {
          elements.guessInputSection.classList.remove("hidden");
          elements.giveUpBtn.classList.remove("hidden");
        }
      } else if (phase === "judging") {
        elements.boardSection.classList.remove("hidden");
        renderCanvas(state);
        updateHintDisplay(state);
        if (isPicker) {
          elements.judgingSection.classList.remove("hidden");
          elements.guessDisplayText.textContent = state.current_guess;
        } else {
          elements.waitingJudgmentSection.classList.remove("hidden");
          elements.pickerNameJudging.textContent = state.picker_name;
        }
        elements.giveUpBtn.classList.remove("hidden");
      } else if (phase === "round_complete") {
        elements.boardSection.classList.remove("hidden");
        renderCanvas(state);
        elements.roundCompleteSection.classList.remove("hidden");

        let resultText = "";
        if (state.gave_up) {
          resultText = `${state.gave_up} gave up!`;
        } else {
          resultText = `🎉 ${state.guesser_name} guessed it in ${state.hint_round} round(s)!`;
        }
        elements.resultMessage.innerHTML = resultText;
      }

      // Update chat
      renderChat(state.chat);

      // Show/hide chat based on phase
      if (phase === "waiting_for_image") {
        elements.chatPanel.classList.add("hidden");
      } else {
        elements.chatPanel.classList.remove("hidden");
      }
    }

    function updateHintDisplay(state) {
      if (state.current_hint) {
        elements.hintDisplay.classList.remove("hidden");
        elements.hintNumber.textContent = state.hint_round;
        elements.hintText.textContent = state.current_hint;
      } else {
        elements.hintDisplay.classList.add("hidden");
      }
    }

    // Canvas rendering
    function renderCanvas(state) {
      if (!state.image_data) return;

      const gridSize = state.grid_size;
      const tileSize = CANVAS_SIZE / gridSize;

      // Load image if needed
      if (!loadedImage || loadedImage.src !== state.image_data) {
        loadedImage = new Image();
        loadedImage.onload = () => drawCanvas(state, gridSize, tileSize);
        loadedImage.src = state.image_data;
      } else {
        drawCanvas(state, gridSize, tileSize);
      }
    }

    function drawCanvas(state, gridSize, tileSize) {
      // Draw image scaled to canvas
      ctx.drawImage(loadedImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Create set of revealed tiles for fast lookup
      const revealedSet = new Set(
        state.revealed_tiles.map(([r, c]) => `${r},${c}`),
      );

      // Draw black tiles over unrevealed areas
      ctx.fillStyle = "#1a1a2e";
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (!revealedSet.has(`${r},${c}`)) {
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
          }
        }
      }

      // Draw grid lines
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(CANVAS_SIZE, i * tileSize);
        ctx.stroke();
      }
    }

    // Chat rendering
    function renderChat(messages) {
      elements.chatMessages.innerHTML = messages
        .map((msg) => {
          let className = "chat-message";
          if (msg.is_hint) className += " hint-message";
          else if (msg.is_guess) className += " guess-message";
          else if (msg.is_system) className += " system-message";
          else className += ` ${msg.from}-message`;

          const prefix = msg.player_name ? `${msg.player_name}: ` : "";
          return `<div class="${className}">${prefix}${escapeHtml(msg.text)}</div>`;
        })
        .join("");

      elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    function escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    // Event handlers
    elements.joinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = elements.nameInput.value.trim();
      if (name) {
        client.connect(name, instanceId);
      }
    });

    // Image upload
    elements.imageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        pendingImageData = event.target.result;
        elements.imagePreview.src = pendingImageData;
        elements.imagePreview.classList.remove("hidden");
        elements.uploadArea.classList.add("hidden");
        elements.confirmImageBtn.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    });

    elements.confirmImageBtn.addEventListener("click", () => {
      if (pendingImageData) {
        client.sendMove({
          action: "upload_image",
          image_data: pendingImageData,
        });
      }
    });

    elements.swapRolesToggle.addEventListener("change", (e) => {
      client.sendMove({
        action: "set_swap_roles",
        swap_roles: e.target.checked,
      });
    });

    // Hint submission
    elements.hintForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const hint = elements.hintInput.value.trim();
      if (hint) {
        client.sendMove({ action: "submit_hint", hint });
        elements.hintInput.value = "";
      }
    });

    // Guess submission
    elements.guessForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const guess = elements.guessInput.value.trim();
      if (guess) {
        client.sendMove({ action: "submit_guess", guess });
        elements.guessInput.value = "";
      }
    });

    // Judging
    elements.correctBtn.addEventListener("click", () => {
      client.sendMove({ action: "judge_guess", correct: true });
    });

    elements.incorrectBtn.addEventListener("click", () => {
      client.sendMove({ action: "judge_guess", correct: false });
    });

    // Chat
    elements.chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = elements.chatInput.value.trim();
      if (text) {
        client.sendMove({ action: "chat", text });
        elements.chatInput.value = "";
      }
    });

    // Give up
    elements.giveUpBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to give up and reveal the image?")) {
        client.sendMove({ action: "give_up" });
      }
    });

    // Next round
    elements.nextRoundBtn.addEventListener("click", () => {
      client.sendMove({ action: "next_round" });
    });
  })();
</script>
{% endblock %}
```

---

### File: `static/css/games/image-reveal.css`

```css
/* Image Reveal Game Styles */

.image-reveal-game {
  max-width: 500px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Screens */
.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.screen.hidden {
  display: none;
}

/* Join Screen */
#join-screen {
  justify-content: center;
  align-items: center;
  text-align: center;
}

#join-screen h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.game-description {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 300px;
}

#join-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 250px;
}

#join-form input {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

#join-form button {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* Waiting Screen */
#waiting-screen {
  justify-content: center;
  align-items: center;
  text-align: center;
}

.waiting-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Game Header */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  opacity: 0.7;
}

.player-info.current-player {
  opacity: 1;
}

.role-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.role-badge.picker {
  background: #e8d44d33;
  color: #e8d44d;
}

.role-badge.guesser {
  background: #4dabf733;
  color: #4dabf7;
}

.player-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.round-info {
  font-weight: 600;
  color: var(--text-secondary);
}

/* Sections */
.section {
  margin-bottom: 1rem;
}

.section.hidden {
  display: none;
}

/* Upload Section */
#upload-section {
  text-align: center;
}

#upload-section h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

#upload-section p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: var(--accent-color);
}

.upload-area input {
  display: none;
}

.upload-area label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.upload-icon {
  font-size: 2.5rem;
}

#image-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: 1rem;
}

#confirm-image-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.settings-toggle {
  margin-top: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.settings-toggle label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Board Section */
#board-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-container {
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
}

#game-canvas {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 2px solid var(--border-color);
}

.hint-display {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #e8d44d22;
  border-radius: 8px;
  text-align: center;
  width: 100%;
  max-width: 320px;
}

.hint-display.hidden {
  display: none;
}

.hint-label {
  font-weight: 600;
  color: #e8d44d;
}

/* Input Sections */
#hint-form,
#guess-form,
#chat-form {
  display: flex;
  gap: 0.5rem;
}

#hint-form input,
#guess-form input,
#chat-form input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

#hint-form button,
#guess-form button,
#chat-form button {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* Judging Section */
#judging-section {
  text-align: center;
}

.guess-display {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.judge-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.correct-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.incorrect-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* Round Complete */
#round-complete-section {
  text-align: center;
}

#result-message {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

#next-round-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* Chat Panel */
#chat-panel {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

#chat-panel.hidden {
  display: none;
}

#chat-messages {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.chat-message {
  padding: 0.25rem 0;
  font-size: 0.9rem;
}

.hint-message {
  color: #e8d44d;
  font-weight: 500;
}

.guess-message {
  color: #4dabf7;
  font-weight: 500;
}

.system-message {
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
}

.picker-message {
  color: #e8d44d;
}

.guesser-message {
  color: #4dabf7;
}

/* Give Up Button */
.give-up-btn {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
}

.give-up-btn:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.give-up-btn.hidden {
  display: none;
}

/* Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.overlay.hidden {
  display: none;
}

.overlay-content {
  text-align: center;
  padding: 2rem;
}

.overlay-content .subtext {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Waiting for image section */
#waiting-for-image-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex: 1;
}

#waiting-judgment-section {
  text-align: center;
  padding: 1rem;
  color: var(--text-secondary);
}

/* Mobile adjustments */
@media (max-width: 400px) {
  .game-header {
    padding: 0.5rem;
  }

  .role-badge {
    font-size: 0.65rem;
  }

  .player-name {
    font-size: 0.8rem;
  }

  .judge-buttons {
    flex-direction: column;
  }
}
```

---

## Registration in main.py

Add to the `GAME_REGISTRY` dictionary:

```python
from games.image_reveal import ImageReveal

GAME_REGISTRY: dict[str, type[BaseGame]] = {
    "rps": RockPaperScissors,
    "image-reveal": ImageReveal,
}
```

---

## Index Page Entry

Add to the multiplayer games section in `templates/index.html`:

```html
<a href="/game/image-reveal" class="game-card">
  <span class="game-icon">🖼️</span>
  <span class="game-name">Image Reveal</span>
  <span class="game-desc">Upload & guess hidden images</span>
</a>
```

---

## Image Size Considerations

For mobile users uploading photos, images can be very large. Consider resizing on the client before upload:

```javascript
// Add to image upload handler
function resizeImage(dataUrl, maxSize = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = dataUrl;
  });
}

// Use in upload handler:
reader.onload = async (event) => {
  pendingImageData = await resizeImage(event.target.result);
  // ... rest of handler
};
```

This keeps images under ~100KB typically, which is reasonable for WebSocket transmission.

---

## Testing Checklist

- [ ] Both players can join and get matched
- [ ] First player (index 0) becomes Picker by default
- [ ] Picker can upload image from camera or gallery
- [ ] Image displays correctly on canvas with tiles
- [ ] Picker can write and submit hints
- [ ] ~11 tiles reveal with each hint
- [ ] Guesser can submit guesses
- [ ] Picker can judge correct/incorrect
- [ ] Incorrect judgment returns to hint phase
- [ ] Correct judgment shows full image + result
- [ ] Chat messages appear for both players
- [ ] Give up works for both players
- [ ] Next round starts fresh with role swap (if enabled)
- [ ] Role swap toggle works (picker only)
- [ ] Disconnection/reconnection preserves game state
- [ ] Mobile layout works well
- [ ] Large images are handled gracefully
