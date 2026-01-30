import json
import math
import random
import time
from pathlib import Path
from typing import Optional
from .base import BaseGame, Player


# Place type classifications
RESTAURANT_TYPES = {
    "restaurant", "cafe", "bakery", "bar", "meal_delivery", "meal_takeaway",
    "food", "pizza_restaurant", "chinese_restaurant", "japanese_restaurant",
    "italian_restaurant", "mexican_restaurant", "indian_restaurant",
    "thai_restaurant", "vietnamese_restaurant", "fast_food_restaurant",
    "hamburger_restaurant", "sandwich_shop", "ice_cream_shop", "coffee_shop",
    "breakfast_restaurant", "brunch_restaurant", "seafood_restaurant",
    "steak_house", "sushi_restaurant", "american_restaurant"
}

ACTIVITY_TYPES = {
    "museum", "art_gallery", "park", "tourist_attraction", "zoo", "aquarium",
    "amusement_park", "bowling_alley", "movie_theater", "night_club",
    "shopping_mall", "book_store", "clothing_store", "department_store",
    "spa", "gym", "stadium", "library", "casino", "concert_hall",
    "performing_arts_theater", "monument", "landmark", "historical_landmark",
    "memorial", "national_park", "state_park", "city_hall", "courthouse",
    "church", "place_of_worship"
}

# Population-based radius ranges (in miles) - kept small to stay near downtown
RADIUS_RANGES = [
    (50000, 0.05, 0.15),      # Small cities: very close to center
    (150000, 0.1, 0.25),      # Medium cities
    (500000, 0.15, 0.4),      # Large cities
    (1000000, 0.2, 0.6),      # Major cities
    (float('inf'), 0.3, 0.8)  # Mega cities
]


def load_cities() -> list[dict]:
    """Load US cities from JSON file."""
    cities_path = Path(__file__).parent.parent / "static" / "data" / "us_cities.json"
    with open(cities_path) as f:
        return json.load(f)


def get_radius_range(population: int) -> tuple[float, float]:
    """Get min/max radius in miles based on population."""
    for max_pop, min_r, max_r in RADIUS_RANGES:
        if population < max_pop:
            return (min_r, max_r)
    return (2.0, 5.0)


def random_point_in_radius(lat: float, lng: float, min_miles: float, max_miles: float) -> tuple[float, float]:
    """Generate a random point within a radius range from center."""
    # Convert miles to degrees (approximate)
    miles_per_degree_lat = 69.0
    miles_per_degree_lng = 69.0 * math.cos(math.radians(lat))

    # Random angle and distance
    angle = random.uniform(0, 2 * math.pi)
    distance = random.uniform(min_miles, max_miles)

    # Calculate offset
    delta_lat = (distance * math.cos(angle)) / miles_per_degree_lat
    delta_lng = (distance * math.sin(angle)) / miles_per_degree_lng

    return (lat + delta_lat, lng + delta_lng)


