# Curtain Call — Development Milestones

_Created: February 25, 2026_

---

## Milestone Overview

| #     | Name                                  | Dependencies | Status | Summary                                                 |
| ----- | ------------------------------------- | ------------ | ------ | ------------------------------------------------------- |
| M1    | Run Persistence                       | —            | Done   | Save/restore active run state via SQLite                |
| M2    | Event Bus                             | —            | Done   | Hook system for reactive triggers                       |
| M3    | Enchantment Cards                     | M2           |        | Persistent combat-duration effects                      |
| M4    | Expanded Card Pools + Reward Refresh  | M2           |        | More cards, synergy depth, reward UX                    |
| M5    | Stage Props                           | M2           |        | Permanent run-duration passives                         |
| M6    | Currency, Merchant & Narrative Events | M1, M5       |        | Between-combat economy and story beats                  |
| M7    | Meta-Progression                      | M1, M6       |        | Cross-run unlocks via Ticket currency and unlock tracks |
| Spike | Card Balance & Additions              | Any          |        | Inserted as needed from playtesting                     |

---

## Persistence: SQLite

SQLite is the right call for Parlor. Reasoning:

- Parlor's philosophy is intentionally simple — no external dependencies, single server, two users. SQLite fits this perfectly.
- Zero configuration. File lives on the droplet, no network calls, no auth tokens.
- Python's built-in `sqlite3` module — no additional packages needed.
- WAL mode handles concurrent reads from two players without issue.
- Keeps everything self-contained on the DigitalOcean box. No Supabase account dependency, no external service that could go down or change pricing.
- Fun to experiment with.

---

## M1 — Run Persistence

### Goal

Save and restore active Curtain Call run state so that refreshing the page or disconnecting doesn't lose progress. Also establishes the persistence layer that M6 (currency/merchant) and M7 (meta-progression) will build on.

### Design Notes

- SQLite database file stored on the server (e.g., `/root/parlor/data/curtain-call.db`)
- Backend API endpoints for save/load — the client sends state snapshots, the server persists them
- A run is identified by some token (could be a simple UUID stored in localStorage on the client, or a short code the player enters)
- Since there's no auth, the simplest approach: generate a run ID on game start, store it in the client, use it to save/load. If the player clears their browser, the run is lost — acceptable for v1.
- Save triggers: after each combat (win), after card reward selection, after any between-combat choice. NOT mid-combat — combat state is complex and transient. If the player refreshes mid-combat, they restart that combat with their pre-combat deck state.
- The save payload is a JSON blob of run state: current act/scene, deck contents, protagonist HP, collected Stage Props (M5), currency (M6), etc.
- Meta-progression (M7) uses a separate table — unlocks, run history, stats.

### Definition of Done

- [x] SQLite database created on first run, stored in a persistent location on the server
- [x] Backend endpoints: `POST /api/curtain-call/save` (save run state), `GET /api/curtain-call/load/{run_id}` (load run state), `DELETE /api/curtain-call/run/{run_id}` (abandon run)
- [x] Client generates a run ID on new game start, stores in localStorage
- [x] On page load, client checks for existing run ID and attempts to load — if found, offers "Continue Run" vs "New Run" on title screen
- [x] State saved automatically after: combat victory, card reward selection, any between-combat screen completion
- [x] Save payload includes: run ID, protagonist pair, current act/scene, full deck list, MacGuffin max HP
- [x] Loading a run restores the player to the correct between-combat screen (scene selection) — never mid-combat
- [x] Starting a new game when a save exists abandons the old run
- [x] Database schema is forward-compatible — state_json blob can carry Stage Props (M5), currency (M6) without schema migrations. Meta-progression (M7) uses a separate table.
- [x] Existing gameplay works identically when no save exists (fresh run, no persistence)
- [x] Run saves are cleaned up after completion (victory or defeat) — only active runs persist

---

## M2 — Event Bus

### Goal

Implement the hook/event system that was planned early in development but never built. This replaces hardcoded procedural calls with a composable event system that enchantments (M3), Stage Props (M5), and future reactive mechanics can register listeners against.

### Design Notes

The coding agent has direct access to the codebase and should make architectural decisions about implementation. The key requirements from a design perspective:

- Events should be emittable from anywhere in the combat pipeline
- Listeners should be registerable and deregisterable (enchantments register on play, deregister on combat end; Stage Props register on combat start, persist across combats)
- The existing enemy passive system should be refactored to use the event bus as its first consumer — this validates the architecture against working code
- Event data should carry enough context for listeners to make decisions (e.g., `cardPlayed` should include the card data, which protagonist played it, etc.)

### Core Events (minimum set)

**Turn lifecycle — player and enemy phases need separate events for sequencing:**

- `playerTurnStart`, `playerTurnEnd`
- `enemyTurnStart`, `enemyTurnEnd`

The distinction matters because effects that trigger "at end of turn" vs "at start of enemy turn" need to resolve in a specific order. For example: an enchantment that grants 1 Inspire at `playerTurnEnd` followed by an enemy passive that doubles Inspire at `enemyTurnStart` — these must sequence correctly. Player buff decay, enemy debuff decay, and similar mechanics need clear attachment points. The coding agent should evaluate whether player/enemy debuff reduction (currently happening at turn boundaries) should be moved to align with these events, and whether additional granularity is needed.

**Combat actions:**

