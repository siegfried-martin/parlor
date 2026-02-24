# Curtain Call — Code Architecture

*Last updated: February 21, 2026. Post-refactor file layout (11 prototype extension files).*

---

## File Layout

All game files live under two directories:

```
static/js/solo/curtain-call/         <- JavaScript (14 files + 5 config)
static/js/solo/curtain-call/config/  <- Speech & animation config (5 files)
templates/solo/curtain-call.html     <- HTML template (Jinja2)
```

### JavaScript Files

| File | Lines | Role |
|------|------:|------|
| **Config** | | |
| `config/speech-config.js` | 51 | Priority levels, cooldown, diminishing-returns curves |
| `config/animation-config.js` | 57 | Animation timing constants |
| `config/enemy-speech.js` | 153 | Per-enemy speech lines and trigger chances |
| `config/protagonist-speech.js` | 145 | Per-protagonist speech lines and trigger chances |
| `config/crowd-speech.js` | 81 | Crowd ambient dialogue, response pairs, game-event reactions |
| **Data** | | |
| `cards.js` | 862 | Card definitions, card pools, starting deck, keyword glossary |
| `enemies.js` | 515 | Enemy definitions, act structure, passives |
| **Core** | | |
| `game.js` | 569 | Class constructor, init, setup, deck management, keywords, debug API |
| **Combat** | | |
| `combat-turns.js` | 445 | Turn lifecycle, keyword processing, ovation, victory/defeat |
| `combat-enemy.js` | 670 | Enemy AI, actions, damage pipeline (enemy -> player), combat-start passives |
| `combat-cards.js` | 370 | Card playability, card play pipeline, effect queue, executeCardEffects |
| `combat-keywords.js` | 608 | Player -> enemy damage, keyword gains, debuffs, Fear/Frustration |
| **Rendering** | | |
| `renderer-cards.js` | 271 | Shared `_buildCardDOM` helper, hand/reward/zoomed card rendering |
| `renderer.js` | 511 | Combat state display (HP, intent, status), energy, speech bubbles |
| **UI** | | |
| `ui-events.js` | 410 | Event binding, drag-to-play system, end-turn handler |
| `ui-screens.js` | 736 | Card zoom, keyword explanations, rewards, deck list, menus, curtain transitions |
| `ui-scenes.js` | 269 | Scene selection, enemy selection, combat setup, act progression |
| **Audience** | | |
| `audience.js` | 560 | Audience type data, generation, animations, reactions |
| `audience-speech.js` | 393 | Speech priority engine, enemy/protagonist/crowd speech triggers |

### Load Order

```html
<!-- 1. Config (global constants, no dependencies) -->
<script src="config/speech-config.js"></script>
<script src="config/animation-config.js"></script>
<script src="config/enemy-speech.js"></script>
<script src="config/protagonist-speech.js"></script>
<script src="config/crowd-speech.js"></script>

<!-- 2. Data files (global constants, no dependencies) -->
<script src="cards.js"></script>
<script src="enemies.js"></script>

<!-- 3. Core class definition -->
<script src="game.js"></script>

<!-- 4. Combat system (extends prototype) -->
<script src="combat-turns.js"></script>
<script src="combat-enemy.js"></script>
<script src="combat-cards.js"></script>
<script src="combat-keywords.js"></script>

<!-- 5. Rendering (extends prototype) -->
<script src="renderer-cards.js"></script>
<script src="renderer.js"></script>

<!-- 6. UI (extends prototype) -->
<script src="ui-events.js"></script>
<script src="ui-screens.js"></script>
<script src="ui-scenes.js"></script>

<!-- 7. Audience (extends prototype) -->
<script src="audience.js"></script>
<script src="audience-speech.js"></script>

<!-- 8. Instantiate after everything is loaded -->
<script>const game = new CurtainCallGame();</script>
```

---

## Architecture Pattern

### Class + Prototype Extension

The game uses a single `CurtainCallGame` class defined in `game.js`. Other files extend it via:

```js
Object.assign(CurtainCallGame.prototype, {
    methodName() { ... },
    anotherMethod() { ... }
});
```

This lets us split a large class across files without ES modules. All methods share `this` — they're true instance methods, just defined in separate files.

### Data Files

`cards.js`, `enemies.js`, and the `config/` files define global constants:

- `CARD_DEFINITIONS` — keyed by card ID, contains all card data
- `CARD_POOLS` — arrays of card IDs per protagonist/neutral pool
- `STARTING_DECK` — array of card IDs for initial deck
- `KEYWORD_GLOSSARY` — keyword display info and tutorial hints
- `ENEMY_DEFINITIONS` — keyed by enemy ID, contains HP/pattern/speech/passives
- `ACT_STRUCTURE` — scene and boss layout per act
- `AUDIENCE_TYPES` — audience member visual data (in `audience.js`)
- `SPEECH_CONFIG`, `ENEMY_SPEECH`, `PROTAGONIST_SPEECH`, `CROWD_*` — speech system config

