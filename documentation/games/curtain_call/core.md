# Curtain Call — Core Mechanics & Technical Architecture

## Game Flow Overview

A single run of Curtain Call consists of three acts, each containing two scenes and one boss encounter. The player selects two Protagonists before the run begins, receives a starting deck, and progresses through encounters, adding and upgrading cards along the way. The run ends in victory (all three acts cleared) or defeat (MacGuffin HP reaches zero).

```
Title Screen
    ↓
Protagonist Selection (pick 2)
    ↓
┌── Act I ──────────────────┐
│  Scene 1: Choose 1 of 2   │ → Card Reward
│  Scene 2: Choose 1 of 2   │ → Card Reward
│  Boss                      │ → Card Upgrade
└────────────────────────────┘
    ↓
┌── Act II ─────────────────┐
│  Scene 3: Choose 1 of 2   │ → Card Reward
│  Scene 4: Choose 1 of 2   │ → Card Reward
│  Boss                      │ → Card Upgrade
└────────────────────────────┘
    ↓
┌── Act III ────────────────┐
│  Scene 5: Choose 1 of 2   │ → Card Reward
│  Scene 6: Choose 1 of 2   │ → Card Reward
│  Final Boss                │ → Victory!
└────────────────────────────┘
```

**Run length target:** 15-20 minutes.

## Starting Deck

Every run begins with 8 cards:

| Card                  | Count | Owner         | Description    |
| --------------------- | ----- | ------------- | -------------- |
| Basic Block           | 4     | Neutral       | Gain 5 Block.  |
| Basic Attack (Hero A) | 2     | Protagonist A | Deal 6 damage. |
| Basic Attack (Hero B) | 2     | Protagonist B | Deal 6 damage. |

This gives a functional but boring deck. The player immediately wants to improve it, which drives card reward decisions.

## Deck & Hand Management

- **Hand size:** 5 cards drawn at the start of each turn
- **Draw pile:** Shuffled at the start of combat. When the draw pile is empty, the discard pile is shuffled to form a new draw pile.
- **Discard pile:** Played cards and unplayed hand cards go here at end of turn.
- **End of run deck size:** 14 cards maximum (8 starting + 6 scene rewards). Small enough that every card matters.

## Combat System

### Turn Structure

Each combat encounter follows this loop until the enemy is defeated or the MacGuffin is destroyed:

```
1. TURN START
   - Fire 'turnBegin' event
   - Draw cards to hand size (5)
   - Refresh energy to maximum (3)
   - Enemy intent already visible (revealed at end of previous turn, or start of combat for turn 1)

2. PLAYER PHASE
   - Player views hand, taps cards to play them
   - Each card costs energy; cannot play if insufficient energy
   - Cards resolve immediately on play (damage, block, buffs)
   - Speech bubble animations play for each card
   - Player can tap Protagonists/enemy to inspect stats
   - Player taps "End Turn" when done

3. ENEMY PHASE
   - Enemy executes telegraphed intent
   - Damage is applied: first reduced by Block, remainder hits MacGuffin HP
   - Speech bubbles animate for enemy action
   - Fire 'enemyAction' event

4. TURN END
   - Block resets to 0
   - Tick down temporary status durations
   - Fire 'turnEnd' event
   - Remaining hand cards are discarded
   - Enemy reveals next turn's intent
   - Check win/lose conditions
   - If combat continues, return to step 1
```

### Energy System

- **Base energy per turn:** 3
- **Energy refreshes fully each turn** — unspent energy does not carry over
- **Card costs:** Range from 0 to 3. Most cards cost 1-2.
- **0-cost cards** exist but are weaker or conditional
- **3-cost cards** are powerful but consume an entire turn's energy

### Damage & Defense

**Shared MacGuffin HP:**

- Starting HP: 60 (fixed for now, may scale in future)
- All enemy attacks target the MacGuffin
- Healing restores MacGuffin HP, capped at maximum
- MacGuffin at 0 HP = run over, curtain falls

**Block:**

- Temporary damage buffer applied during the player phase
- When enemy deals damage: `actual_damage = max(0, attack - block)`, block is then fully consumed
- Block resets to 0 at the start of each player turn
- Multiple block cards stack additively
- Does NOT persist between turns — player must actively defend each turn

