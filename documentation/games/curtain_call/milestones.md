# Curtain Call — Milestones

## Progress

| #   | Milestone                  | Status      |
| --- | -------------------------- | ----------- |
| 1   | Static Stage Layout        | ✅ Complete |
| 2   | Card Hand Display          | ✅ Complete |
| 3   | Combat State Display       | ✅ Complete |
| 4   | Card Play Flow             | ✅ Complete |
| 5   | Speech Bubbles             | ✅ Complete |
| 6   | Puppet Animations          | ✅ Complete |
| 7   | Basic Turn Loop            | ✅ Complete |
| 8   | Single Combat (Stage Rat)  | ✅ Complete |
| 9   | Enemy Intent System        | ✅ Complete |
| 10  | Card Rewards Screen        | ✅ Complete |
| 11  | Act I Scene Flow           | ✅ Complete |
| 12  | Boss: The Critic           | ✅ Complete |
| 13  | Keywords Implementation    | ✅ Complete |
| 14  | Debuff System              | ✅ Complete |
| 15  | Defensive Keywords         | ✅ Complete |
| 16  | Starting Menu & Scene Flow | ✅ Complete |
| 16b | JS File Refactor           | ✅ Complete |
| 16c | Second JS Refactor         | ✅ Complete |
| 17  | v2 Health System           | ✅ Complete |
| 18  | v2 Damage Resolution       | ✅ Complete |
| 19  | v2 Keyword Engine          | ✅ Complete |
| 20  | v2 Card & Deck Overhaul    | ✅ Complete |
| 21  | v2 Enemy Data Overhaul     | ✅ Complete |
| 22  | v2 Ovation Rework          | ✅ Complete |
| 23  | Act I Playable (v2)        | ✅ Complete |
| 24  | Damage Preview UI          | Deferred    |
| 25  | Starting Deck Selection    | ✅ Complete |
| 26  | Act II Enemies & Boss      | ✅ Complete |
| 27  | Act II Playable            | ✅ Complete |
| 28  | Act III Enemies & Boss     | ✅ Complete |
| 29  | Act III & Full Run         | ✅ Complete |
| 30  | Drag-to-Play & UX Polish   | ✅ Complete |
| 31  | Deck List & Card Removal   | Pending     |
| 32  | Attack Animations          | Pending     |
| 33  | Voice Lines & Dialogue     | Pending     |
| 34  | Enemy SVG Art              | Pending     |
| 35  | Game Rebalancing           | Pending     |
| 36  | V1 Playtest Release        | Pending     |
| 37  | Card Upgrade Rewards       | Pending     |
| 38  | Curtain Transitions Polish | Pending     |
| 39  | Persistence & Run History  | Pending     |
| 40  | Narrative Events           | Pending     |
| 41  | Shop & Reward System       | Pending     |
| 42  | Unlocks & Meta-Progression | Pending     |

---

## Execution Plan

The v2 rules redesign 4 core systems: health, damage resolution, keywords, and enemies. The milestones below are ordered so each builds on the last. Every milestone should be testable independently — no milestone requires forward-referencing code that doesn't exist yet.

### Dependency Graph

```
17 (Health) ──→ 18 (Damage Resolution) ──→ 19 (Keywords) ──→ 20 (Cards)
                                                  │               │
                                                  ↓               ↓
                                            21 (Enemies) ──→ 23 (Act I Playable)
                                                  │
                                            22 (Ovation) ─────────↗
                                                                  │
                                     24 (Preview) ────────────────↗
                                     25 (Deck Select) ────────────↗
                                                                  │
                                                            26-29 (Acts II-III)
                                                                  │
                                                            30 (Drag-to-Play) ✅
                                                                  │
                                                            31-35 (Pre-V1 Polish)
                                                                  │
                                                            36 (V1 Playtest)
                                                                  │
                                                            37-42 (Post-V1)
```

### What to read per milestone

Each milestone lists which files the AI session should read. Thanks to the refactor, no session needs to read more than ~800 lines of game code at a time.

---

## Completed Milestone Details

*Milestones 1–16c are complete. Their acceptance criteria are preserved here for reference but collapsed for brevity.*

<details>
<summary>Milestones 1–16c (click to expand)</summary>

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

### 2. Card Hand Display ✅

Render playable cards in the hand region with proper styling and interaction.

### 3. Combat State Display ✅

HP bars, intent icons, and status effect indicators.

### 4. Card Play Flow ✅