The constructor references these via `this.enemies = ENEMY_DEFINITIONS` etc.

### Shared Card DOM Helper

`renderer-cards.js` provides `_buildCardDOM(card, options)` — a shared helper that builds the full card DOM structure (rarity borders, energy blips, perforation, name, description, type badge, Aldric rivets). Three thin wrappers call it:

- `createCardElement` — adds dataset attributes + playability classes for hand cards
- `createZoomedCardElement` — adds `zoomed` class and extra rivets
- `renderRewardCards` — adds `reward-card` class and dataset index

---

## Method Inventory

### game.js — Core lifecycle & deck management

- `constructor`, `init`, `setup`
- `initializeDeck`, `shuffleDeck`, `drawCard`
- `resetKeywords`, `renderKeywords`
- `wait` (Promise-based delay utility)
- `exposeDebugAPI`, `restartCombat`
- Debug setters: `setMacGuffinHP`, `setEnemyHP`, `setBlock`, `setIntent`, `setEnergy`, `resetEnergy`

### combat-turns.js — Turn lifecycle & ovation

- `startTurn`, `drawToHandSize`, `endTurn`
- `processStartOfTurnKeywords`, `_decayPlayerDebuffs`, `processEndOfTurnCurse`
- `processEnemyTurnStartPassives`
- `gainOvation`, `loseOvation`, `getOvationDamageBonus`, `renderOvationMeter`
- `onEnemyDefeated`, `onDefeat`

### combat-enemy.js — Enemy AI & damage pipeline (enemy -> player)

- `getCurrentPattern`, `getCurrentPatternEntry`, `executeEnemyTurn`, `setNextEnemyIntent`
- `checkBossPhaseTransition`
- `enemyAttack`, `enemyAttackAoE`, `enemyBlock`, `enemyHeal`, `enemyGainKeyword`
- `resolveDamageHit`, `getTargetElement`, `triggerAbsorbAnimation`
- `applyCombatStartPassives`, `renderEnemyPassive`

### combat-cards.js — Card play & effect execution

- `canPlayCard`, `getEffectiveCardCost`, `playCard`
- `_reindexHandCards`, `_debouncedReflow`
- `_queueCardEffects`, `_processEffectQueue`, `_waitForEffectQueue`
- `executeCardEffects` (the big switch over effect types)

### combat-keywords.js — Keywords, debuffs & player -> enemy damage

- `dealDamageToEnemy`
- Keyword gains: `gainBlock`, `gainShield`, `gainTaunt`, `gainDistract`, `gainRetaliate`, `gainInspire`, `gainEnergy`, `drawCards`, `healProtagonists`
- Debuffs: `applyDebuffToProtagonist`, `applyDebuffFromEnemy`, `inflictDebuffOnEnemy`
- `checkFearFrustration`, `checkEnemyFearFrustration`, `resolveInflictTarget`

### renderer-cards.js — Card DOM construction

- `_buildCardDOM` (shared helper)
- `renderHand`, `createCardElement`, `getCardType`, `createZoomedCardElement`
- `renderRewardCards`, `renderEnemyChoices`
- `updateCardPlayability`

### renderer.js — Combat state display & speech bubbles

- `renderCombatState`, `renderProtagonistHP`, `renderProtagonistDefenses`
- `renderMacGuffinHP`, `renderMacGuffinBlock`
- `renderEnemyHP`, `renderEnemyIntent`
- `renderStatusEffects`, `renderProtagonistStatusIcons`, `renderEnemyStatusIcons`
- `renderEnergy`, `renderDeckCount`
- `showSpeechBubble`, `showDamageBubble`, `showBlockBubble`, `showHealBubble`
- `showAttackBubble`, `showCharacterBubble`
- `onPuppetTap`

### ui-events.js — Input handling & drag-to-play

- `bindEvents`, `titleToKeywordKey`, `onEndTurn`
- Drag system: `_startDrag`, `_onDragMove`, `_onDragEnd`, `_snapBack`, `_dropOnTarget`, `_resumeReflow`

### ui-screens.js — Overlays, menus & explanations

- Card zoom: `_extractCardKeywords`, `showCardZoom`, `hideCardZoom`
- Keywords: `showKeywordExplanations`, `clearExplanationBubbles`, `clearKeywordExplanations`
- Audience helpers: `getRandomAudienceMembers`, `showAudienceBubble`, `showAudienceExplanation`, `showEnemyPassiveExplanation`
- Rewards: `showRewardsScreen`, `getRandomCardByRarity`, `selectReward`, `confirmReward`, `skipReward`, `hideRewardsScreen`
- Deck list: `showDeckList`, `hideDeckList`, `showDeckListForRemoval`
- Menus: `showTitleScreen`, `showCharacterSelect`, `startPerformance`
- Curtains: `curtainTransition`, `curtainClose`, `curtainOpen`

