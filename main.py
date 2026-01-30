import asyncio
import os
import uuid
import logging
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

from games.base import BaseGame, Player
from games.rps import RockPaperScissors
from games.image_reveal import ImageReveal
from games.event_dash import EventDash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Game registry - add new games here
GAME_REGISTRY: dict[str, type[BaseGame]] = {
    "rps": RockPaperScissors,
    "image-reveal": ImageReveal,
    "event-dash": EventDash,
}

# Active game instances: instance_id -> BaseGame
game_instances: dict[str, BaseGame] = {}

# Matchmaking queues: game_id -> list of (player_name, websocket)
waiting_queues: dict[str, list[tuple[str, WebSocket]]] = {}

# Map websocket to game instance for easy lookup
websocket_to_game: dict[WebSocket, BaseGame] = {}

# Cleanup tasks for disconnected games
cleanup_tasks: dict[str, asyncio.Task] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Parlor starting up...")
    yield
    logger.info("Parlor shutting down...")
    # Cancel any pending cleanup tasks
    for task in cleanup_tasks.values():
        task.cancel()


app = FastAPI(title="Parlor", lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")


# --- HTTP Routes ---

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Landing page with game selection."""
    games = [
        {"id": game_id, "name": cls.display_name}
        for game_id, cls in GAME_REGISTRY.items()
    ]
    return templates.TemplateResponse("index.html", {
        "request": request,
        "games": games,
    })


@app.get("/game/{game_id}", response_class=HTMLResponse)
async def game_lobby(request: Request, game_id: str):
    """Game lobby page - enter name and start matchmaking."""
    if game_id not in GAME_REGISTRY:
        return HTMLResponse("Game not found", status_code=404)

    game_class = GAME_REGISTRY[game_id]
    context = {
        "request": request,
        "game_id": game_id,
        "game_name": game_class.display_name,
        "instance_id": None,
    }

    # Add Google Maps API key for event-dash
    if game_id == "event-dash":
        context["google_maps_api_key"] = os.getenv("GOOGLE_MAPS_API_KEY", "")

    return templates.TemplateResponse(f"games/{game_id}.html", context)


@app.get("/game/{game_id}/{instance_id}", response_class=HTMLResponse)
async def game_instance(request: Request, game_id: str, instance_id: str):
    """Active game instance page - for reconnection via URL."""
    if game_id not in GAME_REGISTRY:
        return HTMLResponse("Game not found", status_code=404)

    game_class = GAME_REGISTRY[game_id]
    context = {
        "request": request,
        "game_id": game_id,
        "game_name": game_class.display_name,
        "instance_id": instance_id,
    }

    # Add Google Maps API key for event-dash
    if game_id == "event-dash":
        context["google_maps_api_key"] = os.getenv("GOOGLE_MAPS_API_KEY", "")

    return templates.TemplateResponse(f"games/{game_id}.html", context)


@app.get("/solo/{game_id}", response_class=HTMLResponse)
async def solo_game(request: Request, game_id: str):
    """Single-player game page."""
    return templates.TemplateResponse(f"solo/{game_id}.html", {
        "request": request,
        "game_id": game_id,
    })


# --- WebSocket Routes ---

@app.websocket("/ws/game/{game_id}")
async def game_websocket(websocket: WebSocket, game_id: str):
    """WebSocket endpoint for multiplayer games."""
    if game_id not in GAME_REGISTRY:
        await websocket.close(code=4004, reason="Game not found")
        return

    await websocket.accept()
    logger.info(f"WebSocket connected for game: {game_id}")

    player: Optional[Player] = None
    game: Optional[BaseGame] = None

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "join":
                player_name = data.get("player_name", "").strip()
                if not player_name:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Player name required"
                    })
                    continue

                player = Player(name=player_name, websocket=websocket)
                logger.info(f"Player '{player_name}' joining {game_id}")

                # Try matchmaking
                game = await try_matchmaking(game_id, player)

            elif msg_type == "rejoin":
                instance_id = data.get("instance_id")
                player_name = data.get("player_name", "").strip()

                if not instance_id or not player_name:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Instance ID and player name required for rejoin"
                    })
                    continue

                # Try to rejoin existing game
                game = await try_rejoin(instance_id, player_name, websocket)

                if game:
                    # Find the player in the game
                    for p in game.players:
                        if p.name == player_name:
                            player = p
                            break
                else:
                    # Game not found or player not in it - treat as new join
                    player = Player(name=player_name, websocket=websocket)
                    game = await try_matchmaking(game_id, player)

            elif msg_type == "move":
                # Look up game from websocket mapping (handles case where first player's
                # local game variable is None after being matched by second player)
                current_game = websocket_to_game.get(websocket)
                if not current_game:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Not in a game"
                    })
                    continue

                # Find the player object in the game
                current_player = None
                for p in current_game.players:
                    if p.websocket == websocket:
                        current_player = p
                        break

                if not current_player:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Player not found in game"
                    })
                    continue

                await current_game.handle_move(current_player, data.get("data", {}))

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {player.name if player else 'unknown'}")
        await handle_disconnect(player, game, websocket)


async def try_matchmaking(game_id: str, player: Player) -> Optional[BaseGame]:
    """Try to match player with opponent or add to queue."""
    # Initialize queue for this game if needed
    if game_id not in waiting_queues:
        waiting_queues[game_id] = []

    queue = waiting_queues[game_id]

    # Check if there's someone waiting
    if queue:
        # Match found!
        opponent_name, opponent_ws = queue.pop(0)
        opponent = Player(name=opponent_name, websocket=opponent_ws)

        # Create game instance
        instance_id = str(uuid.uuid4())[:8]
        game_class = GAME_REGISTRY[game_id]
        game = game_class(instance_id)
        game.players = [opponent, player]

        game_instances[instance_id] = game

        # Map both websockets to this game for easy lookup
        websocket_to_game[opponent_ws] = game
        websocket_to_game[player.websocket] = game

        logger.info(f"Match created: {opponent.name} vs {player.name} (instance: {instance_id})")

        # Notify both players
        await opponent.websocket.send_json({
            "type": "matched",
            "instance_id": instance_id,
            "opponent_name": player.name,
        })
        await player.websocket.send_json({
            "type": "matched",
            "instance_id": instance_id,
            "opponent_name": opponent.name,
        })

        # Send initial game state
        await game.broadcast_game_state()

        return game
    else:
        # No one waiting - add to queue
        queue.append((player.name, player.websocket))
        await player.websocket.send_json({
            "type": "waiting",
            "message": "Waiting for opponent..."
        })
        logger.info(f"Player '{player.name}' added to {game_id} queue")
        return None


async def try_rejoin(instance_id: str, player_name: str, websocket: WebSocket) -> Optional[BaseGame]:
    """Try to rejoin an existing game instance."""
    if instance_id not in game_instances:
        logger.info(f"Rejoin failed: instance {instance_id} not found")
        return None

    game = game_instances[instance_id]

    # Find disconnected player with matching name
    for player in game.players:
        if player.name == player_name and not player.connected:
            # Reconnect!
            player.websocket = websocket
            player.connected = True

            # Add to websocket mapping
            websocket_to_game[websocket] = game

            logger.info(f"Player '{player_name}' reconnected to instance {instance_id}")

            # Cancel cleanup task if exists
            if instance_id in cleanup_tasks:
                cleanup_tasks[instance_id].cancel()
                del cleanup_tasks[instance_id]

            # Notify opponent
            opponent = game.get_opponent(player)
            if opponent and opponent.connected:
                await game.send_to(opponent, {"type": "opponent_reconnected"})

            # Send current game state
            await game.send_to(player, {
                "type": "rejoined",
                "instance_id": instance_id,
                "opponent_name": opponent.name if opponent else None,
            })
            await game.broadcast_game_state()

            return game

    logger.info(f"Rejoin failed: player {player_name} not found in instance {instance_id}")
    return None


async def handle_disconnect(player: Optional[Player], game: Optional[BaseGame], websocket: WebSocket = None) -> None:
    """Handle player disconnection."""
    if not player:
        return

    # Remove from websocket mapping
    ws = websocket or player.websocket
    if ws and ws in websocket_to_game:
        del websocket_to_game[ws]

    # Check if player was in matchmaking queue
    for game_id, queue in waiting_queues.items():
        queue[:] = [(name, ws) for name, ws in queue if ws != player.websocket]

    # Look up game from mapping if not provided
    if not game and ws:
        game = websocket_to_game.get(ws)

    if not game:
        return

    # Mark player as disconnected
    player.connected = False
    player.websocket = None

    # Notify opponent
    opponent = game.get_opponent(player)
    if opponent and opponent.connected:
        await game.send_to(opponent, {"type": "opponent_disconnected"})

    # Check if both players are disconnected
    all_disconnected = all(not p.connected for p in game.players)

    if all_disconnected:
        # Schedule cleanup
        instance_id = game.instance_id
        if instance_id not in cleanup_tasks:
            cleanup_tasks[instance_id] = asyncio.create_task(
                cleanup_game_after_delay(instance_id, 60)
            )
            logger.info(f"Scheduled cleanup for instance {instance_id} in 60 seconds")


async def cleanup_game_after_delay(instance_id: str, delay: int) -> None:
    """Clean up a game instance after a delay if still inactive."""
    try:
        await asyncio.sleep(delay)

        if instance_id in game_instances:
            game = game_instances[instance_id]
            # Double-check all players are still disconnected
            if all(not p.connected for p in game.players):
                del game_instances[instance_id]
                logger.info(f"Cleaned up inactive game instance: {instance_id}")

        if instance_id in cleanup_tasks:
            del cleanup_tasks[instance_id]

    except asyncio.CancelledError:
        logger.info(f"Cleanup cancelled for instance {instance_id}")
        if instance_id in cleanup_tasks:
            del cleanup_tasks[instance_id]


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8500))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