class EventDash(BaseGame):
    game_id = "event-dash"
    display_name = "Event Dash"

    TIME_LIMITS = [30, 60, 90, 120, 300, None]  # None = unlimited
    DEFAULT_TIME_LIMIT = 90

    def __init__(self, instance_id: str):
        super().__init__(instance_id)
        self.cities = load_cities()
        self.reset_for_rematch()

    def reset_for_rematch(self) -> None:
        """Reset game state for new round (same city)."""
        self.state = {
            "phase": "lobby",  # lobby, countdown, playing, finished
            "config": {
                "time_limit": self.DEFAULT_TIME_LIMIT,
                "same_start": True
            },
            "host_index": 0,  # Index of host player
            "city": None,
            "start_locations": {},  # {player_name: {lat, lng}}
            "selections": {},  # {player_name: {restaurants: [sel, sel], activity: sel}}
            "finished_players": [],
            "timer_started_at": None,
            "timer_doubled_at": None,
            "skip_requested_by": None,
            "ready_for_next": [],  # Players ready for next round
        }

    def _new_city(self) -> None:
        """Select a new random city."""
        self.state["city"] = random.choice(self.cities)
        self._generate_start_locations()

    def _generate_start_locations(self) -> None:
        """Generate starting locations for players based on city and config."""
        city = self.state["city"]
        if not city:
            return

        min_r, max_r = get_radius_range(city["population"])

        if self.state["config"]["same_start"]:
            # Same start location for both
            lat, lng = random_point_in_radius(
                city["lat"], city["lng"], min_r, max_r
            )
            for player in self.players:
                self.state["start_locations"][player.name] = {"lat": lat, "lng": lng}
        else:
            # Different start locations
            for player in self.players:
                lat, lng = random_point_in_radius(
                    city["lat"], city["lng"], min_r, max_r
                )
                self.state["start_locations"][player.name] = {"lat": lat, "lng": lng}

    def _init_player_selections(self) -> None:
        """Initialize selection slots for all players."""
        for player in self.players:
            self.state["selections"][player.name] = {
                "restaurants": [None, None],
                "activity": None
            }

    def _get_host(self) -> Optional[Player]:
        """Get the host player."""
        if not self.players:
            return None
        return self.players[self.state["host_index"]]

    def _is_host(self, player: Player) -> bool:
        """Check if player is the host."""
        return player == self._get_host()

    def _player_finished(self, player_name: str) -> bool:
        """Check if player has completed all selections."""
        sels = self.state["selections"].get(player_name, {})
        restaurants = sels.get("restaurants", [None, None])
        activity = sels.get("activity")
        return all(r is not None for r in restaurants) and activity is not None

    def _both_finished(self) -> bool:
        """Check if both players have completed all selections."""
        return all(self._player_finished(p.name) for p in self.players)

    def _get_remaining_time(self) -> Optional[float]:
        """Get remaining time in seconds, accounting for doubled speed."""
        if self.state["config"]["time_limit"] is None:
            return None
        if self.state["timer_started_at"] is None:
            return self.state["config"]["time_limit"]

        now = time.time()
        elapsed = now - self.state["timer_started_at"]

        # If timer was doubled, account for 2x speed
        if self.state["timer_doubled_at"]:
            normal_elapsed = self.state["timer_doubled_at"] - self.state["timer_started_at"]
            doubled_elapsed = (now - self.state["timer_doubled_at"]) * 2
            elapsed = normal_elapsed + doubled_elapsed

        remaining = self.state["config"]["time_limit"] - elapsed
        return max(0, remaining)

    def _calculate_score(self, player_name: str) -> float:
        """Calculate total score for a player."""
        sels = self.state["selections"].get(player_name, {})
        total = 0.0

        for restaurant in sels.get("restaurants", []):
            if restaurant and restaurant.get("rating"):
                total += restaurant["rating"]

        activity = sels.get("activity")
        if activity and activity.get("rating"):
            total += activity["rating"]

        return round(total, 1)

    async def handle_move(self, player: Player, data: dict) -> None:
        """Process player actions."""
        action = data.get("action")

        if action == "configure":
            await self._handle_configure(player, data)
        elif action == "start_game":
            await self._handle_start_game(player)
        elif action == "select_place":
            await self._handle_select_place(player, data)
        elif action == "request_skip":
            await self._handle_request_skip(player)
        elif action == "respond_skip":
            await self._handle_respond_skip(player, data)
        elif action == "rematch":
            await self._handle_rematch(player)
        elif action == "new_city":
            await self._handle_new_city(player)
        else:
            await self.send_to(player, {
                "type": "error",
                "message": f"Unknown action: {action}"
            })

    async def _handle_configure(self, player: Player, data: dict) -> None:
        """Host configures game settings."""
        if not self._is_host(player):
            await self.send_to(player, {
                "type": "error",
                "message": "Only the host can configure the game"
            })
            return

        if self.state["phase"] != "lobby":
            await self.send_to(player, {
                "type": "error",
                "message": "Cannot configure game after it has started"
            })
            return

        time_limit = data.get("time_limit", self.DEFAULT_TIME_LIMIT)
        if time_limit not in self.TIME_LIMITS:
            time_limit = self.DEFAULT_TIME_LIMIT

        self.state["config"]["time_limit"] = time_limit
        self.state["config"]["same_start"] = bool(data.get("same_start", True))

        await self.broadcast({
            "type": "game_configured",
            "data": self.state["config"]
        })

    async def _handle_start_game(self, player: Player) -> None:
        """Host starts the game."""
        if not self._is_host(player):
            await self.send_to(player, {
                "type": "error",
                "message": "Only the host can start the game"
            })
            return

        if self.state["phase"] != "lobby":
            await self.send_to(player, {
                "type": "error",
                "message": "Game already started"
            })
            return

        if len(self.players) < 2:
            await self.send_to(player, {
                "type": "error",
                "message": "Need 2 players to start"
            })
            return

        # Select city and generate start locations
        self._new_city()
        self._init_player_selections()

        self.state["phase"] = "countdown"

        # Send game starting message with city info
        await self.broadcast({
            "type": "game_starting",
            "data": {
                "city": self.state["city"]["city"],
                "state": self.state["city"]["state"],
                "countdown": 3
            }
        })

        # After 3 seconds (handled by frontend), game will be in playing phase
        self.state["phase"] = "playing"
        self.state["timer_started_at"] = time.time()

        await self.broadcast_game_state()

    async def _handle_select_place(self, player: Player, data: dict) -> None:
        """Player selects a place."""
        if self.state["phase"] != "playing":
            await self.send_to(player, {
                "type": "error",
                "message": "Game is not in progress"
            })
            return

        # Check if timer expired
        remaining = self._get_remaining_time()
        if remaining is not None and remaining <= 0:
            await self._end_game()
            return

        place_id = data.get("place_id")
        category = data.get("category")
        name = data.get("name")
        rating = data.get("rating")
        lat = data.get("lat")
        lng = data.get("lng")

        if not all([place_id, category, name]):
            await self.send_to(player, {
                "type": "error",
                "message": "Missing place information"
            })
            return

        if category not in ["restaurant", "activity"]:
            await self.send_to(player, {
                "type": "error",
                "message": "Invalid category"
            })
            return

        sels = self.state["selections"][player.name]
        selection = {
            "place_id": place_id,
            "name": name,
            "rating": rating,
            "lat": lat,
            "lng": lng
        }

        if category == "restaurant":
            # Find empty restaurant slot
            if sels["restaurants"][0] is None:
                sels["restaurants"][0] = selection
                slot = 1
            elif sels["restaurants"][1] is None:
                sels["restaurants"][1] = selection
                slot = 2
            else:
                await self.send_to(player, {
                    "type": "error",
                    "message": "Already selected 2 restaurants"
                })
                return
        else:  # activity
            if sels["activity"] is not None:
                await self.send_to(player, {
                    "type": "error",
                    "message": "Already selected an activity"
                })
                return
            sels["activity"] = selection
            slot = 1

        # Confirm selection to player
        await self.send_to(player, {
            "type": "selection_confirmed",
            "data": {
                "category": category,
                "slot": slot,
                "name": name
            }
        })

        # Notify opponent (without details)
        opponent = self.get_opponent(player)
        if opponent:
            await self.send_to(opponent, {
                "type": "opponent_selection",
                "data": {
                    "category": category,
                    "slot": slot
                }
            })

        # Check if player just finished
        if self._player_finished(player.name):
            if player.name not in self.state["finished_players"]:
                self.state["finished_players"].append(player.name)

                # If first to finish, double timer for opponent
                if len(self.state["finished_players"]) == 1 and opponent:
                    self.state["timer_doubled_at"] = time.time()
                    await self.send_to(opponent, {"type": "opponent_finished"})

        # Check if both finished
        if self._both_finished():
            await self._end_game()
        else:
            await self.broadcast_game_state()

    async def _handle_request_skip(self, player: Player) -> None:
        """Player requests to skip current round."""
        if self.state["phase"] != "playing":
            await self.send_to(player, {
                "type": "error",
                "message": "Cannot skip when not playing"
            })
            return

        if self.state["skip_requested_by"]:
            await self.send_to(player, {
                "type": "error",
                "message": "Skip already requested"
            })
            return

        self.state["skip_requested_by"] = player.name

        opponent = self.get_opponent(player)
        if opponent:
            await self.send_to(opponent, {
                "type": "skip_requested",
                "by": player.name
            })

        await self.send_to(player, {
            "type": "waiting_for_skip_response"
        })

    async def _handle_respond_skip(self, player: Player, data: dict) -> None:
        """Player responds to skip request."""
        if self.state["skip_requested_by"] == player.name:
            await self.send_to(player, {
                "type": "error",
                "message": "Cannot respond to your own skip request"
            })
            return

        if not self.state["skip_requested_by"]:
            await self.send_to(player, {
                "type": "error",
                "message": "No skip request pending"
            })
            return

        if data.get("agree"):
            # Both agreed to skip - new city
            await self.broadcast({"type": "round_skipped"})
            self._new_city()
            self._init_player_selections()
            self.state["skip_requested_by"] = None
            self.state["finished_players"] = []
            self.state["timer_started_at"] = time.time()
            self.state["timer_doubled_at"] = None

            await self.broadcast({
                "type": "game_starting",
                "data": {
                    "city": self.state["city"]["city"],
                    "state": self.state["city"]["state"],
                    "countdown": 3
                }
            })
            await self.broadcast_game_state()
        else:
            # Skip declined
            self.state["skip_requested_by"] = None
            await self.broadcast({"type": "skip_declined"})

    async def _handle_rematch(self, player: Player) -> None:
        """Player wants rematch (same city)."""
        if self.state["phase"] != "finished":
            return

        if player.name not in self.state["ready_for_next"]:
            self.state["ready_for_next"].append(player.name)

        if len(self.state["ready_for_next"]) >= 2:
            # Both ready - rematch with same city
            self._generate_start_locations()
            self._init_player_selections()
            self.state["phase"] = "playing"
            self.state["finished_players"] = []
            self.state["timer_started_at"] = time.time()
            self.state["timer_doubled_at"] = None
            self.state["skip_requested_by"] = None
            self.state["ready_for_next"] = []

            await self.broadcast({
                "type": "game_starting",
                "data": {
                    "city": self.state["city"]["city"],
                    "state": self.state["city"]["state"],
                    "countdown": 3
                }
            })
            await self.broadcast_game_state()
        else:
            await self.broadcast_game_state()

    async def _handle_new_city(self, player: Player) -> None:
        """Player wants new city."""
        if self.state["phase"] != "finished":
            return

        if player.name not in self.state["ready_for_next"]:
            self.state["ready_for_next"].append(player.name)

        if len(self.state["ready_for_next"]) >= 2:
            # Both ready - new city
            self._new_city()
            self._init_player_selections()
            self.state["phase"] = "playing"
            self.state["finished_players"] = []
            self.state["timer_started_at"] = time.time()
            self.state["timer_doubled_at"] = None
            self.state["skip_requested_by"] = None
            self.state["ready_for_next"] = []

            await self.broadcast({
                "type": "game_starting",
                "data": {
                    "city": self.state["city"]["city"],
                    "state": self.state["city"]["state"],
                    "countdown": 3
                }
            })
            await self.broadcast_game_state()
        else:
            await self.broadcast_game_state()

    async def _end_game(self) -> None:
        """End the game and show results."""
        self.state["phase"] = "finished"

        # Calculate scores
        results = {}
        for player in self.players:
            sels = self.state["selections"].get(player.name, {})
            selections_list = []

            for r in sels.get("restaurants", []):
                if r:
                    selections_list.append({**r, "category": "restaurant"})

            activity = sels.get("activity")
            if activity:
                selections_list.append({**activity, "category": "activity"})

            results[player.name] = {
                "name": player.name,
                "selections": selections_list,
                "total": self._calculate_score(player.name)
            }

        # Determine winner
        scores = [(p.name, self._calculate_score(p.name)) for p in self.players]
        scores.sort(key=lambda x: x[1], reverse=True)

        winner = None
        if scores[0][1] > scores[1][1]:
            winner = scores[0][0]
        # Tie if equal scores

        await self.broadcast({
            "type": "game_over",
            "data": {
                "winner": winner,
                "player1": results[self.players[0].name],
                "player2": results[self.players[1].name],
                "city": self.state["city"]["city"],
                "state": self.state["city"]["state"],
                "center": {
                    "lat": self.state["city"]["lat"],
                    "lng": self.state["city"]["lng"]
                }
            }
        })

        await self.broadcast_game_state()

    def get_game_state(self, for_player: Player) -> dict:
        """Return game state personalized for the player."""
        opponent = self.get_opponent(for_player)
        my_sels = self.state["selections"].get(for_player.name, {})

        # Count opponent selections (don't reveal details)
        opp_sels = self.state["selections"].get(opponent.name, {}) if opponent else {}
        opp_restaurant_count = sum(1 for r in opp_sels.get("restaurants", []) if r)
        opp_has_activity = opp_sels.get("activity") is not None

        return {
            "phase": self.state["phase"],
            "is_host": self._is_host(for_player),
            "config": self.state["config"],
            "city": self.state["city"],
            "my_start": self.state["start_locations"].get(for_player.name),
            "my_name": for_player.name,
            "opponent_name": opponent.name if opponent else None,
            "opponent_connected": opponent.connected if opponent else False,
            "my_selections": my_sels,
            "opponent_restaurant_count": opp_restaurant_count,
            "opponent_has_activity": opp_has_activity,
            "remaining_time": self._get_remaining_time(),
            "timer_doubled": self.state["timer_doubled_at"] is not None,
            "i_finished": for_player.name in self.state["finished_players"],
            "opponent_finished": opponent.name in self.state["finished_players"] if opponent else False,
            "skip_requested_by": self.state["skip_requested_by"],
            "ready_for_next": self.state["ready_for_next"],
        }