### ui-scenes.js — Scene selection & act progression

- `showSceneSelection`, `selectEnemy`, `startCombatWithEnemy`
- `startBossCombat`, `advanceScene`, `onActComplete`
- `updateProgressIndicator`

### audience.js — Audience data & animations

Data constants: `AUDIENCE_TYPES`, `AUDIENCE_TYPE_LIST`, `ADULT_AUDIENCE_TYPES`, `CHILD_AUDIENCE_TYPES`, `PROTAGONIST_LINES`, `AUDIENCE_REACTIONS`, `ENEMY_EXPANDED_LINES`

Prototype methods:
- `initializeAnimations`, `generateAudience`, `createAudienceMember`
- `scheduleAudienceBob`, `scheduleAudienceWave`, `triggerAudienceWave`
- `triggerRandomTutorialHint`, `triggerAudienceReaction`

### audience-speech.js — Speech priority engine

- `initSpeechSystem`, `resetSpeechForCombat`
- Internal: `_canShowSpeech`, `_getDiminishedChance`, `_pickUnusedLine`, `_recordSpeech`
- Core dispatcher: `trySpeech`
- Triggers: `tryEnemySpeech`, `tryProtagonistSpeech`, `tryCrowdReaction`, `triggerCrowdAmbientDialogue`
- Legacy wrappers: `initVoiceLines`, `getOvationTier`, `tryProtagonistLine`, `tryAudienceReaction`, `getEnemyLine`, `showBossPhaseTransition`

---

## Editing Guide — Which Files to Load

Each task below lists the minimum files an AI needs in context (plus `game.js` which is always relevant):

| Task | Files to read |
|------|--------------|
| Change turn flow, ovation, or win/loss conditions | `combat-turns.js` |
| Change enemy AI, attack patterns, or boss phases | `combat-enemy.js`, `enemies.js` |
| Change card play logic or add new effect types | `combat-cards.js` |
| Change keyword/debuff mechanics or player damage | `combat-keywords.js` |
| Change card visual appearance | `renderer-cards.js` |
| Change HP bars, intent display, or speech bubbles | `renderer.js` |
| Change drag-to-play or event handlers | `ui-events.js` |
| Change card zoom, rewards, deck list, or menus | `ui-screens.js` |
| Change scene flow or act progression | `ui-scenes.js` |
| Change audience visuals or animations | `audience.js` |
| Change speech triggers, probabilities, or dialogue | `audience-speech.js`, `config/` files |
| Add/change cards, enemies, or keywords | `cards.js`, `enemies.js` (pure data) |

### Cross-File Dependencies

Methods frequently call across file boundaries. Key cross-file calls:

- **combat-turns.js** calls: `renderCombatState` (renderer), `renderHand` (renderer-cards), `executeEnemyTurn` (combat-enemy), `updateCardPlayability` (renderer-cards), `renderOvationMeter` (self), `showRewardsScreen` (ui-screens)
- **combat-enemy.js** calls: `resolveDamageHit` (self), `renderCombatState` (renderer), `showAttackBubble`/`showDamageBubble` (renderer), `tryEnemySpeech` (audience-speech), animation triggers (audience)
- **combat-cards.js** calls: `executeCardEffects` (self), all keyword methods in `combat-keywords.js`, `renderHand` (renderer-cards), `renderCombatState` (renderer)
- **combat-keywords.js** calls: `renderCombatState` (renderer), `showDamageBubble`/`showHealBubble`/`showBlockBubble` (renderer), `tryProtagonistSpeech`/`tryCrowdReaction` (audience-speech)
- **ui-events.js** calls: `showCardZoom`/`hideCardZoom` (ui-screens), `playCard` (combat-cards), `endTurn` (combat-turns)
- **ui-scenes.js** calls: `startTurn` (combat-turns), `renderCombatState` (renderer), `resetSpeechForCombat` (audience-speech), `curtainOpen`/`curtainClose` (ui-screens)

### Adding a New Prototype Extension File

1. Create the file with `Object.assign(CurtainCallGame.prototype, { ... })`
2. Add a `<script>` tag in `curtain-call.html` between `game.js` and the instantiation line
3. Ensure no method name collisions (last definition wins silently)

---

## Known Limitations

- **No ES modules.** All files use global scope via `<script>` tags. This is by design for the Parlor platform (vanilla JS, no build step).
- **VS Code TypeScript inference** may show warnings about prototype-extended methods not existing on the class. These are cosmetic — runtime behavior is correct.
- **Method name collisions** across prototype extension files are silent. The last `Object.assign` wins. Keep method names unique across all files.
