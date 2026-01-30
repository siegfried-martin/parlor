# Event Dash

A two-player competitive game where players explore a random US city via Google Street View and race to find the best-rated restaurants and activities.

## Game Overview

Players are dropped into Street View at a random location within a randomly selected US city. They navigate freely, clicking on businesses to select 2 restaurants and 1 activity/event. At the end, players are scored based on the total Google ratings of their selections. A top-down map reveals both players' choices.

## Google Maps API Setup

### Required APIs

Enable the following in Google Cloud Console:

1. **Maps JavaScript API** - Street View embedding and map display
2. **Street View Static API** - Checking coverage availability
3. **Places API (New)** - Place details, ratings, types, and search

### Getting an API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Parlor Games")
3. Navigate to **APIs & Services > Library**
4. Search for and enable each API listed above
5. Navigate to **APIs & Services > Credentials**
6. Click **Create Credentials > API Key**
7. Copy the generated key

### API Key Restrictions (Important for Production)

#### For Local Development

1. In Credentials, click on your API key
2. Under **Application restrictions**, select **HTTP referrers**
3. Add: `http://localhost:*`
4. Under **API restrictions**, select **Restrict key** and choose the 3 APIs above
5. Save

#### For Production

Create a **separate API key** for production:

1. Create another API key following the same steps
2. Under **Application restrictions**, select **HTTP referrers**
3. Add: `https://parlor.marstol.com/*`
4. Apply the same API restrictions
5. Save

### Environment Configuration

Store API keys in `.env` (local) and on the server:

```env
# .env (local development)
GOOGLE_MAPS_API_KEY=AIza...your-dev-key...

# Production server: add to /root/parlor/.env
GOOGLE_MAPS_API_KEY=AIza...your-prod-key...
```

The key is passed to the template and loaded in the frontend:

```python
# main.py
@app.get("/game/event_dash/{instance_id}")
async def event_dash_game(request: Request, instance_id: str):
    return templates.TemplateResponse("games/event_dash.html", {
        "request": request,
        "google_maps_api_key": os.getenv("GOOGLE_MAPS_API_KEY")
    })
```

```html
<!-- Template -->
<script src="https://maps.googleapis.com/maps/api/js?key={{ google_maps_api_key }}&libraries=places"></script>
```

### Billing

Google Maps Platform requires a billing account but provides $200/month free credit. For personal use with 2 players, you'll stay well within free tier. Set up budget alerts in Cloud Console as a safeguard.

---

## Game Flow

### 1. Lobby & Configuration (First Player)

First player to join sees configuration options:

| Setting         | Options                              | Default |
| --------------- | ------------------------------------ | ------- |
| Time Limit      | 30s, 60s, 90s, 2min, 5min, Unlimited | 90s     |
| Starting Points | Same location / Different locations  | Same    |

Second player sees "Waiting for host to start..."

Host clicks **Start Game** when ready.

### 2. City Selection (Automatic)

Server randomly selects a US city:

1. Pick random city from curated dataset (see City Data section)
2. Verify Street View coverage exists near city center via Street View Static API metadata request
3. If no coverage, pick another city (retry up to 3 times, then notify players)
4. Generate random starting point(s) based on city population radius

Both players see: **"Get ready! You're exploring [City Name], [State]"** (3-second countdown)

### 3. Active Gameplay

Players see:

```
┌─────────────────────────────────────────────────────────────┐
│  [City Name, State]                    ⏱️ 1:23             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                    STREET VIEW                              │
│                   (Full interaction)                        │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  YOUR PICKS:                                                │
│  🍽️ Restaurant 1: [empty]                                  │
│  🍽️ Restaurant 2: [empty]                                  │
│  🎭 Activity:     [empty]                                   │
│                                                    [Skip?]  │
└─────────────────────────────────────────────────────────────┘
```

**Mobile Layout:** Stack vertically - Street View on top (60% height), picks panel below (collapsible).

### 4. Selection Flow

When player clicks a business marker/label in Street View:

1. Frontend captures the click and extracts place reference
2. Call Places API to get place details (name, rating, types, location)
3. Show selection modal:

```
┌──────────────────────────────────┐
│  Joe's Pizza                     │
│  📍 123 Main St                  │
│                                  │
│  Select as:                      │
│  ┌────────────┐ ┌────────────┐   │
│  │ Restaurant │ │  Activity  │   │
│  └────────────┘ └────────────┘   │
│                                  │
│         [ Cancel ]               │
└──────────────────────────────────┘
```

- Only show valid options based on place types and remaining slots
- If player already has 2 restaurants, only show Activity button (if place qualifies)
- If place doesn't match any valid type, show "This place doesn't qualify"
- Selection is **final** - no changes allowed

After selection, the picks panel updates:

```
🍽️ Restaurant 1: Joe's Pizza ✓
🍽️ Restaurant 2: [empty]
🎭 Activity:     [empty]
```

Ratings are **hidden** until game end.

### 5. Timer Mechanics

- Timer counts down from selected duration
- **When one player completes all 3 picks:**
  - Timer speed doubles (visually show "⚡ 2X SPEED")
  - Alert sound plays for the incomplete player
  - Toast notification: "Opponent finished! Hurry!"
- **When timer expires:**
  - Game ends immediately
  - Players scored only on completed selections
  - Missing selections count as 0

### 6. Game End Conditions

Game ends when ANY of:

- Both players complete all 3 selections
- Timer expires (if time limit set)
- Both players vote to skip

### 7. Skip Mechanic

Any player can click **[Skip?]** button:

1. Initiating player sees: "Waiting for opponent to agree..."
2. Other player sees modal:
   ```
   ┌─────────────────────────────────┐
   │  Opponent wants to skip this    │
   │  round. Agree?                  │
   │                                 │
   │   [ Continue ]    [ Skip ]      │
   └─────────────────────────────────┘
   ```
3. If agreed: Round ends, no winner, new city selected
4. If declined: Game continues, skip requester notified

---