Card selection, energy cost validation, and discard animation.

### 5. Speech Bubbles ✅

Combat feedback via themed speech bubbles with animations.

### 6. Puppet Animations ✅

CSS-only puppet animations for all game actions.

### 7. Basic Turn Loop ✅

Draw phase, play phase, enemy action, and damage resolution.

### 8. Single Combat (Stage Rat) ✅

First complete fight using starting deck against Stage Rat enemy.

### 9. Enemy Intent System ✅

Intent declaration with multi-attack display and varied patterns.

### 10. Card Rewards Screen ✅

Post-combat card selection (choose 1 of 3).

### 11. Act I Scene Flow ✅

Two scenes with enemy choice, leading to boss.

### 12. Boss: The Critic ✅

First boss with phase transition and signature mechanics.

### 13. Keywords Implementation ✅

Charged, Fortify, Encore, Persistent, Piercing.

### 14. Debuff System ✅

Stage Fright, Heckled, Weakness, Forgetfulness.

### 15. Defensive Keywords ✅

Ward, Ovation, Curtain, Deflect.

### 16. Starting Menu & Scene Flow ✅

Complete game entry flow from title screen through scene transitions into combat.

### 16b. JS File Refactor ✅

Split the 3400-line `game.js` monolith into data modules.

**Result:**
- `cards.js` (415 lines) — card definitions, pools, glossary
- `enemies.js` (82 lines) — enemy data, act structure
- `audience.js` (149 lines) — audience type data
- `game.js` (2775 lines) — CurtainCallGame class

### 16c. Second JS Refactor ✅

Split the 2775-line `game.js` class into logical concerns using `Object.assign(prototype)`.

**Result:**
- `game.js` (369 lines) — core class, constructor, deck, debug
- `combat.js` (799 lines) — turn loop, enemy AI, card play, effects
- `renderer.js` (628 lines) — card/HP/speech rendering
- `ui.js` (757 lines) — events, menus, scene flow, rewards, zoom
- `audience.js` (429 lines) — audience data + animation methods

See `architecture.md` for full file layout and method inventory.

</details>

---

## v2 Milestones

*Reference docs: `updated_rules/curtain_call_ruleset_v2.md`, `curtain_call_keywords_v2.md`, `curtain_call_enemies_v2.md`, `curtain_call_cards_v2.csv`*

---

### 17. v2 Health System

Add protagonist HP (per-combat) alongside the existing MacGuffin HP (per-run). This is the foundation for the entire v2 combat system.

**Read:** `game.js`, `combat.js`, `renderer.js`, `curtain-call.html` (stage area only)

**Acceptance Criteria:**

1. **MacGuffin HP** is now the run-level resource:
   - Starting HP: 50 (exact value TBD during balance)
   - Cannot be healed — display with no heal indicators
   - MacGuffin at 0 HP = run over (game defeat)