- `cardPlayed` (with card data, protagonist, cost paid)
- `cardDrawn`
- `damageDealt` (to enemy, with amount, source)
- `damageTaken` (by protagonist or MacGuffin, with amount, source)
- `keywordGained` (which keyword, stacks, target)
- `debuffInflicted` (which debuff, stacks, target)
- `blockGained`
- `energySpent`, `energyGained`
- `ovationChanged`

**Combat milestones:**

- `enemyDefeated`
- `combatStart`, `combatEnd`

### Definition of Done

- [x] Event bus system implemented — supports `on(event, callback)`, `off(event, callback)`, `emit(event, data)`
- [x] All core events listed above are emitted at the appropriate points in the combat pipeline
- [x] Player and enemy turn phases have separate events (`playerTurnStart`/`playerTurnEnd`, `enemyTurnStart`/`enemyTurnEnd`)
- [x] Existing enemy passive system refactored to use event bus listeners instead of hardcoded check points
- [x] Enemy passives work identically to before the refactor (no behavioral regressions)
- [x] Listeners can be registered with a "scope" or "owner" so that all listeners for a given owner can be bulk-deregistered (needed for enchantment cleanup)
- [x] Event emission doesn't break existing combat flow — all current game behavior unchanged
- [x] At least one test case: a temporary listener registered and deregistered during combat to verify cleanup works
- [x] Performance is acceptable — event emission adds no perceptible delay to combat actions

---

## M3 — Enchantment Cards

### Goal

Introduce enchantment cards — a new card type that, when played, creates a persistent effect for the remainder of combat. These register event bus listeners that fire repeatedly until combat ends.

### Design Notes