## Results Screen

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    🏆 RESULTS 🏆                            │
│                   [City Name, State]                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    TOP-DOWN MAP                             │
│            (showing both players' pins)                     │
│                                                             │
│     🔵 = Player 1    🔴 = Player 2                          │
├────────────────────────┬────────────────────────────────────┤
│  PLAYER 1              │  PLAYER 2                          │
│  ──────────────────    │  ──────────────────                │
│  🍽️ Joe's Pizza  4.2   │  🍽️ Thai Palace  4.5              │
│  🍽️ Burger Barn  4.0   │  🍽️ Sushi House  4.3              │
│  🎭 City Museum  4.6   │  🎭 Central Park  4.4              │
│  ──────────────────    │  ──────────────────                │
│  TOTAL: 12.8           │  TOTAL: 13.2                       │
│                        │  ⭐ WINNER ⭐                       │
├────────────────────────┴────────────────────────────────────┤
│            [ Rematch ]         [ New City ]                 │
└─────────────────────────────────────────────────────────────┘
```

### Map Features

- Top-down Google Map centered on city
- Markers for each selection:
  - Player 1: Blue markers (🔵)
  - Player 2: Red markers (🔴)
- Optional: Lines connecting each player's selections to show their "route"
- Clicking a marker shows place name and rating

### Scoring

- Sum of Google ratings for all selections
- Missing selections = 0 points
- Ties are displayed as ties (no tiebreaker)

### Post-Game Options

| Button   | Action                                                 |
| -------- | ------------------------------------------------------ |
| Rematch  | Same city, new random starting point(s), same settings |
| New City | New random city, same settings                         |

---

## City Data

### Dataset Requirements

Need a list of US cities with:

- City name
- State
- Population
- Latitude/Longitude (city center)

### Recommended Source

Use the US Census Bureau's city population data or a curated subset. For simplicity, start with ~500 cities covering:

- All state capitals
- Cities with population > 50,000
- Ensure geographic diversity

Store as JSON in `static/data/us_cities.json`:

```json
[
  {
    "city": "Austin",
    "state": "TX",
    "population": 978908,
    "lat": 30.2672,
    "lng": -97.7431
  },
  ...
]
```

### Population-Based Radius

Random starting point distance from city center scales with population:

| Population          | Radius (miles) |
| ------------------- | -------------- |
| < 25,000            | 0.3 - 0.5      |
| 25,000 - 100,000    | 0.5 - 1.0      |
| 100,000 - 500,000   | 1.0 - 2.0      |
| 500,000 - 1,000,000 | 1.5 - 3.0      |
| > 1,000,000         | 2.0 - 5.0      |

Algorithm:

1. Pick random angle (0-360°)
2. Pick random distance within radius range
3. Calculate lat/lng offset
4. Verify Street View coverage at that point
5. If no coverage, retry with new random point (up to 5 attempts)
6. If all retries fail, pick new city

---

## Place Type Classification

### Restaurants

Google Place Types that count as "restaurant":

```
restaurant, cafe, bakery, bar, meal_delivery, meal_takeaway,
food, pizza_restaurant, chinese_restaurant, japanese_restaurant,
italian_restaurant, mexican_restaurant, indian_restaurant,
thai_restaurant, vietnamese_restaurant, fast_food_restaurant,
hamburger_restaurant, sandwich_shop, ice_cream_shop, coffee_shop,
breakfast_restaurant, brunch_restaurant, seafood_restaurant,
steak_house, sushi_restaurant, american_restaurant
```

### Activities/Events

Google Place Types that count as "activity":

```
museum, art_gallery, park, tourist_attraction, zoo, aquarium,
amusement_park, bowling_alley, movie_theater, night_club,
shopping_mall, book_store, clothing_store, department_store,
spa, gym, stadium, library, casino, concert_hall, performing_arts_theater
```

### Validation

When player selects a place:

1. Fetch place details including `types` array
2. Check if any type matches restaurant list → eligible as restaurant
3. Check if any type matches activity list → eligible as activity
4. If neither → "This place doesn't qualify as a restaurant or activity"
5. If both → Player chooses which category (show both buttons)

---

## WebSocket Messages

### New Message Types (in addition to base protocol)

#### Client → Server

```json
{ "type": "configure", "data": { "time_limit": 90, "same_start": true } }
```

Host sets game configuration.

```json
{ "type": "start_game" }
```

Host starts the game.

```json
{
  "type": "select_place",
  "data": {
    "place_id": "ChIJ...",
    "category": "restaurant",
    "name": "Joe's Pizza",
    "rating": 4.2,
    "lat": 30.267,
    "lng": -97.743
  }
}
```

Player selects a place. Server validates and records.

```json
{ "type": "request_skip" }
```

Player requests to skip current round.

```json
{ "type": "respond_skip", "data": { "agree": true } }
```

Player responds to skip request.

#### Server → Client

```json
{ "type": "game_configured", "data": { "time_limit": 90, "same_start": true } }
```

Broadcast config to both players.

```json
{
  "type": "game_starting",
  "data": {
    "city": "Austin",
    "state": "TX",
    "start_location": { "lat": 30.267, "lng": -97.743 },
    "countdown": 3
  }
}
```

Game is starting with city and starting coordinates.

```json
{
  "type": "selection_confirmed",
  "data": {
    "category": "restaurant",
    "slot": 1,
    "name": "Joe's Pizza"
  }
}
```

Confirms player's selection (no rating shown yet).

```json
{
  "type": "opponent_selection",
  "data": {
    "category": "restaurant",
    "slot": 1
  }
}
```

Notifies that opponent made a selection (no details).

```json
{ "type": "opponent_finished" }
```

Opponent completed all 3 selections. Timer doubles.

```json
{ "type": "skip_requested", "by": "Partner" }
```

Opponent wants to skip.

```json
{ "type": "skip_declined" }
```

Skip request was declined.

```json
{ "type": "round_skipped" }
```

Both agreed to skip.

```json
{ "type": "game_over", "data": {
    "winner": "Player1",
    "player1": {
        "name": "Alice",
        "selections": [
            { "name": "Joe's Pizza", "rating": 4.2, "category": "restaurant", "lat": 30.1, "lng": -97.7 },
            { "name": "Burger Barn", "rating": 4.0, "category": "restaurant", "lat": 30.2, "lng": -97.8 },
            { "name": "City Museum", "rating": 4.6, "category": "activity", "lat": 30.15, "lng": -97.75 }
        ],
        "total": 12.8
    },
    "player2": {
        "name": "Bob",
        "selections": [...],
        "total": 13.2
    },
    "city": "Austin",
    "state": "TX"
}}
```

Final results with all data for results screen.

---

## Game State (Backend)

```python
state = {
    "phase": "lobby" | "countdown" | "playing" | "finished",
    "config": {
        "time_limit": 90,  # seconds, or None for unlimited
        "same_start": True
    },
    "city": {
        "name": "Austin",
        "state": "TX",
        "center": {"lat": 30.2672, "lng": -97.7431}
    },
    "start_locations": {
        "player1_name": {"lat": 30.27, "lng": -97.74},
        "player2_name": {"lat": 30.26, "lng": -97.75}  # Same or different based on config
    },
    "selections": {
        "player1_name": {
            "restaurants": [
                {"place_id": "...", "name": "Joe's Pizza", "rating": 4.2, "lat": 30.1, "lng": -97.7},
                None
            ],
            "activity": None
        },
        "player2_name": {
            "restaurants": [None, None],
            "activity": None
        }
    },
    "finished_players": [],  # Players who completed all selections
    "timer_started_at": 1699999999.0,
    "timer_doubled_at": None,  # Timestamp when timer went 2x
    "skip_requested_by": None
}
```

---

## Frontend Components

### Required Elements

1. **Street View Container** - Full Google Street View with standard navigation
2. **Timer Display** - Countdown with visual warning states (yellow < 30s, red < 10s)
3. **Picks Panel** - Shows current selections (collapsible on mobile)
4. **Selection Modal** - Appears when clicking a business
5. **Skip Button** - Bottom corner of picks panel
6. **Results Overlay** - Full-screen results with map

### Street View Click Handling

The tricky part: detecting clicks on business markers in Street View.

**Approach:**

1. Use `google.maps.StreetViewPanorama` with click event listener
2. When user clicks, check if click intersects with a Place marker
3. If hit, retrieve `place_id` from the marker
4. Fetch place details via Places API
5. Show selection modal

**Note:** Street View's built-in POI (Point of Interest) labels may need to be enabled. Check `clickToGo` and POI settings in StreetViewPanorama options.

If direct marker clicking proves unreliable:

- Fallback: Add a search bar for typing place names
- Hybrid: Allow both clicking (when it works) and search

---

## File Structure

```
/
├── games/
│   └── event_dash.py           # Game logic
├── templates/
│   └── games/
│       └── event_dash.html     # Game template
├── static/
│   ├── css/
│   │   └── games/
│   │       └── event_dash.css  # Game styles
│   ├── js/
│   │   └── games/
│   │       └── event_dash.js   # Game client logic
│   └── data/
│       └── us_cities.json      # City dataset
└── main.py                     # Register game route
```

---

## Implementation Notes

### Phase 1: Core Game

1. Set up Google Maps API keys (local + production)
2. Create city dataset JSON
3. Implement backend game class with state management
4. Build Street View interface with basic navigation
5. Implement place selection flow (search-based fallback is fine initially)
6. Build results screen with map

### Phase 2: Polish

1. Improve click-to-select on Street View markers (if feasible)
2. Add timer doubling mechanic
3. Add skip functionality
4. Mobile optimization
5. Sound effects (timer warning, opponent finished alert)

### Phase 3: Nice-to-Have

1. Route lines on results map
2. Historical stats (win/loss record)
3. City difficulty ratings based on Street View coverage quality

---

## Testing Checklist

- [ ] API keys work in development
- [ ] API keys work in production (different key)
- [ ] Random city selection produces valid Street View locations
- [ ] Place selection correctly validates types
- [ ] Timer doubles when opponent finishes
- [ ] Skip flow works both ways (accept/decline)
- [ ] Results map shows all pins correctly
- [ ] Mobile layout is usable
- [ ] Reconnection preserves game state
- [ ] Rematch and New City buttons work
