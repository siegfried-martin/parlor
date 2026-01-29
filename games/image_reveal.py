import random
from typing import Optional
from .base import BaseGame, Player


class ImageReveal(BaseGame):
    game_id = "image-reveal"
    display_name = "Image Reveal"

    GRID_SIZE = 8  # 8x8 = 64 tiles
    TILES_PER_REVEAL = 11  # ~6 rounds to full reveal

    def __init__(self, instance_id: str):
        super().__init__(instance_id)
        self.reset_for_rematch()

    def reset_for_rematch(self) -> None:
        """Reset entire game state for rematch."""
        self.state = {
            "phase": "waiting_for_image",
            "image_data": None,  # base64 data URL
            "revealed_tiles": [],  # list of [row, col] pairs
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

    def _get_picker(self) -> Optional[Player]:
        if not self.players:
            return None
        return self.players[self.state["picker_index"]]

    def _get_guesser(self) -> Optional[Player]:
        if len(self.players) < 2:
            return None
        return self.players[1 - self.state["picker_index"]]

    def _is_picker(self, player: Player) -> bool:
        return player == self._get_picker()

    def _reveal_tiles(self) -> list[list[int]]:
        """Reveal TILES_PER_REVEAL random unrevealed tiles."""
        all_tiles = [
            [r, c]
            for r in range(self.GRID_SIZE)
            for c in range(self.GRID_SIZE)
        ]
        revealed_set = {tuple(t) for t in self.state["revealed_tiles"]}
        unrevealed = [t for t in all_tiles if tuple(t) not in revealed_set]

        to_reveal = min(self.TILES_PER_REVEAL, len(unrevealed))
        newly_revealed = random.sample(unrevealed, to_reveal)
        self.state["revealed_tiles"].extend(newly_revealed)

        return newly_revealed

    def _reveal_all_tiles(self) -> None:
        """Reveal all remaining tiles."""
        self.state["revealed_tiles"] = [
            [r, c]
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
            await self._handle_next_round(player)
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
            if guesser and guesser.name not in self.state["scores"]:
                self.state["scores"][guesser.name] = []
            if guesser:
                self.state["scores"][guesser.name].append(self.state["hint_round"])

            self._reveal_all_tiles()
            self.state["phase"] = "round_complete"

            self.state["chat"].append({
                "from": "system",
                "text": f"Correct! Guessed in {self.state['hint_round']} hint(s)",
                "is_system": True
            })

            await self.broadcast({
                "type": "round_result",
                "winner": guesser.name if guesser else None,
                "rounds_taken": self.state["hint_round"],
                "game_round": self.state["game_round"]
            })
        else:
            # Back to writing hint
            self.state["phase"] = "writing_hint"

            self.state["chat"].append({
                "from": "system",
                "text": "Incorrect - try again!",
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

    async def _handle_next_round(self, player: Player) -> None:
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
            "picker_name": picker.name if picker else None,
            "guesser_name": guesser.name if guesser else None,
            "my_name": for_player.name,
            "opponent_name": opponent.name if opponent else None,
            "opponent_connected": opponent.connected if opponent else False,
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
