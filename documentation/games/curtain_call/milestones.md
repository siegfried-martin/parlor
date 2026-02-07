# Curtain Call — Milestones

## Progress

| #   | Milestone                 | Status      |
| --- | ------------------------- | ----------- |
| 1   | Static Stage Layout       | ✅ Complete |
| 2   | Card Hand Display         | ✅ Complete |
| 3   | Combat State Display      | ✅ Complete |
| 4   | Card Play Flow            | ✅ Complete |
| 5   | Speech Bubbles            | ✅ Complete |
| 6   | Puppet Animations         | ✅ Complete |
| 7   | Basic Turn Loop           | ✅ Complete |
| 8   | Single Combat (Stage Rat) | ✅ Complete |
| 9   | Enemy Intent System       | ✅ Complete |
| 10  | Card Rewards Screen       | ✅ Complete |
| 11  | Act I Scene Flow          | ✅ Complete |
| 12  | Boss: The Critic          | ✅ Complete |
| 13  | Keywords Implementation   | ✅ Complete |
| 14  | Debuff System             | ✅ Complete |
| 15  | Defensive Keywords        | ✅ Complete |
| 16  | Starting Menu & Scene Flow| ✅ Complete |
| 16b | JS File Refactor          | Next        |
| 17  | Card Logic Overhaul       | Pending     |
| 18  | Full Act I Run            | Pending     |
| 19  | Act II Implementation     | Pending     |
| 20  | Act III Implementation    | Pending     |
| 21  | Full Run Flow             | Pending     |
| 22  | Curtain Transitions       | Pending     |
| 23  | Polish & Complete Assets  | Pending     |
| 24  | Persistence Integration   | Pending     |

---

## Milestone Details

### 1. Static Stage Layout ✅

Theater stage with four vertical regions, placeholder silhouettes, and basic UI.

**Acceptance Criteria:**