- Enchantment cards are played from hand like any other card, costing energy
- On play, the card's effect registers one or more event bus listeners (M2)
- The card moves from hand to an "Enchantments" display area flanking the enemy (left or right side of the enemy area)
- No cap on active enchantments — if a player wants to build around stacking multiple enchantments, that's a valid and interesting play style
- Active enchantments are tappable — opens the card zoom overlay with crowd keyword explanations, same as tapping a hand card
- All enchantment listeners are deregistered and enchantment cards are cleared on combat end
- Enchantments do NOT carry between combats (that's what Stage Props do)
- Enchantment cards appear in card reward pools alongside normal cards — they're part of the deck like any other card
- Visual treatment: the card appears in miniature in the enchantment area, maybe slightly transparent/ghostly to suggest it's an ongoing effect rather than a physical presence

### Example Enchantment Cards

**"Dramatic Lighting"** — Aldric, Uncommon, Enchantment, 1 energy
_"At end of turn, double your Retaliate stacks."_
Synergy: Bulwark gives 1 Retaliate. With this active, that 1 becomes 2, then 4, then 8. Suddenly Retaliate is a real win condition. The player starts actively looking for more Retaliate sources. Rewards a player who invested early in Aldric's defensive identity.

**"Comic Relief"** — Pip, Uncommon, Enchantment, 1 energy
_"Whenever you inflict a debuff, gain 1 Luck."_
Synergy: Quick Jab inflicts 2 random debuffs → now also gives 2 Luck. Every debuff card Pip plays fuels his Luck engine. Connects Pip's two core themes (debuffs and Luck) into a permanent feedback loop. Makes cards like Pip's Cocktail, Annoying Poke, and Best Explanation all generate Luck as a side effect.

**"Fortress Scene"** — Aldric, Uncommon, Enchantment, 2 energy
_"At end of turn, gain Shield equal to your Taunt stacks."_
Synergy: Galvanize gives 1 Taunt per play. With this active, accumulated Taunt generates passive Shield every turn. Since Taunt redirects damage to the protagonist, Shield is the correct defense — it protects the protagonist absorbing those redirected hits. Creates a self-sustaining tank.

**"Plot Twist"** — Pip, Rare, Enchantment, 2 energy
_"When the enemy attacks, they take damage equal to their Frustrated stacks."_
Synergy: Annoying Poke and Vex inflict Frustration. This converts Frustration into a direct damage source. Enemies that attack multiple times per turn take this damage for each attack. Rewards heavy debuff investment.

### Definition of Done

- [ ] New card type "enchantment" added to card data model (alongside attack, defense, action)
- [ ] Enchantment cards can be defined in `cards.js` with an `onPlay` event registration spec (what events to listen to, what effects to trigger)
- [ ] Playing an enchantment card: deducts energy, removes from hand, registers event listeners via M2's event bus, moves card to enchantment display area
- [ ] Enchantment display area: visible slots flanking the enemy, showing miniature versions of active enchantment cards
- [ ] No cap on simultaneous active enchantments — display area scrolls or wraps if many are active
- [ ] Tapping an enchantment card in the display area opens card zoom overlay with crowd keyword explanations
- [ ] All enchantment listeners deregistered on combat end (victory or defeat)
- [ ] Enchantment cards cleared from display on combat end
- [ ] Enchantment cards appear in card reward pools with appropriate rarity weighting
- [ ] At least 4 enchantment cards implemented and playable (a mix of Aldric and Pip)
- [ ] Enchantment cards rendered with a distinct visual treatment in hand (different border style or color accent) so the player knows they behave differently before playing them
- [ ] Enchantment interaction with Inspire should be intentional and consistent (design decision for the coding agent — does Inspire boost the enchantment's registered values? Or is Inspire irrelevant to enchantments?)
- [ ] Save/load (M1) correctly persists enchantments as part of the deck between combats

---

## M4 — Expanded Card Pools + Reward Refresh

### Goal

Deepen the card pool with cards that create meaningful synergy branches, and add a reward refresh mechanic so that expanding the pool doesn't make finding synergies feel like a lottery.

### Reward Refresh Design

- After combat, the player sees 3 card reward options (existing behavior)
- New: a "Refresh" button that rerolls all 3 options
- Start with 1 free refresh per reward screen — no currency cost (avoids M6 dependency)
- Later (M6): additional refreshes cost Gold
- Visual: the refresh button could be styled as a stagehand swapping out the card display — fits the theater theme

### New Card Suggestions

These are designed around the basic character-specific cards as natural starting points. The goal is cards where the player sees the synergy and gets excited. Avoid using keyword names in card names.

#### Cards That Synergize With Quick Jab (Pip — debuff diversity)

Quick Jab inflicts 2 random debuffs and deals 2 per unique debuff on enemy. These cards reward building debuff variety.

**"Read the Room"** — Pip, Uncommon, Action, 1 energy
_"Gain 1 Distract per unique debuff type on enemy. Draw 1 card."_
Quick Jab seeds debuff diversity. This converts that diversity into defense (Distract) plus card draw. Becomes a 1-cost "gain 3-4 Distract, draw 1" in a debuff-heavy deck.

**"Catalogue of Woes"** — Pip, Uncommon, Action, 1 energy
_"Gain 1 Luck per unique debuff type on enemy."_
Connects Pip's debuff theme directly to his Luck theme. Quick Jab gives debuff diversity, this converts it into Luck, then Luck cards scale. The bridge card between Pip's two identities.

**"Unraveling"** — Pip, Rare, Attack, 2 energy
_"Deal 3 damage per unique debuff type on enemy. Inflict 1 random debuff."_
The premium Quick Jab payoff. With 5 unique debuffs (achievable in a Pip-heavy deck), this deals 15 damage and adds another debuff type. Debuff diversity's big finisher.

#### Cards That Synergize With Lucky Shot (Pip — Luck accumulation)

Lucky Shot deals 3 damage and gains 2 Luck. These cards give Luck a purpose beyond its passive bonus.

**"Charmed Life"** — Pip, Uncommon, Defense, 1 energy
_"Gain Shield equal to your Luck."_
Player has been playing Lucky Shots, sitting on 4-6 Luck. This converts that stockpile into protagonist Shield. Makes Luck feel like a resource, not just a passive bonus. Shield (persistent) rather than Block (one-turn) rewards the slow accumulation.

**"Lucky Break"** — Pip, Rare, Action, 1 energy
_"If you have 5+ Luck, gain 2 Energy and draw 2 cards. Lose 3 Luck."_
The tempo explosion. Spend 1 energy + 3 Luck to net +1 energy and +2 cards. Sets up a big turn. But you have to rebuild the Luck afterwards — creates a satisfying spend/rebuild rhythm.

**"All In"** — Pip, Rare, Attack, 2 energy
_"Spend all Luck. Deal damage equal to Luck spent x3."_
The Luck finisher. Stack Luck to 8+, cash it all in for 24+ damage. Dramatic, rewards patience. The player feels clever for building up to this moment.

#### Cards That Synergize With Galvanize (Aldric — Taunt accumulation)

Galvanize deals 3 damage and gains 1 Taunt. These cards make Taunt stacks generate ongoing value.

**"Defiant Roar"** — Aldric, Uncommon, Action, 1 energy
_"Gain 1 Ovation per Taunt stack. Gain 1 Retaliate."_
Three basic cards now interconnect: Galvanize builds Taunt → this converts Taunt to Ovation (audience loves the bravery) + gives Retaliate (connecting to Bulwark's theme). Ovation then feeds Ovation-scaling cards like Coup de Grace, Protective Stance, Captivating Strike.

**"Immovable"** — Aldric, Uncommon, Defense, 1 energy
_"Gain Shield equal to double your Taunt stacks."_
Galvanize has been building Taunt to 3-4. This card gives 6-8 Shield on the protagonist. Since Taunt redirects damage to the protagonist, Shield is the correct defense layer — it protects the hero absorbing those hits.

**"Unyielding"** — Aldric, Rare, Defense, 1 energy
_"Gain 2 Taunt. Until next turn, damage absorbed by Taunt generates equal Ovation."_
The hero card. Aldric steps forward, takes the hits, and the crowd goes wild. Every point of damage he absorbs fills the Ovation meter. Rewards intentionally tanking damage — counterintuitive and exciting.

#### Cards That Synergize With Bulwark (Aldric — Block + Retaliate)

Bulwark gives 5 Block and 1 Retaliate. These cards expand the Retaliate archetype and reward defensive play.

**"Rousing Recital"** — Aldric, Uncommon, Action, 1 energy
_"Convert all Block into Ovation (up to max). Gain 1 Fortify."_
Play Bulwark for 5 Block, then this converts it to Ovation. Ovation-scaling cards are now stronger. The Fortify ensures you're not defenseless after converting. Creates a rhythm: build Block → convert to Ovation → play Ovation payoff cards.

**"Spiked Barricade"** — Aldric, Uncommon, Defense, 2 energy
_"Gain 6 Block and 4 Retaliate."_
A bigger Bulwark. Stacks with the basic in a turn for 5 total Retaliate. With the "Dramatic Lighting" enchantment active, that doubles at end of turn. Now Retaliate is a real damage engine.

**"Sworn Protector"** — Aldric, Rare, Action, 0 energy
_"Gain Retaliate equal to your Fortify. Gain 2 Block."_
Late-game payoff at 0 cost because the synergy is hard to assemble. If you've been collecting Fortify from Iron Wall, Stand Guard, Battle Hymn — this converts that investment into Retaliate. Your defense literally fights back. The 0 cost means it always fits into a turn.

### Definition of Done

- [ ] At least 8 new cards added across Aldric and Pip pools, spanning uncommon/rare
- [ ] New cards defined in `cards.js` following existing data format
- [ ] New cards appear in appropriate card reward pools based on protagonist affinity and rarity
- [ ] Reward refresh button added to post-combat reward screen
- [ ] 1 free refresh per reward screen — rerolls all 3 options, respecting rarity weights and not re-offering already-seen cards from this screen
- [ ] Refresh button visually communicates remaining refreshes (e.g., greyed out after use)
- [ ] Visual: refresh animation that feels theatrical (cards flip, slide off, new ones slide in)
- [ ] New cards have keyword emojis in descriptions following existing convention
- [ ] All new cards are playable, resolve their effects correctly, and interact with existing keywords/mechanics as described
- [ ] Card zoom on new cards shows correct keyword explanations via audience speech bubbles
- [ ] New entries in `KEYWORD_GLOSSARY` if any new keywords are introduced
- [ ] No card names reference keyword names directly
- [ ] Balance pass: playtest each new card in at least one full run to verify it feels impactful but not broken

---

## M5 — Stage Props

### Goal

Introduce Stage Props — persistent passive items collected during a run that provide in-combat benefits for the remainder of the run. Thematically, these are props placed on the stage that affect every scene.

### Design Notes

- Stage Props are NOT cards — they don't go in the deck, they aren't played from hand
- Collected between combats (initially as boss rewards or alternative combat rewards; later from events and the merchant in M6)
- Active for all future combats in the run
- Register event bus listeners at the start of each combat, deregister at combat end, re-register at next combat start
- UI: displayed in a dedicated strip/area near the enemy, visually distinct from enchantments (enchantments are temporary/ghostly, Stage Props are solid/permanent)
- Tappable: opens an overlay with the prop's name, description, and crowd explanation of what it does
- A player might collect 3-6 Stage Props across a full run
- Data model: each prop has an ID, name, description, trigger event, effect, and optionally a condition
- Stage Props persist in the save file (M1) as part of run state

### Example Stage Props

**"Director's Megaphone"**
_"At the start of each combat, gain 1 Inspire."_
Simple and universally useful. Every combat starts with your first card being boosted. Early pickup that makes the player feel immediately stronger.

**"Tattered Script"**
_"At the start of each combat, draw 1 additional card."_
Start with 6 cards instead of 5. More options on turn 1. Simple power that never feels bad.

**"Applause-O-Meter"**
_"Whenever you gain Ovation, gain 1 additional Ovation."_
Doubles Ovation generation. Makes Ovation-scaling cards (Coup de Grace, Protective Stance, Captivating Strike, Ultimate Jeer) significantly more powerful. Potentially overpowered — test and tune if needed.

**"Stunt Double"**
_"Once per combat, when a protagonist would take lethal damage, survive with 1 HP instead."_
Safety net. Prevents a run-ending mistake. Doesn't trigger on MacGuffin damage — only protagonist HP. Gives the player room to be aggressive with Taunt strategies.

**"Trapdoor Lever"**
_"Once per combat, when MacGuffin drops below 50% HP, gain 10 Block on MacGuffin."_
Emergency save for the MacGuffin. Triggers automatically. Gives a buffer when things go south. Pairs with Block-conversion strategies (Rousing Recital converts that emergency Block into Ovation).

**"Villain's Monologue"**
_"Enemies start each combat with 1 Frustrated and 1 Weak."_
Debuff-flavored prop. Every enemy starts slightly impaired. Makes early turns safer and gives Pip's debuff-counting cards (Quick Jab, Twist the Knife) a head start.

**"Opening Night Jitters"**
_"Start each combat with 2 Ovation."_
Simple momentum. Every fight begins with Ovation already building. Feeds directly into Ovation-scaling cards from turn 1.

**"Understudy's Mask"**
_"At the start of each combat, gain 1 of a random keyword matching your protagonist pair."_
Gives a random Aldric keyword (Taunt, Shield, Retaliate, Fortify) or Pip keyword (Luck, Distract) at combat start. Different every fight. Adds variety and occasionally creates unexpected synergies.

**"Spotlight Rig"**
_"Whenever you play a 0-cost card, gain 1 Ovation."_
Rewards cheap card play. The 0-cost basics (Block, Inspire) now generate Ovation. Mischief, Pip's Cocktail, Protect all generate Ovation. Makes deckbuilding decisions about card cost more interesting.

### Definition of Done

- [ ] Stage Prop data model defined — ID, name, description, trigger configuration (event bus events), effect, optional condition, rarity
- [ ] At least 6 Stage Props implemented and obtainable
- [ ] Stage Props register event bus listeners at combat start, deregister at combat end
- [ ] Stage Props that are "once per combat" track their usage and reset on next combat
- [ ] UI: Stage Prop display area visible during combat, showing collected props
- [ ] Tapping a Stage Prop opens overlay with name, description, and crowd explanation
- [ ] Stage Props initially awarded as boss rewards (choice of 1 from 2-3 options) — UI similar to card reward screen but with prop-specific layout
- [ ] Stage Props persist in run save data (M1 integration)
- [ ] Stage Props listed in a viewable collection from the pause/menu screen
- [ ] Stage Props visually distinct from enchantment cards in the combat UI
- [ ] Stage Prop effects trigger correctly across multiple combats in a run (re-registration works)
- [ ] No Stage Prop creates an infinite loop or game-breaking interaction with existing mechanics

---

## M6 — Currency, Merchant & Narrative Events

### Goal

Reshape the between-combat experience with in-run currency (Gold), a merchant scene with a fixed inventory of 5 purchasable items, and narrative events presented as puppet show vignettes between the protagonists. The run structure becomes: Combat → Event → Combat → Merchant → Boss (per act).

### Revised Act Structure

```
Act 1:  Combat 1 (choose 1 of 2) → Narrative Event → Combat 2 (choose 1 of 2) → Merchant → Boss
Act 2:  Combat 1 (choose 1 of 2) → Narrative Event → Combat 2 (choose 1 of 2) → Merchant → Boss
Act 3:  Combat 1 (choose 1 of 2) → Narrative Event → Combat 2 (choose 1 of 2) → Merchant → Boss
```

This is a linear path — no branching map. Variety comes from enemy selection, card rewards, event outcomes, and merchant spending. A branching map would add UI complexity on mobile without meaningful decision depth given the small number of nodes per act.

---

### Currency: Gold

- In-run currency used at the merchant
- Awarded after each combat victory — base amount + optional performance bonus (low damage taken, high Ovation, etc.)
- Displayed in the UI during between-combat screens
- Persisted in run save data (M1)
- Unspent Gold at end of a run converts to Tickets (M7's meta-currency) at a small ratio (e.g., 10 Gold → 1 Ticket). This is a pleasant bonus for frugal players but never worth sacrificing a merchant purchase over — run performance (winning, reaching later acts) should always generate far more Tickets than hoarding Gold would.

---

### Merchant

The merchant appears after the second combat in each act, before the boss. This placement means the player has fought two enemies, knows what their deck needs, and can make informed purchases before the boss fight.

The merchant is a themed character — a stagehand, prop master, or costume designer — with a line or two of personality. The interaction is purely transactional: here's the table, buy and go. No dialogue trees, no bartering.

**Fixed inventory — 5 items, same categories every visit:**

| Slot | Item               | Description                                                                                                                                     |
| ---- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Stage Prop**     | A single Stage Prop. Take it or leave it. (Future expansion: choose from 2-3 options.)                                                          |
| 2    | **Card Rewards**   | Triggers the standard card reward flow — pick 2 cards from the normal rarity-weighted pool + 1 free refresh. Reuses existing reward UI.         |
| 3    | **Rare Card**      | Pick 1 from 3 rare cards. Guarantees rare quality — the premium alternative to the standard card reward slot.                                   |
| 4    | **Card Removal**   | Remove 1 card from your deck. Deck thinning for quality. Boss victories also offer card removal, so this is supplementary, not the only source. |
| 5    | **MacGuffin Heal** | Restore a fixed amount of MacGuffin HP. Should heal enough to matter when you're behind (e.g., 8 HP) but not enough to fully reset.             |

**Pricing:** Fixed prices across the entire game — no scaling by act, no escalating costs for repeat purchases. The player earns enough Gold per act for roughly 2-3 items, so every merchant visit forces prioritization. "I need the heal and the prop, so no new cards this time." Same five items, different decisions every run.

**Design rationale for fixed structure:** No browsing, no pagination, no overwhelming choice. Five items on a table. The player learns the format once and every future visit is fast — scan, decide, buy, go. Perfect for mobile.

---

### Narrative Events

Narrative events appear after the first combat in each act. They are presented as short puppet show vignettes — the protagonists have a brief conversation using the existing speech bubble system, then the player makes a choice.

#### Presentation Format

The event plays out on the stage using the existing puppet and speech bubble infrastructure:

1. **Protagonist A's speech bubble** appears over their puppet, holds for a beat, fades
2. **Protagonist B's speech bubble** appears, holds, fades
3. **Two choice buttons** appear at the bottom — "Side with [Protagonist A]" / "Side with [Protagonist B]"
4. Player taps one
5. **Winner gets a final reaction line** — a speech bubble with their response to having won the argument
6. Rewards/consequences apply, transition to next scene

Total interaction time: ~8-10 seconds of dialogue plus a single tap. No scrolling, no text walls, no new UI paradigm. It's just the puppet show doing what puppet shows do — the characters disagree and the audience decides.

#### Example Event

> _Pip:_ "I'm hungry, I think I'll grab a snack from the MacGuffin."
> _Aldric:_ "Don't you dare, we must always protect the MacGuffin!"

**Side with Pip:** Gain a random Pip card, but lose 5 MacGuffin HP.
→ Pip's reaction: _"Tastes even better than I thought. I'm gonna have to sneak some more later."_

**Side with Aldric:** Heal the MacGuffin by 5 HP, start the next combat with 5 Block.
→ Aldric's reaction: _"My duty is fulfilled today."_

#### Design Principles

**Every choice has a "clean" option and a "greedy" option.** The clean option is low-risk, modest reward — gain some Gold, heal a bit, nothing bad happens. The greedy option is high-reward with a real cost — gain a Stage Prop but the next enemy starts buffed, gain a card but lose MacGuffin HP. The clean option is never exciting but never punishing. The greedy option is where the memorable run stories come from.

**Consequences should be things the player can play around.** "Next enemy starts with 3 Inspire" is good because the player can account for it — bring Block-heavy cards, play defensively early. "Next enemy starts with 2 Weak on both protagonists" makes you think about whether your deck can afford a slow start. Flat resource losses (lose 10 Gold) are less interesting because there's no counterplay. The best consequences change how you approach the next fight.

**"Side with X" framing reinforces character identity.** Over many runs the player develops a sense of each protagonist's personality — Pip is the risky one, Aldric is the cautious one. Sometimes events subvert this expectation, which keeps things interesting.

**Static events, learned over time.** Events and their outcomes are fixed, not randomized. The player "learns" scenarios across runs — first encounter is narrative surprise, subsequent encounters are informed strategic decisions. Dawncaster does this well.

**Protagonist-pair-specific dialogue.** Every event needs custom dialogue for each protagonist combination. With just Aldric and Pip this is manageable; as new protagonist pairs are added (M7), each new pair will need its own dialogue for every event. This is a significant content investment per new pair, but it's what makes the characters feel alive rather than interchangeable. The data structure should support this from the start — events keyed by protagonist pair, with dialogue and choices per pair.

#### Outcome Types

Event choices can produce any combination of:

- Gain a random card (from a specific protagonist's pool)
- Gain a card reward (standard pick-from-3 flow)
- Remove a random card from deck
- Remove a card of your choice from deck
- Gain a Stage Prop
- Gain Gold
- Lose Gold
- Heal MacGuffin HP
- Damage MacGuffin HP
- Buff/debuff protagonists for next combat
- Buff/debuff next enemy for next combat

#### Event Pool Size

Start with 6-8 events. With 1 event per act and 3 acts per run, the player sees 3 events per run. At 6-8 total, it takes a few runs before everything is seen, and most runs include at least one fresh event. More events can be added over time — including through meta-progression (M7) unlock tracks.

#### Data Format

Events are defined as config objects — scenario ID, protagonist pair key, dialogue sequence (speaker + text), choice labels, outcome definitions, reaction lines. Fully data-driven, no hardcoded event logic.

---

### Definition of Done

**Currency:**

- [ ] Gold system implemented — earned after combat, displayed in UI, persisted in save
- [ ] Combat rewards include Gold amount with optional performance bonus
- [ ] Reward refresh (M4) optionally costs Gold for additional refreshes beyond the free one
- [ ] Unspent Gold converts to Tickets (M7) at end of run at a small fixed ratio

**Merchant:**

- [ ] Merchant screen appears after Combat 2 in each act, before the boss
- [ ] Merchant character with 1-2 lines of personality (themed as backstage crew)
- [ ] 5 fixed inventory slots displayed: Stage Prop, Card Rewards (2 picks + refresh), Rare Card (pick 1 of 3), Card Removal, MacGuffin Heal
- [ ] Fixed prices per item — no act scaling, no escalation
- [ ] Purchasing an item greys it out / marks it as sold
- [ ] Card Rewards slot reuses existing reward UI flow (pick from 3, refresh available)
- [ ] Rare Card slot shows 3 rare cards, player picks 1
- [ ] Card Removal opens deck list, player selects 1 card to remove
- [ ] MacGuffin Heal restores a fixed HP amount, with clear feedback
- [ ] Player can leave without buying anything
- [ ] Merchant purchases persist in run save data (M1)

**Narrative Events:**

- [ ] Narrative event screen appears after Combat 1 in each act
- [ ] Events presented as timed speech bubble sequences over the protagonist puppets on stage
- [ ] Speech bubbles appear and fade in sequence using existing speech bubble infrastructure
- [ ] After dialogue, two choice buttons appear: "Side with [Protagonist A]" / "Side with [Protagonist B]"
- [ ] After player chooses, the chosen protagonist shows a reaction speech bubble
- [ ] Outcomes apply immediately (Gold, HP, cards, buffs/debuffs, etc.)
- [ ] At least 6 narrative events implemented with protagonist-pair-specific dialogue for Aldric + Pip
- [ ] Events are fully data-driven — defined in config files, not hardcoded
- [ ] Event data structure supports multiple protagonist pairs (keyed by pair, with dialogue and choices per pair)
- [ ] Event outcomes persist in run save data (M1) — including any "next combat" modifiers
- [ ] Events and merchant integrated into the revised act structure: Combat → Event → Combat → Merchant → Boss

**Integration:**

- [ ] Between-combat navigation shows the player where they are in the act (progress indicator updated for new structure)
- [ ] All new screens (event, merchant) use curtain transitions consistent with existing scene transitions
- [ ] The event and merchant text fits the shadow puppet theater tone — backstage vignettes, not generic fantasy

---

## M7 — Meta-Progression

### Goal

Give players long-term goals across runs through a Ticket currency and a set of unlock tracks. Players earn Tickets based on run performance and spend them to advance sequential unlock paths that expand the game's content — new cards, Stage Props, MacGuffin variants, alternative basic cards, and eventually new protagonist pairs.

### Currency: Tickets

**Tickets** are the meta-progression currency, earned across runs and spent between runs on permanent unlocks.

#### Earning Tickets

The primary driver is run performance — how far you get matters most.

- **Acts completed:** The main source. Completing Act 1 pays X, Act 2 pays more, Act 3 (full clear) pays the most. Failed runs still earn Tickets for acts completed — every run generates progress.
- **Bosses defeated:** Small bonus per boss kill.
- **First-time achievements:** One-time Ticket bursts that frontload progression for new players. Examples: "First time defeating [specific boss]," "First time reaching 10 Ovation," "First time having 5+ unique debuffs on an enemy," "First time winning a run." These make early runs feel rewarding even when the player is still learning.
- **Gold conversion:** Unspent Gold at end of run converts to Tickets at a small ratio (e.g., 10:1). A pleasant bonus, never worth hoarding Gold over spending at the merchant.

#### Spending Tickets

Tickets are spent on **unlock tracks** from a dedicated "Backstage" menu accessible from the title screen. This is the meta-progression hub where the player views their progress, sees what's available, and makes purchases.

---

### Unlock Tracks

Progression is structured as a set of sequential tracks — one per content category. Each track has multiple tiers, purchased one at a time with escalating Ticket costs. The player's strategic choice is which track to invest in, not which specific item to buy.

Within each track, the unlock order is curated during design. The player sees the next unlock before purchasing — no mystery, no randomness. Early tiers fill gaps and add variety. Later tiers are splashier and more build-defining.

#### Track List

| Track                   | Tiers | What Unlocks                                    | Approximate Cost Range   |
| ----------------------- | ----- | ----------------------------------------------- | ------------------------ |
| **Aldric's Repertoire** | 5     | New Aldric cards added to reward pools          | 20 → 60 Tickets per tier |
| **Pip's Repertoire**    | 5     | New Pip cards added to reward pools             | 20 → 60 Tickets per tier |
| **Neutral Cards**       | 3     | Neutral cards that work with either protagonist | 25 → 45 Tickets per tier |
| **Stage Props**         | 4-5   | New Stage Props entering the boss/merchant pool | 25 → 50 Tickets per tier |
| **MacGuffin Variants**  | 3-4   | New MacGuffin types selectable at run start     | 80 → 100 Tickets each    |
| **Alternative Basics**  | 2-4   | Variant starting cards per protagonist          | 30 Tickets each          |
| **New Cast Members**    | 1+    | New protagonist pairs                           | 150+ Tickets each        |

#### Track Details

**Aldric's Repertoire / Pip's Repertoire**
Each tier adds 1-2 cards to that protagonist's reward pool. Early tiers fill identified gaps (Taunt payoffs for Aldric, Luck payoffs for Pip). Later tiers add rares with powerful synergies. The order is designed so each unlock feels like it opens a new strategic angle. Five tiers at escalating cost means this track is a steady investment across many runs.

**Neutral Cards**
A shorter track that adds cards usable by either protagonist. Gating these behind progression solves the "neutral cards feel generic" problem — they don't need to be generic if they're earned. The player has enough context by the time they unlock neutrals to appreciate what they enable.

**Stage Props**
Each tier unlocks 1-2 new Stage Props entering the randomized boss reward and merchant pools. More props = more variety per run, not guaranteed access to specific props. The player is expanding the possibility space.

**MacGuffin Variants**
The signature unlock track. Each tier unlocks a new MacGuffin type that can be selected at run start alongside the protagonist pair. This is the most mechanically distinctive thing about Curtain Call — a third strategic axis that no other deckbuilder offers.

MacGuffin variants come with different starting cards and a passive ability that changes how you evaluate every card in the reward pool:

- **Treasure Chest** (default, always available): Standard Block + Inspire starting cards. No passive. The clean baseline.
- **Ancient Tome**: Starting cards grant card draw and energy instead of Block and Inspire. Passive: "After playing 5 cards in a single turn, draw 1 card." Pushes tempo and velocity — play cheap cards fast, draw more, play more. Pairs naturally with Pip's cheap debuff cards.
- **Crown**: Starting cards grant Ovation directly and Block. Passive: "Ovation cannot decay below 2." Makes Ovation a reliable baseline resource rather than something that builds and decays. Changes how you value every Ovation-scaling card.
- **Cursed Idol**: Higher MacGuffin HP (roughly +50%), but one starting card is a Curse — costs 1 energy, does nothing, cannot be removed. Trading deck consistency for durability. The interesting question: build around the clog or minimize its impact? A later unlock for experienced players.
- **Fragile Heirloom**: Lower MacGuffin HP, but starts with a stronger card (e.g., 0-cost "gain 2 Inspire"). Glass cannon — fragile but your cards hit harder from the start. Rewards tight play.

The combination of protagonist pair + MacGuffin variant creates the real replayability. Aldric + Pip + Treasure Chest plays completely differently from Aldric + Pip + Ancient Tome. When new protagonist pairs are added, the combinatorial space explodes.

**Alternative Basics**
Each unlock replaces one of a protagonist's two basic cards with a variant that redirects their synergy tree. For example, Aldric's Galvanize (deal 3, gain 1 Taunt) could have an alternative like "deal 2, gain 2 Shield" — same character, completely different build identity. The player selects their basic variant during character select. Cheaper to implement than a new character, nearly as impactful on run identity.

**New Cast Members**
The most expensive and aspirational track. A new protagonist pair with unique silhouettes, card pools, basic cards, voice lines, and narrative event dialogue. The silhouette appears on the character select screen, locked, creating a visible goal. Each new pair also requires custom dialogue for every narrative event — this is a significant content investment per pair (see M6 narrative event notes).

---

### Difficulty Modifiers

Difficulty modifiers are **achievement-gated, not currency-gated**. They're challenges you earn the right to attempt, not content you buy.

- **Difficulty 1:** Default. Always available.
- **Difficulty 2:** Unlocked by beating the game once. Enemies have increased HP.
- **Difficulty 3:** Unlocked by beating the game on Difficulty 2. Enemies start with a buff, reduced starting energy.
- **Further levels:** Each unlocked by clearing the previous. Each adds a stacking constraint — more enemy HP, less starting resources, harsher enemy patterns, fewer card rewards, etc.

Difficulty modifiers are clearly communicated on the title screen before run start. They're the long-term mastery challenge that keeps the game interesting after all content is unlocked.

Difficulty scaling also addresses the "game gets easier as you unlock more" dynamic that all roguelikes with meta-progression face. Unlocks add new toys and options; difficulty modifiers add new challenges. Both give the player a reason to start another run.

---

### Backstage Menu (UI)

The meta-progression hub, accessible from the title screen. Shows:

- **Unlock tracks** with current progress, next available tier, cost, and a preview of what the next unlock adds
- **Run history** — recent runs with protagonist pair, MacGuffin, result (win/loss), act reached
- **Achievements** — first-time milestones with their Ticket bonuses (completed and remaining)
- **Difficulty selection** — available difficulty levels with descriptions of their modifiers
- **Ticket balance** — current Tickets with a sense of what they can afford

The visual design should feel like going backstage at the theater — warmer, more intimate than the stage itself. Maybe a corkboard with pinned unlock cards, or a dressing room mirror with achievements reflected in it.

---

### Definition of Done

**Ticket Currency:**

- [ ] Tickets earned at end of each run based on acts completed, bosses defeated, and first-time achievements
- [ ] Gold-to-Ticket conversion applied at end of run
- [ ] Ticket balance stored in SQLite meta-progression table (separate from run saves)
- [ ] Ticket balance displayed on title screen and in Backstage menu

**Unlock Tracks:**

- [ ] At least 5 unlock tracks implemented with sequential tiers and escalating costs
- [ ] Each track shows: current progress, next tier preview, cost
- [ ] Purchasing a tier deducts Tickets and immediately adds content to the game (cards enter reward pools, props enter boss/merchant pools, MacGuffins appear on character select, etc.)
- [ ] Aldric's Repertoire and Pip's Repertoire tracks with at least 3 tiers each
- [ ] At least 1 MacGuffin variant unlockable and selectable at run start
- [ ] At least 1 alternative basic card unlockable and selectable at character select
- [ ] Unlock data persisted in SQLite — survives across runs and page refreshes

**Backstage Menu:**

- [ ] Accessible from title screen
- [ ] Displays all unlock tracks with progress and purchasing UI
- [ ] Displays run history (last 10+ runs with key stats)
- [ ] Displays achievements with Ticket values (completed and remaining)
- [ ] Displays difficulty selection with modifier descriptions

**Difficulty Modifiers:**

- [ ] At least 3 difficulty levels implemented
- [ ] Difficulty 2+ gated behind achievement (beat the game on previous difficulty)
- [ ] Difficulty selection available before starting a run
- [ ] Difficulty modifiers clearly communicated (what changes at each level)
- [ ] Selected difficulty affects gameplay as described (enemy HP, buffs, resource constraints, etc.)

**Achievements:**

- [ ] At least 8 first-time achievements defined with one-time Ticket rewards
- [ ] Achievements tracked and awarded automatically during/after runs
- [ ] Achievements viewable in Backstage menu

**Integration:**

- [ ] Meta-progression data completely separate from run data — clearing/abandoning a run never resets progression
- [ ] Unlocked content correctly appears in all relevant contexts (reward pools, character select, merchant, boss rewards)
- [ ] New protagonist pairs (when added) integrate with narrative events — events require pair-specific dialogue

---

## Spike Milestones — Card Balance & Additions

### What These Are

Unnumbered, insertable-anywhere milestones triggered by playtesting. When a gap is identified (e.g., "Block keyword needs more card support" or "Pip has no good late-game scaling"), a spike addresses it.

### Process

1. Identify the gap through playtesting or design review
2. Design 2-4 cards (or rebalance existing ones) targeting the gap
3. Implement and test
4. Brief playtest to verify the gap is addressed without creating new imbalances

### Known Gaps (from current card analysis)

- **Block support:** Only 3 cards directly grant Block (Bulwark, Block, Aegis). Block-based strategies need more tools — especially cards that reward having Block.
- **Retaliate payoff:** Only Bulwark grants Retaliate. The "Dramatic Lighting" enchantment helps, but more Retaliate sources would make it a real archetype.
- **Cross-protagonist synergy:** Few cards explicitly reward playing both protagonists' cards in a turn. Cooperative Strike is the only one that references "the other protagonist."
- **Luck payoff:** Luck accumulates but there are limited ways to spend or cash in a large Luck pool. Lucky Shot, Quick Draw, and Good Fortune generate Luck, but the payoffs are thin.
- **Inspire chains:** Inspire boosts one card, then it's gone. No way to build Inspire stacks for a massive single payoff.

### Definition of Done (per spike)

- [ ] Gap clearly identified and documented
- [ ] 2-4 cards designed, reviewed, and implemented (or existing cards rebalanced)
- [ ] Cards added to appropriate pools in `cards.js`
- [ ] At least one playtest run using the new/changed cards
- [ ] No regressions in existing card interactions
