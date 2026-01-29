import asyncio
from typing import Optional
from .base import BaseGame, Player


class RockPaperScissors(BaseGame):
    game_id = "rps"
    display_name = "Rock Paper Scissors"

    CHOICES = {"rock", "paper", "scissors"}
    BEATS = {
        "rock": "scissors",
        "paper": "rock",
        "scissors": "paper",
    }

    def __init__(self, instance_id: str):
        super().__init__(instance_id)
        self.reset_for_rematch()

    def reset_for_rematch(self) -> None:
        """Reset for a new round (not full game reset)."""
        self.state = {
            "phase": "choosing",
            "choices": {},  # player_name -> choice
            "round": self.state.get("round", 0) + 1 if self.state else 1,
            "scores": self.state.get("scores", {}) if self.state else {},
        }
        # Initialize scores for players if needed
        for player in self.players:
            if player.name not in self.state["scores"]:
                self.state["scores"][player.name] = 0

    def _init_player_score(self, player: Player) -> None:
        """Ensure player has a score entry."""
        if player.name not in self.state["scores"]:
            self.state["scores"][player.name] = 0

    async def handle_move(self, player: Player, data: dict) -> None:
        """Process a player's choice."""
        if self.state["phase"] != "choosing":
            await self.send_to(player, {
                "type": "error",
                "message": "Not in choosing phase"
            })
            return

        choice = data.get("choice", "").lower()
        if choice not in self.CHOICES:
            await self.send_to(player, {
                "type": "error",
                "message": f"Invalid choice: {choice}"
            })
            return

        # Record choice
        self.state["choices"][player.name] = choice

        # Send updated state to all players
        await self.broadcast_game_state()

        # Check if both players have chosen
        if len(self.state["choices"]) == 2:
            await self._resolve_round()

    async def _resolve_round(self) -> None:
        """Resolve the round once both players have chosen."""
        self.state["phase"] = "reveal"
        await self.broadcast_game_state()

        # Determine winner
        players_list = list(self.state["choices"].keys())
        p1_name, p2_name = players_list[0], players_list[1]
        p1_choice = self.state["choices"][p1_name]
        p2_choice = self.state["choices"][p2_name]

        if p1_choice == p2_choice:
            winner_name = None
            reason = "It's a tie!"
        elif self.BEATS[p1_choice] == p2_choice:
            winner_name = p1_name
            reason = f"{p1_choice.capitalize()} beats {p2_choice}"
        else:
            winner_name = p2_name
            reason = f"{p2_choice.capitalize()} beats {p1_choice}"

        # Update scores
        if winner_name:
            self.state["scores"][winner_name] += 1

        # Send round result
        await self.broadcast({
            "type": "round_result",
            "winner": winner_name,
            "reason": reason,
            "choices": self.state["choices"].copy(),
            "scores": self.state["scores"].copy(),
        })

        # Wait 3 seconds then start next round
        await asyncio.sleep(3)

        # Start next round
        self.reset_for_rematch()
        await self.broadcast({"type": "new_round", "round": self.state["round"]})
        await self.broadcast_game_state()

    def get_game_state(self, for_player: Player) -> dict:
        """Return game state from this player's perspective."""
        self._init_player_score(for_player)

        opponent = self.get_opponent(for_player)
        opponent_name = opponent.name if opponent else None

        # During choosing phase, hide opponent's choice
        if self.state["phase"] == "choosing":
            my_choice = self.state["choices"].get(for_player.name)
            opponent_has_chosen = opponent_name in self.state["choices"] if opponent_name else False
            choices_display = {
                for_player.name: my_choice,
            }
            if opponent_name:
                choices_display[opponent_name] = "chosen" if opponent_has_chosen else None
        else:
            # Reveal phase - show all choices
            choices_display = self.state["choices"].copy()

        return {
            "phase": self.state["phase"],
            "round": self.state["round"],
            "scores": self.state["scores"].copy(),
            "choices": choices_display,
            "my_name": for_player.name,
            "opponent_name": opponent_name,
            "opponent_connected": opponent.connected if opponent else False,
        }