**Ward:**

- Absorbs N _instances_ of damage regardless of amount
- Ward 1 blocks one hit whether it's 3 damage or 30
- Consumed per hit, expensive to acquire, powerful against big single strikes
- Does persist between turns (it's waiting for hits, not a flat buffer)

**Deflect:**

- Blocks incoming damage AND deals a portion back to the enemy
- e.g., Deflect 4 blocks 4 damage and deals 2 back
- Does not persist between turns

**Ovation:**

- A decaying shield granted by the audience's enthusiasm
- Starts at N and reduces the next hit by that amount, then decays: blocks N on first hit, N-1 on second, N-2 on third, etc.
- Persists across turns until fully depleted (decays to 0) or combat ends
- Rewards early investment — playing Ovation 5 early in an act gives protection over many hits
- Distinct from Block (one-turn burst protection) and Ward (fixed hit count). Ovation is sustained, gradual defense.
- Multiple Ovation sources stack by adding to current value

**Curtain:**

- A persistent flat damage reduction — reduces ALL incoming damage by N per hit
- Persists across turns until removed or combat ends
- e.g., Curtain 2 means every enemy hit deals 2 less damage. A 10-damage hit becomes 8, a 3-hit combo of 5 each becomes 3+3+3.
- Extremely strong against multi-hit enemies, less impactful against single big hits
- Rare and expensive to apply — this is a premium defensive keyword

### Hero Modifiers

Each Protagonist has static modifiers that define their combat role:

- **Attack Bonus:** +N damage on attack cards owned by this hero
- **Defense Specialty:** Bonus value when this hero's cards apply a specific defense type
- **Keyword Affinity:** The hero's signature keyword — their cards are designed to synergize with it

Modifiers are fixed per Protagonist and do not change during a run.

### Enemy Intent System

Enemies telegraph their next action before the player's turn. This is displayed as an icon and number above the enemy silhouette.

**Intent types:**

| Icon | Meaning      | Display                             |
| ---- | ------------ | ----------------------------------- |
| ⚔️   | Attack       | Sword + damage number               |
| ⚔️⚔️ | Multi-attack | Crossed swords + damage × hit count |
| 🛡️   | Defend       | Shield + block amount               |
| 💪   | Buff Self    | Up arrow + buff name                |
| 💀   | Debuff       | Skull + debuff name                 |
| 💛   | Heal         | Heart + heal amount                 |

The player always knows what is coming. This is non-negotiable for fair difficulty. The challenge comes from having limited energy and cards to respond optimally, not from hidden information.

### Enemy Behavior Patterns

Each enemy has a defined action pattern — either a fixed sequence or a weighted random selection from an action pool. Patterns escalate in complexity:

- **Act I enemies:** Simple repeating patterns (Attack, Attack, Defend, repeat)
- **Act I boss:** Slightly more varied, introduces one gimmick
- **Act II enemies:** Mixed patterns with occasional debuffs
- **Act II boss:** Multi-phase or conditional behavior
- **Act III enemies:** Aggressive patterns, status effects, self-healing
- **Final boss:** Complex multi-phase with escalating threat

### Win/Lose Conditions

- **Win encounter:** Enemy HP reaches 0
- **Lose run:** MacGuffin HP reaches 0 at any point
- **Win run:** Defeat the Act III boss

## Between-Encounter Flow

### Scene Reward (After Non-Boss Encounters)

Framed as an intermission — curtain partially drawn, three cards displayed center stage.

1. Player is offered 3 cards: 1 from Protagonist A's pool, 1 from Protagonist B's pool, 1 neutral
2. Player picks exactly 1 — no skip option (keeps deck growth predictable)
3. Card is permanently added to the deck for this run

### Boss Reward (After Boss Encounters)

After defeating an act boss, the player upgrades one existing card in their deck.

1. Player's full deck is displayed
2. Player selects one card to upgrade
3. The card is replaced by its upgraded version (better numbers, added keywords, reduced cost — varies per card)

### Enemy Selection (Before Each Scene)

At the start of each scene, the player chooses between 2 enemies. Each is shown with:

- Silhouette preview
- Enemy name
- HP value
- A brief hint at their gimmick ("Heals each turn", "Hits twice", etc.)

This gives the player agency in difficulty/matchup. If your build is weak to multi-hit attacks, avoid the multi-hit enemy. Meaningful choice without complex branching.

### MacGuffin HP Between Encounters

MacGuffin HP persists across all encounters in a run. There is currently no healing between encounters — what you end a fight with is what you start the next fight with. This creates tension and rewards efficient play.

Future consideration: rest events, healing shops, or other between-encounter options could address this if runs feel too punishing.

## Keywords

Keywords are named abilities on cards and heroes. They are the primary mechanism for synergies and build diversity. Keywords are implemented as event listeners on the event bus.

### Initial Keyword Set

| Keyword        | Type     | Effect                                                                                                                | Notes                                                                              |
| -------------- | -------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Charged**    | Buff     | Consecutive attacks by the same hero deal +N bonus damage. Counter resets when the other hero attacks or on turn end. | Rewards committing to one hero per turn. Tension with wanting to use both.         |
| **Fortify**    | Buff     | Block cards played by this hero grant +N additional block.                                                            | Makes one hero the designated defender.                                            |
| **Piercing**   | Card mod | Attack ignores N points of enemy defense/block.                                                                       | Counter to defensive enemies.                                                      |
| **Persistent** | Card mod | This card's effect carries into next turn. Block persists, buff duration extends by 1.                                | Powerful modifier — turns a basic block into a snowball.                           |
| **Encore**     | Card mod | If this is the last card played in a turn, return it to hand next turn instead of discarding.                         | Rewards careful sequencing. The card you save for last is the one you always have. |
| **Sweeping**   | Card mod | Attack bypasses enemy defensive buffs entirely (but not base HP).                                                     | Specifically useful against buff-heavy enemies.                                    |
| **Ovation**    | Defense  | Decaying shield: blocks N on first hit, N-1 on second, etc. Persists across turns.                                    | Long-term defense investment. Audience is cheering you on.                         |
| **Curtain**    | Defense  | Flat damage reduction of N per hit. Persists across turns.                                                            | Premium defense, devastating against multi-hit enemies.                            |

### Debuffs

Debuffs are applied by enemies to the player's heroes or shared state. They have a duration in turns and create pressure to play around them.

| Debuff            | Target          | Effect                                                         | Thematic Flavor                                                                                 |
| ----------------- | --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Stage Fright**  | One protagonist | Cards from this hero cost +1 energy.                           | The puppet freezes up — the performer is choking under pressure.                                |
| **Heckled**       | One protagonist | Playing a card from this hero deals 1 damage to the MacGuffin. | The audience turns hostile — every move this hero makes invites jeers that chip away at morale. |
| **Weakness**      | Shared          | All attacks deal 50% damage (rounded down).                    | The heroes' strength falters — nothing lands with impact.                                       |
| **Forgetfulness** | Shared          | All damage taken is increased by 50% (rounded up).             | The performers lose their place — defenses slip, cues are missed, and every hit lands harder.   |

**Design notes on debuffs:**

- Stage Fright and Heckled are **enemy → hero** debuffs only. Enemies do not play cards or spend energy, so these debuffs cannot be applied in reverse. Player cards that debuff enemies use Weakness (reduced damage output) instead.
- Stage Fright and Heckled target a _specific_ protagonist, which forces the player to lean on the other hero or accept the penalty. This interacts interestingly with hero-specific synergies — if your main damage dealer gets Stage Fright, do you pay the tax or pivot?
- Weakness and Forgetfulness are shared effects that pressure the whole team. 50% modifiers are deliberately harsh — the player should feel urgency to end the fight or wait out the duration.
- Debuffs have fixed durations (typically 2-3 turns). They are not stackable — reapplying refreshes the duration.
- Some enemies will telegraph debuff intents, giving the player a turn to prepare (e.g., stack block before Forgetfulness hits).

### Buffs (Applied by Player Cards)

In addition to the defensive keywords above, player cards can apply positive statuses:

| Buff                 | Target          | Effect                                                   | Thematic Flavor                                     |
| -------------------- | --------------- | -------------------------------------------------------- | --------------------------------------------------- |
| **Standing Ovation** | Shared          | All attacks deal +N bonus damage for the duration.       | The crowd goes wild — everything hits harder.       |
| **Rehearsed**        | One protagonist | This hero's next N cards cost 1 less energy (minimum 0). | They've practiced this bit — it flows effortlessly. |

More buffs will emerge from playtesting and card design. These two cover the core axes of damage amplification and economy manipulation.

### Keywords as Card Modifiers vs Hero Traits

- **On a card:** The keyword applies only when that card is played. "Piercing 3" on Heavy Strike means that specific attack ignores 3 defense.
- **On a hero:** The keyword applies to all relevant actions by that hero. "Charged 2" on a hero means all consecutive attacks by that hero ramp by 2 per hit.

## Event System Architecture

The event bus is the backbone for all triggered effects. Keywords, status conditions, and enemy abilities all register as listeners rather than being hardcoded into the combat loop.

### Event Bus

```javascript
class EventBus {
  constructor() {
    this.listeners = new Map(); // eventName → [{id, priority, handler}]
  }

  on(eventName, handler, { id = null, priority = 0 } = {}) {
    // Register a listener
    // Higher priority fires first
    // id enables targeted removal (e.g., when a status expires)
  }

  off(eventName, id) {
    // Remove a listener by id
  }

  async emit(eventName, context) {
    // Fire all listeners for this event in priority order
    // Context object is mutable — listeners can modify values
    // Returns the (potentially modified) context
  }

  clear() {
    // Remove all listeners — called at end of each combat
  }
}
```

### Event Catalog

| Event               | Fires When                            | Context Payload                                                     |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `turnBegin`         | Start of player turn                  | `{ turnNumber }`                                                    |
| `turnEnd`           | End of full turn after enemy acts     | `{ turnNumber }`                                                    |
| `onCardPlayed`      | A card is played from hand            | `{ card, hero, energyCost }`                                        |
| `onCardDrawn`       | A card is drawn into hand             | `{ card }`                                                          |
| `beforeDamageDealt` | Before attack damage applies to enemy | `{ amount, sourceHero, sourceCard, enemy }` — `amount` is mutable   |
| `onDamageDealt`     | After damage applied to enemy         | `{ amount, sourceHero, sourceCard, enemy }`                         |
| `beforeDamageTaken` | Before enemy damage hits MacGuffin    | `{ amount, block, sourceEnemy }` — `amount` and `block` are mutable |
| `onDamageTaken`     | After MacGuffin takes damage          | `{ amount, sourceEnemy, remainingHP }`                              |
| `onBlock`           | When block absorbs damage             | `{ amountBlocked, sourceEnemy }`                                    |
| `onHeal`            | When MacGuffin is healed              | `{ amount, sourceCard }`                                            |
| `onEnemyDefeated`   | Enemy HP reaches 0                    | `{ enemy }`                                                         |
| `onStatusApplied`   | A status effect is applied            | `{ status, target, duration }`                                      |
| `onStatusExpired`   | A status effect wears off             | `{ status, target }`                                                |

### Mutable Context Pattern

`before*` events allow listeners to modify values before they resolve. This is how keywords and defensive mechanics interact cleanly:

```javascript
// Fortify: hero's block cards grant bonus block
eventBus.on(
  "onCardPlayed",
  (ctx) => {
    if (ctx.card.type === "block" && ctx.hero.hasKeyword("fortify")) {
      ctx.card.effectValue += ctx.hero.getKeywordValue("fortify");
    }
  },
  { id: "fortify-keyword", priority: 10 },
);

// Ward: absorb an instance of damage entirely
eventBus.on(
  "beforeDamageTaken",
  (ctx) => {
    if (gameState.ward > 0) {
      ctx.amount = 0;
      gameState.ward -= 1;
    }
  },
  { id: "ward-status", priority: 20 },
);

// Charged: consecutive same-hero attacks ramp damage
eventBus.on(
  "beforeDamageDealt",
  (ctx) => {
    if (ctx.sourceHero === gameState.lastAttacker) {
      gameState.chargedCount += 1;
      ctx.amount += gameState.chargedCount * chargedBonus;
    } else {
      gameState.chargedCount = 0;
      gameState.lastAttacker = ctx.sourceHero;
    }
  },
  { id: "charged-keyword", priority: 5 },
);
```

### Priority Ordering

| Priority | Purpose              | Examples                                |
| -------- | -------------------- | --------------------------------------- |
| 20       | Damage nullification | Ward                                    |
| 10       | Stat modification    | Fortify bonus, Brace reduction          |
| 5        | Conditional bonuses  | Charged ramp                            |
| 0        | Default              | Most keyword effects                    |
| -10      | Reactive effects     | Deflect dealing damage back             |
| -20      | Post-resolution      | UI updates, animation triggers, logging |

## Card Structure

```javascript
{
    id: "knight_heavy_strike",
    name: "Heavy Strike",
    owner: "knight",             // hero id or "neutral"
    type: "attack",              // "attack" | "block" | "buff" | "debuff" | "spell"
    cost: 2,                     // energy cost
    description: "Deal 10 damage.",
    effects: [
        { type: "damage", value: 10, target: "enemy" }
    ],
    keywords: [],                // keyword instances on this card
    upgraded: false,
    upgradedVersion: {           // what this card becomes when upgraded
        name: "Heavy Strike+",
        cost: 2,
        description: "Deal 14 damage.",
        effects: [
            { type: "damage", value: 14, target: "enemy" }
        ],
        keywords: []
    },
    speechBubble: {
        text: "WHAM!",
        style: "attack-burst"    // CSS class for bubble appearance
    }
}
```

### Card Types

| Type       | Description                                             | Target             |
| ---------- | ------------------------------------------------------- | ------------------ |
| **Attack** | Deal damage to enemy. Triggers owning hero's animation. | Enemy              |
| **Block**  | Gain Block for this turn.                               | MacGuffin (shared) |
| **Buff**   | Apply positive status to heroes or shared state.        | Hero / shared      |
| **Debuff** | Apply negative status to enemy.                         | Enemy              |
| **Spell**  | Utility — draw cards, gain energy, unique effects.      | Varies             |

### Card Ownership

- **Protagonist cards:** Attack cards trigger that hero's animation and benefit from their attack bonus. Block/buff cards may benefit from the hero's defense specialty.
- **Neutral cards:** Not tied to either hero. Often simpler, MacGuffin-themed. Available to all protagonist pairings.
- **No play restrictions:** Any card in the deck can be played at any time. Strategic differentiation comes from deck construction and synergy, not from gating which cards are playable.

## Enemy Structure

```javascript
{
    id: "stage_rat",
    name: "Stage Rat",
    hp: 25,
    act: 1,
    isBoss: false,
    description: "A scrappy pest. Nothing fancy.",
    gimmickHint: "Straightforward attacker",
    intentPattern: [
        { type: "attack", value: 7 },
        { type: "attack", value: 7 },
        { type: "attack", value: 10 }
    ],
    patternType: "sequential",   // "sequential" | "weighted"
    statuses: [],
    onTurnStart: null,           // optional event hook
    speechBubbles: {
        attack: "SQUEAK!",
        defend: null,
        hurt: "EEK!",
        defeated: "..."
    }
}
```

### Pattern Types

- **Sequential:** Enemy cycles through their intent list in order, looping back to start.
- **Weighted:** Enemy randomly selects from their intent pool each turn with defined weights. Still telegraphed — randomness only affects _which_ intent is chosen, the player always sees it before acting.

## Status Effects

Status effects are temporary modifiers applied to heroes, the MacGuffin, or enemies. They have a duration (number of turns) and register event listeners for their behavior.

```javascript
{
    id: "stage_fright",
    name: "Stage Fright",
    target: "hero",              // "hero" | "enemy" | "shared"
    targetHero: "knight",        // specific protagonist affected
    duration: 2,                 // turns remaining
    effect: "Cards from this hero cost +1 energy",
    icon: "😰",
    onApply: (eventBus, targetHero) => {
        eventBus.on('onCardPlayed', (ctx) => {
            if (ctx.hero === targetHero) {
                ctx.energyCost += 1;
            }
        }, { id: 'stage-fright-status', priority: 15 });
    },
    onExpire: (eventBus) => {
        eventBus.off('onCardPlayed', 'stage-fright-status');
    }
}
```

## Meta-Progression & Persistence

### What Persists Between Runs

- **Unlocked cards:** New cards added to protagonist card pools and neutral pool
- **Unlocked protagonists:** New heroes become selectable (future — start with initial set)
- **Run history:** Win/loss record, fastest clear times (optional, low priority)

### What Does NOT Persist

- **Deck composition:** Built fresh each run
- **MacGuffin HP:** Resets to max each run
- **Card upgrades:** Earned and lost each run

### Unlock System

Unlocks are earned by completing runs or achieving specific milestones. This gives long-term goals beyond individual runs.

- Winning a run with a protagonist pair unlocks 1-2 new cards for those protagonists
- Clearing Act I for the first time unlocks initial card pool expansion
- Future: specific achievements unlock specific cards (e.g., "Win without taking damage in Act I" unlocks a powerful defensive card)

Unlock progress is the primary reason for persistence/database.

### SQLite Schema

The game uses SQLite for persistence. The schema is minimal:

```sql
-- Player identity (keyed by username for now)
CREATE TABLE players (
    username TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP
);

-- Unlocked cards per player
CREATE TABLE unlocked_cards (
    username TEXT REFERENCES players(username),
    card_id TEXT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (username, card_id)
);

-- Run history
CREATE TABLE run_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT REFERENCES players(username),
    protagonist_a TEXT NOT NULL,
    protagonist_b TEXT NOT NULL,
    result TEXT NOT NULL,          -- 'victory' | 'defeat'
    final_act INTEGER NOT NULL,    -- 1, 2, or 3
    final_scene INTEGER NOT NULL,  -- which encounter they reached
    duration_seconds INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Save state for interrupted runs (optional, future)
CREATE TABLE saved_runs (
    username TEXT PRIMARY KEY REFERENCES players(username),
    game_state JSON NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Save State (Future)

Runs are short enough (15-20 min) that save/resume is not critical for initial implementation. If added later, the full game state (deck, HP, current act/scene, enemy state) would be serialized to JSON in the `saved_runs` table. One save slot per player — saving overwrites, completing or abandoning a run deletes it.

## Technical Integration with Parlor

### Route Structure

Curtain Call is a solo game within the Parlor platform but requires server-side persistence, making it a hybrid:

- `/solo/curtain-call` — Title screen, protagonist selection, game entry
- `/solo/curtain-call/play` — Active game (all game logic runs client-side)
- `/api/curtain-call/player/{username}` — GET player data (unlocks, history)
- `/api/curtain-call/unlock` — POST new card unlock
- `/api/curtain-call/run-complete` — POST run result

### Client-Server Split

- **Client-side (JavaScript):** ALL game logic — combat, deck management, event bus, card resolution, enemy AI, turn flow. The game runs entirely in the browser during a run.
- **Server-side (FastAPI):** Player authentication (username only), unlock tracking, run history recording, serving the initial page with player data embedded.

The server is not involved in gameplay. It's a persistence layer. This means:

- No anti-cheat (trusted users, personal use)
- No server validation of game actions
- Player data is loaded once at game start and written at run completion + unlock events
- If the browser closes mid-run, the run is lost (acceptable for initial version)

### File Structure Addition to Parlor

```
static/
├── css/
│   └── solo/
│       └── curtain-call.css       # All game styles
├── js/
│   └── solo/
│       └── curtain-call/
│           ├── game.js            # Main game controller
│           ├── combat.js          # Combat loop and turn management
│           ├── event-bus.js       # Event system
│           ├── cards.js           # Card definitions and logic
│           ├── enemies.js         # Enemy definitions and AI
│           ├── heroes.js          # Protagonist definitions
│           ├── renderer.js        # DOM manipulation and animations
│           └── persistence.js     # API calls for saves/unlocks
templates/
└── solo/
    └── curtain-call.html          # Game page template
```
