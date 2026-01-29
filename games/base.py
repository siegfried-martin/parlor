from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from starlette.websockets import WebSocket


@dataclass
class Player:
    name: str
    websocket: Optional[WebSocket] = None
    connected: bool = True


class BaseGame(ABC):
    game_id: str  # e.g., "rps" - used in URLs
    display_name: str  # e.g., "Rock Paper Scissors"
    min_players: int = 2
    max_players: int = 2

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
    def reset_for_rematch(self) -> None:
        """Reset game state for a new round."""
        pass

    def get_opponent(self, player: Player) -> Optional[Player]:
        """Get the opponent of the given player."""
        for p in self.players:
            if p != player:
                return p
        return None

    async def broadcast(self, message: dict, exclude: Optional[Player] = None) -> None:
        """Send message to all connected players except excluded one."""
        for player in self.players:
            if player.connected and player.websocket and player != exclude:
                try:
                    await player.websocket.send_json(message)
                except Exception:
                    player.connected = False

    async def send_to(self, player: Player, message: dict) -> None:
        """Send message to specific player."""
        if player.connected and player.websocket:
            try:
                await player.websocket.send_json(message)
            except Exception:
                player.connected = False

    async def broadcast_game_state(self) -> None:
        """Send personalized game state to each player."""
        for player in self.players:
            if player.connected:
                state = self.get_game_state(player)
                await self.send_to(player, {"type": "game_state", "data": state})