2. **Protagonist HP** is per-combat:
   - Aldric: 20 HP, Pip: 10 HP
   - Fully resets after each combat encounter
   - Protagonist at 0 HP = **knockout** (cannot play that protagonist's cards for rest of combat)
   - Protagonists CAN be healed during combat
3. **UI changes:**
   - HP bars displayed below each protagonist silhouette (Aldric and Pip)
   - MacGuffin HP bar visually distinct (different color/style to signal "permanent")
   - Knockout state visually shown (dimmed puppet, "KO" indicator)
   - Knocked-out protagonist's cards in hand are dimmed/unplayable
4. **State tracking:**
   - `combatState.aldric = { currentHP, maxHP }` and `combatState.pip = { currentHP, maxHP }`
   - `combatState.macguffin` remains but `block` moves to a global pool (see milestone 18)
   - Knockout flag per protagonist
5. **No behavioral changes to existing enemies yet** — enemy attacks still target MacGuffin only

---

### 18. v2 Damage Resolution

Implement the 5-step damage resolution order: Taunt → Distract → Shield → Block → Retaliate. This replaces the current simple block-then-damage logic.

**Read:** `combat.js`, `renderer.js`

**Acceptance Criteria:**

1. **Damage resolution pipeline** (per hit):
   - Step 1: **Taunt** — If active, redirect hit to taunting protagonist. Decrement Taunt by 1.
   - Step 2: **Distract** — If target has Distract, negate entire hit. Decrement by 1. Stop.
   - Step 3: **Shield** — Protagonist-specific. Reduce remaining damage. Shield reduced by absorbed amount.
   - Step 4: **Block** — Global pool. Reduce remaining damage. Block reduced by absorbed amount.
   - Step 5: **Retaliate** — Deal Retaliate amount back to attacker.
2. **Multi-hit attacks** resolve each hit through the full pipeline independently
3. **Block is a global pool** (shared across MacGuffin and all protagonists)
4. **Shield is protagonist-specific** (only reduces damage to that protagonist)
5. **Turn reset behavior:**
   - Block resets to 0 at start of enemy turn (after player plays cards)
   - Shield resets to 0 at start of enemy turn
   - Distract resets to 0 at start of enemy turn
   - Taunt resets to 0 at start of enemy turn
   - Retaliate resets to 0 at start of enemy turn
6. **AoE attacks** hit MacGuffin + both protagonists. Each target resolves damage independently.
7. All existing speech bubbles work with the new pipeline (show blocked amounts, redirects, etc.)
8. Refactor `enemyAttack()` in `combat.js` to use the new pipeline

---

### 19. v2 Keyword Engine

Replace the current ad-hoc keyword system with the full v2 keyword set. This is the largest single milestone.

**Read:** `combat.js`, `cards.js` (for KEYWORD_GLOSSARY structure), `updated_rules/curtain_call_keywords_v2.md`

**Acceptance Criteria:**

#### Positive Keywords (13)
1. **Block** — global damage reduction pool, resets at turn start
2. **Distract** — negate one entire hit per stack, resets at turn start
3. **Taunt** — redirect hit to protagonist, resets at turn start
4. **Shield** — protagonist-specific damage reduction, resets at turn start
5. **Regenerate** — heal at start of turn, decays by 1 each turn
6. **Retaliate** — deal damage back to attacker per hit, resets at turn start
7. **Inspire** — permanent +1 damage per stack on all attacks
8. **Fortify** — +1 bonus Block per Fortify when gaining Block, decays by 1
9. **Piercing** — attacks bypass Block and Shield, decays by 1
10. **Accuracy** — attacks bypass Taunt/Distract, ignore Retaliate, decays by 1
11. **Ward** — negate one debuff application, permanent until consumed
12. **Luck** — 10% per stack chance for 1.5× damage, decays by 1 (player-only)
13. **Flourish** — double all Ovation gains and losses, resets at turn start

#### Negative Keywords (11)
1. **Poison** — 1 damage per stack at turn start + suppresses healing, decays by 1
2. **Burn** — 1 damage per stack at turn start, decays by 1
3. **Stage Fright** — cannot play attack cards, decays by 1
4. **Heckled** — cannot play non-attack cards, decays by 1
5. **Forgetful** — 50% reduced damage dealt, decays by 1
6. **Vulnerable** — 50% increased damage taken, decays by 1
7. **Weak** — 50% reduced Block/Shield generation, decays by 1
8. **Confused** — 50% chance Distract/Taunt/Retaliate doesn't trigger, decays by 1
9. **Curse** — deal Curse damage at end of turn (through Shield→Block), consumed on trigger
10. **Fear** — permanent, converts to Stage Fright 1 at 5 stacks, resets to 0
11. **Frustration** — permanent, converts to Heckled 1 at 5 stacks, resets to 0

#### Implementation Requirements
12. Keywords stored as structured state: `{ stacks: N, target: 'aldric'|'pip'|'global'|'enemy' }`
13. **Ward intercepts** debuff application — check Ward before applying any negative keyword
14. **Keyword interaction matrix** implemented (Piercing vs Block/Shield, Accuracy vs Taunt/Distract/Retaliate, Poison vs Regenerate)
15. Update `KEYWORD_GLOSSARY` in `cards.js` with all 24 keywords
16. Status effect display (`renderStatusEffects`) updated for all keywords with proper icons
17. Old v1 keywords removed: Charged, Encore, Curtain (as defensive keyword), Deflect, Ovation (as keyword — becomes meter), old Ward/Weakness/Heckled/Stage Fright semantics replaced

---

### 20. v2 Card & Deck Overhaul

Replace all card definitions with v2 cards. Update the card effect system to support all new keywords.

**Read:** `cards.js`, `combat.js` (executeCardEffects), `updated_rules/curtain_call_cards_v2.csv`

**Acceptance Criteria:**

1. **Card definitions** rewritten to v2 spec (34 cards):
   - Aldric Basics (2): Galvanize, Bulwark
   - Pip Basics (2): Quick Jab, Lucky Shot
   - MacGuffin (2): Block, Inspire
   - Aldric pool (12): Aegis, Burning Devotion, Enabling Strike, Protective Stance, Protect, Iron Wall, True Strike, Inspirational Shout, Cleanse, Aggressive Strike, Captivating Strike, Stoic Resistance
   - Pip pool (12): Good Fortune, Create Opportunity, Loaded Insult, Coup de Grace, Pip's Cocktail, Annoying Poke, Stylish Dance, Hit Where It Hurts, Vex, Best Explanation, Ultimate Jeer, Flirtatious Jeer
2. **Rarity system:** Basic, Uncommon, Rare — affects card pool selection
3. **Card type system:** Attack, Defense, Action — affects Stage Fright/Heckled card filtering
4. **Effect types** expanded to cover all v2 actions:
   - `damage`, `block`, `shield`, `taunt`, `distract`, `retaliate`
   - `heal` (protagonist-targeted), `draw`, `energy`
   - `inspire`, `fortify`, `piercing`, `accuracy`, `ward`, `luck`, `flourish`, `regenerate`
   - `inflict` (any debuff: poison, burn, fear, frustration, vulnerable, weak, confused, forgetful, curse, stageFright, heckled)
   - `cleanse` (remove specific debuffs from target)
   - Dynamic effects: `damagePerDebuff`, `damageFromOvation`, `convertOvation`, `reduceCost`, `blockOnDraw`
5. **Starting deck** updated: 3× chosen Aldric Basic + 3× chosen Pip Basic + 3× Block + 1× Inspire = 10 cards
6. `CARD_POOLS` organized by protagonist + rarity
7. `executeCardEffects()` in `combat.js` handles all new effect types
8. Card descriptions use v2 language conventions ("Gain", "Inflict", "Deal", "Draw")
9. Cost 0 cards work correctly (Protect)

---

### 21. v2 Enemy Data Overhaul

Rewrite all enemy definitions to v2 spec. Implement enemy passives and phase transitions.

**Read:** `enemies.js`, `combat.js` (executeEnemyTurn, setNextEnemyIntent), `updated_rules/curtain_call_enemies_v2.md`

**Acceptance Criteria:**

1. **Act I enemies** redefined (v2 stats):
   - Stage Rat: 25 HP, pattern [Atk 5, Atk 5, AoE 2]
   - Rusty Knight: 30 HP, passive *Rusty Armor* (starts with 3 Block), pattern [Block 5, Atk 7, AoE 3]
   - Moth Swarm: 20 HP, passive *Erratic* (immune Fear/Frustration), pattern [Atk 2×3, AoE 1×2, Atk 2×3]
   - Stagehand: 25 HP, passive *Curtain Rigging* (+1 Inspire end of turn), pattern [Atk 4, Atk 4, AoE 2]
2. **The Critic** redefined:
   - 45 HP, passive *Scathing Pen* (heal 3 on debuff inflict)
   - Phase 1: [Atk 6, Inflict Forgetful 2, AoE 3]
   - Phase 2 (<50% HP): [Atk 8, Inflict Vulnerable 2 all, Atk 5×2], gains 5 Block on transition
3. **Enemy passive system:**
   - Passives stored in enemy definition data
   - Passive effects triggered at appropriate times (start of fight, end of turn, on damage, on debuff, etc.)
   - Passive icon/text displayed in enemy info area
4. **AoE attack type:**
   - `{ type: 'attack', value: N, target: 'all' }` hits MacGuffin + both protagonists
   - Each target resolves through damage pipeline independently
5. **Phase transition system:**
   - Boss enemies have `phases` array with HP thresholds
   - On crossing threshold: change pattern, optionally trigger transition effects (gain Block, clear debuffs, etc.)
   - Visual indicator for phase change (speech bubble, flash)
6. **Enemy keyword usage:**
   - Enemies can gain/use: Block, Shield, Regenerate, Inspire, Retaliate, Accuracy
   - Enemy Block/Shield resets same as player (start of their turn)
   - Enemy Regenerate heals at start of enemy turn
7. Only Act I enemies need to be fully playable for this milestone. Acts II–III data can be defined but untested.

---

### 22. v2 Ovation Rework

Replace the current Ovation system with the v2 crowd meter (range 0–5, per-hit gain, turn decay, damage bonus tiers).

**Read:** `combat.js` (dealDamageToEnemy, enemyAttack, startTurn), `renderer.js`

**Acceptance Criteria:**

1. **Ovation range:** 0–5 (hard cap)
2. **Gain:** +1 per individual hit dealt to an enemy (not per card — multi-hit cards gain multiple)
3. **Decay:** −1 at start of each player turn
4. **Loss:** −1 on each instance of unblocked damage to MacGuffin (damage that gets through all defenses)
5. **Damage bonus tiers:**
   - Ovation 0–1: No bonus
   - Ovation 2–4: +1 damage on all attacks
   - Ovation 5: +2 damage on all attacks
6. **Resets between encounters** — starts at 0 each fight
7. **Flourish interaction:** When Flourish is active, all gains and losses are doubled
8. **UI:** Ovation meter displayed prominently (5 segments/stars/pips). Current level clearly visible.
9. **Audience visual reaction** tied to Ovation level (existing audience system reacts to changes)
10. Remove old Ovation behavior (was a decaying shield)

---

### 23. Act I Playable (v2)

Integrate all v2 systems into a complete, playable Act I run. This is the first integration checkpoint.

**Read:** `ui.js` (scene flow), `combat.js`, `enemies.js`

**Acceptance Criteria:**

1. Complete Act I flow: Scene 1 → reward → Scene 2 → reward → Boss (Critic) → act complete
2. All 4 Act I enemies work with v2 damage resolution, keywords, and Ovation
3. v2 starting deck (10 cards) deals appropriate damage against v2 enemy HP values
4. Card rewards offer 1 Aldric pool, 1 Pip pool, 1 neutral — **player must pick 1 (no skip)**
5. Protagonist HP resets between combats; MacGuffin HP carries across
6. Protagonist knockout works (cards dimmed, puppet dimmed)
7. Boss phase transition works (Critic changes pattern at <50% HP)
8. Ovation meter visible and functional throughout
9. **Playtest:** Act I should be completable in ~5 minutes with reasonable play
10. Balance pass: adjust enemy HP/damage if needed (all values marked "preliminary" in v2 docs)

---

### 24. Damage Preview UI

Real-time forecast of incoming damage, updated as player plays defense cards.

**Read:** `renderer.js`, `combat.js` (damage pipeline)

**Acceptance Criteria:**

1. At turn start, display predicted damage per target based on enemy intent:
   - Red number above each target that will be hit (e.g., `▼10` on MacGuffin)
   - For AoE, show numbers on MacGuffin AND each protagonist
2. **Real-time updates** as player plays cards:
   - Playing Block reduces MacGuffin's forecast number
   - Playing Taunt moves damage from MacGuffin forecast to protagonist forecast
   - Playing Shield reduces protagonist's forecast number
   - Playing Distract removes one hit worth of damage from forecast
3. When a target's forecast reaches 0, replace red number with green indicator (checkmark or shield icon)
4. Multi-hit attacks show total post-mitigation damage, not per-hit breakdown
5. Preview runs a **simulation** of the damage pipeline without actually applying it
6. Preview updates immediately (no delay or animation — this is informational)

---

### 25. Starting Deck Selection

Update character select screen to support v2 starting deck configuration.

**Read:** `ui.js` (showCharacterSelect, startPerformance), `cards.js`, `curtain-call.html`

**Acceptance Criteria:**

1. Character select shows 2 Basic card options per protagonist:
   - Aldric: Galvanize vs Bulwark (shown as selectable cards with full descriptions)
   - Pip: Quick Jab vs Lucky Shot
2. Player selects 1 Basic per protagonist (radio-style selection within each protagonist panel)
3. Starting deck assembled: 3× chosen Aldric Basic + 3× chosen Pip Basic + 3× Block + 1× Inspire = 10 cards
4. Deck composition shown to player before confirming
5. "Raise the Curtain" button starts run with selected deck
6. Both protagonists always selected (no protagonist deselection — team is always Aldric + Pip)

---

### 26. Act II Enemies & Boss

Implement all Act II enemies and The Director boss.

**Read:** `enemies.js`, `combat.js`, `updated_rules/curtain_call_enemies_v2.md` (Act II section)

**Acceptance Criteria:**

1. **Phantom Understudy** (35 HP): Regenerate pattern, passive *Understudy's Resilience* (Regen 2 on first drop below 50% HP)
2. **Prop Master** (40 HP): Heavy Block, passive *Stage Fortress* (Block halves instead of full reset), Weak infliction
3. **Shadow Mimic** (30 HP): AoE-heavy (67%), passive *Mirror Spite* (inflict 1 Burn on attacker)
4. **Spotlight Phantom** (35 HP): Fear/Frustration/Burn, passive *Blinding Light* (all attacks have Accuracy)
5. **The Director** (60 HP): Two phases, passive *Casting Call* (random debuff on all at phase start)
   - Phase 1: Forgetful/Fear pressure on one protagonist
   - Phase 2: Confused, Regenerate, Frustration on the other protagonist
   - Transition: clear self debuffs, gain 8 Block
6. Act structure updated: `ACT_STRUCTURE[2]` with scenes and boss
7. All enemy passives trigger correctly at their documented times
8. All enemies use v2 keywords (Block, Regenerate, Inspire, Accuracy, etc.)

---

### 27. Act II Playable

Full Act I → Act II run with act transition.

**Read:** `ui.js` (advanceScene, onActComplete), `enemies.js`

**Acceptance Criteria:**

1. After Act I boss defeat, transition to Act II (curtain close → act title → scene select)
2. Act II scene selection works (choose 1 of 2 enemies per scene)
3. MacGuffin HP carries from Act I to Act II
4. Protagonist HP resets for each Act II combat
5. Card rewards use full pools (Uncommon + Rare cards available)
6. Director boss fight works with all phase mechanics
7. Act II difficulty is a clear step up from Act I
8. Playtest: Act I + Act II should be completable in ~10 minutes

---

### 28. Act III Enemies & Boss

Implement all Act III enemies and The Playwright final boss.

**Read:** `enemies.js`, `combat.js`, `updated_rules/curtain_call_enemies_v2.md` (Act III section)

**Acceptance Criteria:**

1. **Prima Donna** (45 HP): passive *Dramatic Ego* (permanent Retaliate 2, +1 Inspire/turn)
2. **Comedy/Tragedy Mask** (50 HP): alternating states, passive *Two Faces* (Comedy: 50% damage reduction; Tragedy: debuff immune)
3. **Puppeteer's Hand** (40 HP): AoE-heavy (75%), passive *Tangled Strings* (+3 dmg if any protagonist has 3+ debuff stacks)
4. **Fallen Curtain** (50 HP): Block stacking + Curse, passive *Iron Curtain* (immune to Forgetful/Vulnerable)
5. **The Playwright** (80 HP): Three phases, passive *Narrative Control* (25% chance to clear a debuff/turn)
   - Phase 1 "Act One": Forgetful + Regenerate
   - Phase 2 "Plot Twist": Retaliate, Fear/Frustration, Burn — transition clears debuffs, gains 10 Block + permanent Retaliate 2
   - Phase 3 "Final Page": Inspire stacking, Vulnerable + AoE, Burn + Poison, Heal — transition clears debuffs, gains 3 permanent Inspire, loses Retaliate
6. `ACT_STRUCTURE[3]` defined with scenes and boss

---

### 29. Act III & Full Run

Complete 3-act run from menu to victory/defeat.

**Read:** `ui.js`, `enemies.js`

**Acceptance Criteria:**

1. Act III scene selection and combat works
2. Full run flow: Menu → Deck Select → Act I → Act II → Act III → Victory
3. Defeat at any point shows defeat screen with "Try Again" returning to menu
4. Victory screen after Playwright defeat shows run summary (turns, damage dealt, cards collected)
5. MacGuffin HP carries across all 9 encounters — cannot be healed
6. Full run takes ~15–20 minutes

---

### 30. Drag-to-Play & UX Polish ✅

Replaced tap-to-select card interaction with drag-to-play using Pointer Events. Added card targeting, tap-to-zoom, and rapid play support.

**Changes made:**

1. **Drag-to-play system** — Pointer Events with ghost card, 8px threshold to distinguish tap from drag
2. **Card targeting** — Three modes: `'none'` (any play area), `'protagonist'` (Aldric/Pip), `'ally'` (Aldric/Pip/MacGuffin). Drop zone highlighting for targeted cards only.
3. **Tap-to-zoom** — Replaced long-press with single tap. Keyword explanations extracted from card effects and shown in a single audience bubble.
4. **Debounced hand reflow** — Chrome tab pattern: hide played card, re-index siblings, 600ms debounce before full re-render. Drag-aware: pauses timer during drag.
5. **Effect queue** — `playCard()` is synchronous for state changes, effects queued and processed in background. Enables rapid card play without animation blocking.
6. **Enemy area layout** — Restructured to 3-column flex: left sidebar (intent), center (puppet + HP), right sidebar (status modifiers)
7. **Turn timing fixes** — Symmetric timing: player-inflicted effects process at start of player turn, enemy-inflicted effects process at start of enemy turn. Fixed enemy Block, Regenerate, passives, and debuff decay timing.
8. **Luck** made permanent (no decay)

---

## Pre-V1 Milestones

---

### 31. Deck List & Card Removal

Overlay to view the full deck, with the ability to remove cards from the deck.

**Read:** `ui.js`, `combat.js` (deck/discard state), `renderer.js`, `cards.js`

**Acceptance Criteria:**

1. Button accessible during combat to open a full-screen deck list overlay
2. Overlay shows all cards currently in the deck (draw pile + discard pile + hand), grouped or sortable
3. Each card shown with name, cost, description, and owner indicator (Aldric/Pip/MacGuffin)
4. Card removal mechanic: player can remove cards from their deck at specific opportunities (e.g., post-combat reward alternative, or dedicated removal event)
5. Removed cards are permanently gone for the rest of the run
6. Cannot remove below a minimum deck size (e.g., 5 cards)
7. Overlay dismissable with tap/click outside or close button
8. Deck count indicator visible during combat (shows draw pile / discard pile sizes)

---

### 32. Attack Animations

Visual attack animations for protagonists and enemy to make combat feel more dynamic.

**Read:** `renderer.js` (puppet animations), `combat.js` (executeCardEffects, enemyAttack), `curtain-call.css`

**Acceptance Criteria:**

1. **Protagonist attack animation** — puppet lunges/strikes toward enemy when dealing damage
2. **Enemy attack animation** — enemy puppet strikes toward targets when attacking
3. **Hit feedback** — target puppet recoils/shakes on receiving damage
4. **AoE attack animation** — enemy attack visually hits all targets (sweep or multi-strike)
5. **Multi-hit animation** — rapid successive strikes for multi-hit attacks (e.g., 2×3)
6. **Block/Shield absorb** — visual feedback when damage is mitigated (flash, particle, etc.)
7. Animations are snappy (~200–400ms) and don't block rapid card play
8. Animations work with the effect queue system (don't interfere with debounced reflow)

---

### 33. Voice Lines & Dialogue

Update and expand speech bubble dialogue for all characters. Tune frequency and variety.

**Read:** `audience.js`, `renderer.js` (showSpeechBubble, showAudienceBubble), `enemies.js`

**Acceptance Criteria:**

1. **Audience voice lines** — more variety in reactions, tied to Ovation level and game events (card play, damage, KO, boss phase change)
2. **Protagonist voice lines** — Aldric and Pip react to their own card plays, taking damage, KO, buff/debuff application
3. **Enemy voice lines** — each enemy has personality-appropriate lines for attacking, taking damage, using abilities, defeat
4. **Boss-specific dialogue** — The Critic, Director, and Playwright have phase transition lines and signature taunts
5. **Frequency tuning** — voice lines trigger at a natural cadence (not every action, not too rarely). Configurable cooldown between lines.
6. **No duplicate back-to-back** — recent line tracking prevents the same line appearing twice in a row

---

### 34. Enemy SVG Art

Replace placeholder enemy silhouettes with unique, themed SVG art for all enemies.

**Read:** `enemies.js`, `curtain-call.html`, `curtain-call.css` (enemy puppet styles)

**Acceptance Criteria:**

1. All 12 regular enemies have distinct SVG silhouettes reflecting their character theme
2. All 3 bosses have larger, more detailed SVG silhouettes
3. SVGs maintain the shadow puppet aesthetic (near-black silhouettes with puppet sticks)
4. Eye/mouth cutouts on characters with expression states (idle, attacking, hurt, defeated)
5. Enemy passive ability icon or visual indicator displayed
6. SVGs render crisply at mobile and desktop sizes
7. Protagonist knockout animation (fade/collapse puppet)

---

### 35. Game Rebalancing

Tune the game to allow player synergies to emerge sooner and provide more strategic depth.

**Read:** `cards.js`, `enemies.js`, `combat.js`

**Acceptance Criteria:**

1. **Faster player ramping** — earlier access to synergy cards through improved card reward pools and/or more frequent card rewards
2. **Less punishing enemy scaling** — tune enemy HP/damage curves so early-game feels manageable and late-game is challenging but fair
3. **More card choices** — expand card pools with new cards that enable additional strategies and synergies
4. **Card removal integration** — card removal available as a reward alternative (from M31), enabling deck thinning as a strategy
5. **Better card addition options** — more meaningful choices at card reward screens (consider showing cards that complement existing deck)
6. **Synergy acceleration** — ensure keyword combos (Inspire + multi-hit, Fortify + Block, Luck + Pip attacks, etc.) come online by mid Act I
7. **Balance testing** — full run should feel progressively challenging but winnable with good play. Act I teaches, Act II challenges, Act III tests mastery
8. **Starting deck variety** — review starting card options to ensure both Aldric and Pip basics feel distinct and viable

---

### 36. V1 Playtest Release

Checkpoint milestone: the game is ready for external playtesting.

**Acceptance Criteria:**

1. Complete 3-act run playable from start to finish without crashes or softlocks
2. All combat mechanics working correctly (drag-to-play, targeting, damage resolution, keywords)
3. Deck list viewable, card removal functional
4. Attack animations provide satisfying combat feedback
5. Voice lines add personality without being annoying
6. Enemy art is finalized (no placeholder SVGs)
7. Game balance allows a skilled player to complete a full run in ~15–20 minutes
8. Mobile touch experience is smooth (drag-to-play, zoom, scrolling)
9. Basic onboarding: first combat is easy enough to learn mechanics without a tutorial
10. Share with playtesters, collect feedback

---

## Post-V1 Milestones

---

### 37. Card Upgrade Rewards

Boss rewards allow upgrading an existing card instead of adding a new card.

**Read:** `ui.js` (showRewardsScreen), `cards.js`

**Acceptance Criteria:**

1. After boss defeat, show upgrade UI (not card selection)
2. Player selects one card from their deck
3. Upgrade improves the card (enhanced version defined in card data)
4. Upgraded card replaces the original in the deck
5. Upgrade paths defined per card (e.g., Block 3 → Block 5, or add a keyword)
6. Visual indication that card has been upgraded (border glow or "+" indicator)

---

### 38. Curtain Transitions Polish

Themed scene and act transitions with audience reactions.

**Read:** `ui.js` (curtain helpers), `audience.js`

**Acceptance Criteria:**

1. Act title card displayed during act transitions ("Act II — Rising Action")
2. Victory: curtain call with audience standing ovation animation
3. Defeat: curtain falls with audience worried/boo reaction
4. Boss entrance: dramatic curtain open with audience gasp
5. Transitions are smooth (~1–2s), no jank
6. Audience reactions tied to Ovation level during transitions

---

### 39. Persistence & Run History

SQLite storage for run history and stats.

**Acceptance Criteria:**

1. SQLite database stores completed runs
2. Run history: starting cards chosen, outcome, duration, cards collected, enemies defeated
3. Stats screen accessible from main menu showing run history
4. API endpoints for save/load
5. Data survives server restart
6. Graceful degradation if database unavailable

---

### 40. Narrative Events

Random narrative encounters between combats that add variety and story.

**Acceptance Criteria:**

1. Event system: between-combat screens with story text, choices, and consequences
2. Events can grant cards, remove cards, heal/damage MacGuffin, apply keywords
3. Multiple event types: merchant, mysterious stranger, backstage, rehearsal, etc.
4. Events selected randomly from a pool, weighted by act and run progress
5. Player choices matter — different options lead to different rewards/consequences
6. Events fit the theater/performance theme

---

### 41. Shop & Reward System

In-run currency and shop for purchasing cards, upgrades, and items.

**Acceptance Criteria:**

1. Currency earned from combat (gold/applause/tips — thematically appropriate)
2. Shop accessible between combats (or as a narrative event)
3. Shop sells cards from the card pool, card removals, and possibly consumable items
4. Prices scale with act progression
5. Shop inventory randomized per visit
6. Currency carries across the full run

---

### 42. Unlocks & Meta-Progression

Persistent progression that carries across runs.

**Acceptance Criteria:**

1. Unlock system tracks achievements across runs (e.g., beat Act I, defeat each boss, win a full run)
2. Unlocks gate new content: additional starting card options, new cards in pools, cosmetics
3. Meta-progression visible from main menu
4. Unlocks stored in persistence layer (M39)
5. Progressive difficulty options unlocked after first win (e.g., harder modifiers)
6. Achievement/unlock notifications during gameplay
