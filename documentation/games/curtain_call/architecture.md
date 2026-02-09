# Curtain Call — Code Architecture

*Last updated: February 8, 2026. Post-refactor file layout.*

---

## File Layout

All game files live under two directories:

```
static/js/solo/curtain-call/    ← JavaScript (7 files)
templates/solo/curtain-call.html ← HTML template (Jinja2)
```

### JavaScript Files

| File | Lines | Role | Dependencies |
|------|------:|------|-------------|
| `cards.js` | 415 | Card definitions, card pools, starting deck, keyword glossary | None |
| `enemies.js` | 82 | Enemy definitions, act structure | None |
| `game.js` | 369 | **Core class:** constructor, init, setup, deck management, debug API | `cards.js`, `enemies.js` |
| `combat.js` | 799 | Turn loop, enemy AI, card play, effect resolution, status effects | `game.js` (extends prototype) |
| `renderer.js` | 628 | Card rendering, HP bars, speech bubbles, status effect display | `game.js` (extends prototype) |
| `ui.js` | 757 | Events, menus, scene flow, curtain transitions, rewards, card zoom | `game.js` (extends prototype) |
| `audience.js` | 429 | Audience type data + generation/animation prototype methods | `cards.js` (for KEYWORD_GLOSSARY), `game.js` (extends prototype) |

### Load Order

```html
<!-- 1. Data files (no dependencies, define global constants) -->
<script src="cards.js"></script>
<script src="enemies.js"></script>

<!-- 2. Core class definition -->
<script src="game.js"></script>

<!-- 3. Prototype extensions (require CurtainCallGame class) -->
<script src="combat.js"></script>
<script src="renderer.js"></script>
<script src="ui.js"></script>

<!-- 4. Audience: data constants + prototype extensions -->
<script src="audience.js"></script>

<!-- 5. Instantiate after everything is loaded -->
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

`cards.js`, `enemies.js`, and `audience.js` (top portion) define global constants:

- `CARD_DEFINITIONS` — keyed by card ID, contains all card data
- `CARD_POOLS` — arrays of card IDs per protagonist/neutral pool
- `STARTING_DECK` — array of card IDs for initial deck
- `KEYWORD_GLOSSARY` — keyword display info and tutorial hints
- `ENEMY_DEFINITIONS` — keyed by enemy ID, contains HP/pattern/speech
- `ACT_STRUCTURE` — scene and boss layout per act
- `AUDIENCE_TYPES` — audience member visual data
- `AUDIENCE_TYPE_LIST`, `ADULT_AUDIENCE_TYPES`, `CHILD_AUDIENCE_TYPES` — derived selection lists

The constructor references these via `this.enemies = ENEMY_DEFINITIONS` etc.

---

## Method Inventory

### game.js (15 methods)

Core lifecycle and deck management:
- `constructor`, `init`, `setup`
- `initializeDeck`, `shuffleDeck`, `drawCard`
- `wait` (Promise-based delay utility)

Debug API:
- `exposeDebugAPI`, `restartCombat`
- `setMacGuffinHP`, `setEnemyHP`, `setBlock`, `setIntent`, `setEnergy`, `resetEnergy`

### combat.js (31 methods)

Turn management:
- `startTurn`, `drawToHandSize`, `endTurn`

Enemy AI:
- `executeEnemyTurn`, `enemyAttack`, `enemyBlock`, `enemyHeal`, `enemyBuff`, `enemyDebuff`
- `setNextEnemyIntent`, `onDefeat`

Card play:
- `onCardTap`, `canPlayCard`, `getEffectiveCardCost`, `playCard`, `executeCardEffects`

Effect resolution:
- `dealDamageToEnemy`, `gainBlock`, `drawCards`, `healMacGuffin`, `gainEnergy`
- `gainWard`, `gainOvation`, `gainCurtain`
- `applyDebuffToEnemy`, `cleanseDeBufss`, `desperatePlea`, `grandFinale`
- `onEnemyDefeated`

Status effects:
- `tickStatusEffects`, `resetTurnEffects`

### renderer.js (22 methods)

Card rendering:
- `renderHand`, `createCardElement`, `getCardType`, `createZoomedCardElement`

Combat display:
- `renderCombatState`, `renderMacGuffinHP`, `renderMacGuffinBlock`, `renderEnemyHP`, `renderEnemyIntent`
- `renderEnergy`, `renderStatusEffects`, `updateCardPlayability`, `updateCardSelection`

Speech bubbles:
- `showSpeechBubble`, `showDamageBubble`, `showBlockBubble`, `showHealBubble`, `showAttackBubble`, `showCharacterBubble`

Other rendering:
- `onPuppetTap`, `renderRewardCards`, `renderEnemyChoices`

### ui.js (32 methods)

Event handling:
- `bindEvents`, `titleToKeywordKey`, `onEndTurn`

Card zoom:
- `startLongPress`, `cancelLongPress`, `showCardZoom`, `hideCardZoom`
- `showKeywordExplanations`, `showExplanationPage`, `clearExplanationBubbles`, `clearKeywordExplanations`

Audience interaction:
- `getRandomAudienceMembers`, `showAudienceBubble`, `showAudienceExplanation`

Rewards:
- `showRewardsScreen`, `getRandomCardFromPool`, `selectReward`, `confirmReward`, `skipReward`, `hideRewardsScreen`

Menus:
- `showTitleScreen`, `showCharacterSelect`, `startPerformance`

Curtain transitions:
- `curtainTransition`, `curtainClose`, `curtainOpen`

Scene flow:
- `showSceneSelection`, `selectEnemy`, `startCombatWithEnemy`, `startBossCombat`
- `advanceScene`, `onActComplete`, `updateProgressIndicator`

### audience.js (8 prototype methods)

- `initializeAnimations`, `generateAudience`, `createAudienceMember`
- `scheduleAudienceBob`, `scheduleAudienceWave`, `triggerAudienceWave`
- `triggerRandomTutorialHint`, `triggerAudienceReaction`

---

## Editing Guide

**To modify combat mechanics:** Edit `combat.js`. You need ~800 lines of context.

**To change card rendering or speech bubbles:** Edit `renderer.js`. ~630 lines.

**To change menus, scene flow, or curtain transitions:** Edit `ui.js`. ~760 lines.

**To add/change cards, enemies, or keywords:** Edit the data files (`cards.js`, `enemies.js`). These are pure data — no logic.

**To change audience behavior:** Edit `audience.js`. Data at top, animation methods at bottom.

**To change initialization, deck logic, or debug tools:** Edit `game.js`. ~370 lines.

**To add a new prototype extension file:**
1. Create the file with `Object.assign(CurtainCallGame.prototype, { ... })`
2. Add a `<script>` tag in `curtain-call.html` between `game.js` and the instantiation line
3. Ensure no method name collisions (last definition wins silently)

---

## Known Limitations

- **No ES modules.** All files use global scope via `<script>` tags. This is by design for the Parlor platform (vanilla JS, no build step).
- **VS Code TypeScript inference** may show warnings about prototype-extended methods not existing on the class. These are cosmetic — runtime behavior is correct.
- **Method name collisions** across prototype extension files are silent. The last `Object.assign` wins. Keep method names unique across all files.