1. Warm parchment gradient background (#F4E4C1 center → #E8D4A8 → #D4A055 edges)
2. 4 vertical regions: enemy (~25%), stage (~30%), hand (~30%), controls (~15%)
3. Two hero silhouettes (Aldric left, Pip right) on the stage
4. MacGuffin centered between heroes with HP bar
5. Enemy silhouette in enemy area with HP bar and intent icon
6. Audience strip at bottom (6-8 head silhouettes)
7. End Turn button visible in controls area
8. Energy indicator showing "3"
9. All elements visible at 375×812 with no scrolling or clipping
10. Near-black silhouettes (#1A1A2E) with puppet sticks (#3D2B1F)

### 2. Card Hand Display

Render playable cards in the hand region with proper styling and interaction.

**Acceptance Criteria:**

1. 5 cards display horizontally in hand region
2. Each card shows: name (top), energy cost (top-left badge), description text (center)
3. Card background: #FAF0DB with 1-2px darker border (#C4A35B)
4. Cards sized to be readable at 375px width (~60-70px wide each)
5. Tapping a card lifts it ~8px via translateY (visual selection feedback)
6. Tapping selected card or another card deselects
7. If hand has >5 cards, enable horizontal scroll (overflow-x: auto)
8. Use starting deck data: 4× Basic Block (cost 1, +5 Block), 2× Hammer Swing (cost 2, Deal 6 damage), 2× Quick Jab (cost 1, Deal 4 damage, draw 1)

### 3. Combat State Display

HP bars, intent icons, and status effect indicators.

**Acceptance Criteria:**

1. Hero HP bars below each silhouette (current/max)
2. MacGuffin HP bar centered and clearly labeled
3. Enemy HP bar with current/max display
4. Enemy intent icon (sword for attack, shield for defend) with value
5. Status effect icons display below HP bars when active
6. All values update reactively when state changes

### 4. Card Play Flow

Card selection, energy cost validation, and discard animation.

**Acceptance Criteria:**

1. Tapping a selected card plays it (if enough energy)
2. Energy cost deducted from energy pool on play
3. Cards with insufficient energy are visually dimmed
4. Played card animates out of hand (fade/slide to discard)
5. Hand re-centers after card removal
6. Energy display updates immediately on card play

### 5. Speech Bubbles

Combat feedback via themed speech bubbles with animations.

**Acceptance Criteria:**

1. Damage bubbles appear near the target (red text, e.g., "-7")
2. Block/defense bubbles appear near the defender (blue text, e.g., "+5 Block")
3. Bubbles animate in (pop/scale) and fade out after ~1.5s
4. Bubbles positioned correctly relative to their character
5. Multiple simultaneous bubbles don't overlap
6. Color coding: red = damage, blue = defense, gold = healing, purple = debuffs

### 6. Puppet Animations

CSS-only puppet animations for all game actions.

**Acceptance Criteria:**

1. Idle: gentle vertical bob (translateY 2-3px oscillation, ~2s loop)
2. Attack: lunge toward target (translateX ~30px) and snap back (~0.3s)
3. Hurt: horizontal shake (rapid translateX oscillation, ~0.3s)
4. Block: slight backward lean (rotate -3 to -5deg, ~0.3s)
5. Defeat: rotate 45deg + translateY down + fade out (~0.8s)
6. Animations triggered by adding/removing CSS classes
7. All animations use CSS transforms only (no JavaScript animation)

### 7. Basic Turn Loop

Draw phase, play phase, enemy action, and damage resolution.

**Acceptance Criteria:**

1. Turn starts: draw 5 cards, reset energy to 3
2. Player can play cards during their turn
3. End Turn button ends player phase
4. Enemy executes its declared intent after player turn ends
5. Damage applied to correct targets (enemy → MacGuffin or heroes, player cards → enemy)
6. Turn counter increments
7. Next turn: new draw, new energy, enemy declares new intent

### 8. Single Combat (Stage Rat)

First complete fight using starting deck against Stage Rat enemy.

**Acceptance Criteria:**

1. Stage Rat: 28 HP, alternates between Attack 7 and Defend 4
2. Starting deck: 4× Basic Block, 2× Hammer Swing, 2× Quick Jab
3. Combat plays to completion (enemy defeated or MacGuffin destroyed)
4. Victory screen on enemy HP reaching 0
5. Defeat screen on MacGuffin HP reaching 0
6. All combat math is correct (damage, block, HP tracking)

### 9. Enemy Intent System

Intent declaration with multi-attack display and varied patterns.

**Acceptance Criteria:**

1. Enemy intent shown at start of each turn before player acts
2. Attack intents show sword icon + damage value
3. Defend intents show shield icon + block value
4. Multi-attack intents show "×N" multiplier (e.g., "4 ×3")
5. Intent icons are clear and readable at mobile scale
6. Intent updates correctly each turn based on enemy AI pattern

### 10. Card Rewards Screen

Post-combat card selection (choose 1 of 3).

**Acceptance Criteria:**

1. After combat victory, show 3 card options
2. Cards displayed larger than in-hand (readable details)
3. Tapping a card selects it with visual highlight
4. Confirm button adds selected card to deck
5. Skip option to take no card
6. Card pool draws from the current protagonist's available cards

### 11. Act I Scene Flow

Two scenes with enemy choice, leading to boss.

**Acceptance Criteria:**

1. Scene selection: choose 1 of 2 enemies (show silhouette + name)
2. After Scene 1 combat + reward, advance to Scene 2 choice
3. After Scene 2 combat + reward, advance to Act I Boss
4. Progress indicator shows current position in act
5. Different enemies available in each scene slot

### 12. Boss: The Critic

First boss with phase transition and signature mechanics.

**Acceptance Criteria:**

1. The Critic: 80 HP, larger silhouette than regular enemies
2. Phase 1 (>50% HP): Scathing Review (12 damage) / Nitpick (7 damage + Stage Fright)
3. Phase 2 (≤50% HP): gains Heal 5 when applying debuffs
4. Boss defeat triggers act completion with card upgrade reward
5. Boss HP bar visually distinct from regular enemies
6. Phase transition has visual/speech bubble indicator

### 13. Keywords Implementation

Charged, Fortify, Encore, Persistent, Piercing.

**Acceptance Criteria:**

1. Charged: card powers up if held in hand for a turn, plays at enhanced value
2. Fortify: Block persists between turns (doesn't expire)
3. Encore: card returns to hand instead of discarding (limited uses)
4. Persistent: status effect lasts until explicitly removed
5. Piercing: damage ignores Block
6. Keywords display as labeled tags on cards
7. Keyword effects resolve correctly in combat via event bus

### 14. Debuff System

Stage Fright, Heckled, Weakness, Forgetfulness.

**Acceptance Criteria:**

1. Stage Fright: increase card costs by 1 for N turns
2. Heckled: take N damage at start of each turn
3. Weakness: reduce damage dealt by 25% for N turns
4. Forgetfulness: draw 1 fewer card per turn for N turns
5. Debuff icons display with duration counters
6. Debuffs tick down and expire correctly
7. Purple color coding for all debuff indicators

### 15. Defensive Keywords

Ward, Ovation, Curtain, Deflect.

**Acceptance Criteria:**

1. Ward: absorb next N instances of damage (regardless of amount)
2. Ovation: audience throws bonus healing at end of turn
3. Curtain: prevent all damage for 1 turn (hero-specific cooldown)
4. Deflect: return percentage of blocked damage to attacker
5. Visual indicators for active defensive effects
6. Correct interaction with other keywords (e.g., Piercing vs Ward)

### 16. Starting Menu & Scene Flow

Complete game entry flow from title screen through scene transitions into combat.

**Acceptance Criteria:**

#### A. Title/Starting Menu

1. Title screen displays game name "Curtain Call" with theatrical styling
2. "New Performance" button to begin run setup
3. Protagonist selection panel shows both Aldric and Pip
   - Each `.cs-card` has `data-protagonist` attribute and `.selected` class
   - Both start selected (minimum 2 required); clicking a card when both are selected shows a shake feedback
   - Gold border glow on selected cards, dimmed when unselected
4. Starting Attack shown per protagonist inside each card
   - Aldric: Hammer Swing (6 dmg), Pip: Quick Jab (4 dmg, draw 1)
   - Displayed as selectable pills (`.cs-attack-option.selected`) — one option each for now, pre-selected
5. "Raise the Curtain" button to start the run
6. Menu fits within 375×812 viewport without scrolling

#### B. Stage Layout Arrangement

1. Reposition UI elements for cleaner visual hierarchy:
   - Enemy area at top (~20%, z-index 42 to render above valance)
   - Stage area with heroes and MacGuffin (~25%)
   - Hand area for cards (~35%)
   - Controls/audience area at bottom (~20%)
2. Ensure all elements visible and properly sized at mobile scale
3. Stage edge divider clearly separates performance area from hand/controls
4. Back button or menu access from gameplay screen

#### C. Scene Transitions

1. **Menu → Game transition:**
   - `startPerformance()` keeps curtains closed, shows scene selection overlay on top (z-index 100)
   - `initializeAnimations()` called here (not in `setup()`) so audience doesn't animate during menus
   - Player picks enemy from overlay → `selectEnemy()` opens curtains to reveal combat
2. **Between scenes:**
   - `advanceScene()` uses `curtainClose()` helper to close curtains (~1.3s)
   - Scene selection overlay appears on top of closed curtains
   - Player picks enemy → `selectEnemy()` opens curtains via `curtainOpen()`
3. **Boss transition:**
   - `startBossCombat()` sets up boss behind closed curtains, then calls `curtainOpen()`
4. **Curtain helpers:**
   - `curtainClose(callback)` — closes curtains, executes callback, does NOT auto-open
   - `curtainOpen(callback)` — opens curtains from closed state
   - `curtainTransition(callback)` — full close→callback→open cycle (used for auto transitions)
5. All transitions use CSS animations (no heavy JS animation libraries)

#### D. Game State Flow

1. Menu → Protagonist Confirm → Scene Selection (curtains closed) → Combat (curtains open) → Reward → Scene Selection (curtains close) → Combat (curtains open) → ... → Boss → Victory/Defeat
2. State machine tracks current phase (menu, character-select, scene-select, combat, reward, act-complete)
3. `isAnimating` flag prevents interaction during curtain transitions
4. Proper cleanup when returning to menu or restarting

---

### 16b. JS File Refactor

Split the 3400-line `game.js` monolith into logical modules before the card overhaul.

**Acceptance Criteria:**

1. `cards.js` — `CARD_DEFINITIONS`, `CARD_POOLS`, `STARTING_DECK`, `KEYWORD_GLOSSARY`
2. `enemies.js` — Enemy definitions, act structure, enemy patterns
3. `game.js` — `CurtainCallGame` class (combat, UI, rendering, state management)
4. Files loaded via separate `<script>` tags in dependency order
5. No behavioral changes — pure extraction refactor
6. All existing gameplay works identically after split

**Priority:** Must complete before Milestone 17 (Card Logic Overhaul). Working in a 3400-line file makes the card overhaul unnecessarily painful.

---

### 17. Card Logic Overhaul

Refactor card system for cleaner data flow, better extensibility, and proper keyword/effect resolution.

**Acceptance Criteria:**

1. Card definitions separated into data file (JSON or JS module)
2. Card effects use standardized action system:
   - `{ type: 'damage', value: 6, target: 'enemy' }`
   - `{ type: 'block', value: 5, target: 'macguffin' }`
   - `{ type: 'draw', value: 1 }`
   - `{ type: 'apply_status', status: 'weakness', duration: 2, target: 'enemy' }`
3. Keywords modify card behavior through event hooks:
   - `onPlay`, `onDiscard`, `onDraw`, `onTurnStart`, `onTurnEnd`
4. Effect resolution order is deterministic and documented
5. Card targeting system supports: `enemy`, `self`, `macguffin`, `all_enemies`, `random`
6. Upgrade paths defined in card data (base → upgraded version)
7. Card pool organized by protagonist and rarity
8. Unit tests for core card resolution logic (if test framework exists)

---

### 18. Full Act I Run

Complete Act I playthrough from scene selection through boss.

**Acceptance Criteria:**

1. Scene 1 → reward → Scene 2 → reward → Boss → upgrade
2. All 4 Act I enemies available in scene slots (Stage Rat, Prop Goblin, Spotlight Sprite, Mime)
3. Card rewards pull from protagonist's card pool
4. Boss upgrade offers meaningful choice
5. Difficulty feels appropriate for starting deck
6. Run takes ~5 minutes for Act I

### 19. Act II Implementation

4 new enemies and The Director boss.

**Acceptance Criteria:**

1. 4 Act II enemies implemented with unique mechanics
2. The Director boss with signature abilities
3. Act II accessible after Act I completion
4. Difficulty step-up from Act I
5. Scene selection works same as Act I

### 20. Act III Implementation

4 new enemies and The Playwright boss.

**Acceptance Criteria:**

1. 4 Act III enemies implemented with unique mechanics
2. The Playwright boss as final boss
3. Act III accessible after Act II completion
4. Highest difficulty, requires evolved deck
5. Victory over Playwright = run complete

### 21. Full Run Flow

Protagonist selection through victory or defeat.

**Acceptance Criteria:**

1. Title screen with game name and "Play" button
2. Protagonist selection: choose Aldric or Pip (show silhouette + description)
3. Selected protagonist determines starting deck and card pool
4. Run flows: Act I → Act II → Act III → Victory
5. Defeat at any point shows defeat screen with "Try Again" option
6. Victory screen shows run summary

### 22. Curtain Transitions

Themed scene and act transitions.

**Acceptance Criteria:**

1. Curtain-close animation between scenes (curtains sweep in from sides)
2. Act title card displayed during act transitions
3. Victory: curtain call with audience applause animation
4. Defeat: curtain falls with audience boo animation
5. Transitions are smooth and don't feel sluggish (~1-2s)

### 23. Polish & Complete Assets

All character silhouettes, expressions, and speech bubble text.

**Acceptance Criteria:**

1. All 12 regular enemies have unique SVG silhouettes
2. All 3 bosses have larger, detailed SVG silhouettes
3. Eye/mouth cutouts on all characters with expression states
4. All speech bubble text from assets.md implemented
5. Audience variety (different shapes/accessories)
6. Visual consistency across all assets

### 24. Persistence Integration

SQLite storage for unlocks and run history.

**Acceptance Criteria:**

1. SQLite database stores completed runs
2. Run history: protagonist used, outcome, duration, cards collected
3. Unlock tracking for any future unlockable content
4. API endpoints for save/load
5. Data survives server restart
6. No impact on gameplay if database is unavailable (graceful degradation)
