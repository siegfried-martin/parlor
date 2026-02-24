# Curtain Call v2 — Comprehensive Verification Guide

This guide covers milestones 17–29 (the full v2 overhaul). Open the browser console for debug commands throughout.

---

## 0. Setup

1. Start the server and navigate to the Curtain Call game page
2. Open browser DevTools console — you should see `Curtain Call: Debug API available at window.gameDebug`
3. Verify `gameDebug.getState()` returns an object with `combat`, `keywords`, `energy`, `hand`, etc.

### Quick Debug Reference

```js
// State
gameDebug.getState()

// HP
gameDebug.setMacGuffinHP(current, max)
gameDebug.setEnemyHP(current, max)
gameDebug.setProtagonistHP('aldric', current, max)
gameDebug.knockout('aldric')

// Defense (per-turn)
gameDebug.setBlock(value)
gameDebug.setShield('aldric', value)
gameDebug.setTaunt('aldric', value)
gameDebug.setDistract(value)
gameDebug.setRetaliate(value)

// Keywords
gameDebug.setKeyword('inspire', value)    // also: fortify, piercing, accuracy, ward, luck, flourish, ovation, weak, confused, curse
gameDebug.setEnemyKeyword('block', value) // also: shield, regenerate, inspire, retaliate, accuracy
gameDebug.setDebuff('aldric', 'poison', value) // also: burn, stageFright, heckled, forgetful, vulnerable, fear, frustration

// Intent
gameDebug.setIntent(type, value, hits, target)  // type: attack/block/heal/buff/debuff, target: undefined or 'all'

// Cards
gameDebug.addCard('galvanize')  // add to hand
gameDebug.listCards()            // show all card IDs
gameDebug.draw(3)                // draw from deck

// Other
gameDebug.setEnergy(current, max)
gameDebug.resetEnergy()
gameDebug.restart()              // restart combat (Stage Rat)
```

---

## 1. Title Screen & Menu Flow

| # | Test | Expected |
|---|------|----------|
| 1.1 | Load page | Title screen shows with "Curtain Call" header and "Raise the Curtain" button |
| 1.2 | Click "Raise the Curtain" | Curtain close animation → Character select screen appears |

---

## 2. Character Select & Starting Deck (M25)

| # | Test | Expected |
|---|------|----------|
| 2.1 | Character select loads | Aldric panel (left) and Pip panel (right) visible with descriptions |
| 2.2 | Aldric description | "Tanky protector. Shields the MacGuffin with Block, Shield, and Taunt." |
| 2.3 | Pip description | "Tricky debuffer. Inflicts status effects and uses Distract to evade." |
| 2.4 | Basic card options | Aldric shows Galvanize / Bulwark; Pip shows Quick Jab / Lucky Shot |
| 2.5 | Select Galvanize + Quick Jab | Both options highlight (radio-style, one per protagonist) |
| 2.6 | Click "Begin Performance" | Curtain transition → Scene selection for Act 1: The Opening |
| 2.7 | Verify starting deck | `gameDebug.getState()` → `deckSize` + `hand.length` + `discardSize` = 10 (3× Galvanize + 3× Quick Jab + 3× Block + 1× Inspire) |

---

## 3. Scene Selection & Act Progression (M23, M27, M29)

| # | Test | Expected |
|---|------|----------|
| 3.1 | Act 1 scene 1 | Choose between Stage Rat and Rusty Knight |
| 3.2 | Scene title | Shows "Act 1: The Opening — Scene 1" |
| 3.3 | Progress indicator | Shows dots for all 3 acts with act labels, first dot highlighted |
| 3.4 | Select an enemy | Curtain transition → combat begins against chosen enemy |

---

## 4. Health System (M17)

### 4a. MacGuffin HP (per-run, unhealable)

| # | Test | Expected |
|---|------|----------|
| 4.1 | MacGuffin starts at 50/50 | HP bar centered on stage, full |
| 4.2 | `gameDebug.setMacGuffinHP(30)` | HP bar updates to 30/50 |
| 4.3 | After winning combat, start next | MacGuffin HP stays at whatever it was (carries between combats) |
| 4.4 | `gameDebug.setMacGuffinHP(0)` | Game over / defeat screen triggers |

### 4b. Protagonist HP (per-combat, resettable)

| # | Test | Expected |
|---|------|----------|
| 4.5 | Aldric starts at 20/20 | HP bar visible below Aldric puppet |
| 4.6 | Pip starts at 10/10 | HP bar visible below Pip puppet |
| 4.7 | `gameDebug.setProtagonistHP('aldric', 5)` | Aldric HP bar shows 5/20 |
| 4.8 | After winning combat, start next | Both protagonists reset to full HP |

### 4c. Knockout

| # | Test | Expected |
|---|------|----------|
| 4.9 | `gameDebug.knockout('aldric')` | Aldric puppet dims (`.knocked-out` class), HP shows 0 |
| 4.10 | Try to play an Aldric card | Card cannot be played (Aldric is knocked out) |
| 4.11 | Pip cards still playable | Pip is not knocked out |
| 4.12 | Both KO'd doesn't end game | Game continues — MacGuffin can still take damage |

---

## 5. Damage Resolution Pipeline (M18)

### 5a. Basic Pipeline

Enter combat and use debug commands to test each step:

| # | Test | Expected |
|---|------|----------|
| 5.1 | `gameDebug.setBlock(10)` → end turn (enemy attacks for 5) | Block absorbs 5 → Block shows 5 remaining. Speech bubble "Blocked 5" |
| 5.2 | No block, no defenses → end turn | MacGuffin takes raw damage |
| 5.3 | `gameDebug.setTaunt('aldric', 1)` → end turn (enemy attacks MacGuffin) | Hit redirected to Aldric. Aldric HP decreases. Taunt decrements to 0. Speech bubble "Redirected!" |
| 5.4 | `gameDebug.setDistract(1)` → end turn | First hit negated entirely. Distract decrements. Speech bubble "Distracted!" |
| 5.5 | `gameDebug.setShield('aldric', 5)` + `gameDebug.setTaunt('aldric', 1)` → end turn | Hit redirects to Aldric via Taunt, then Shield absorbs before Block |
| 5.6 | `gameDebug.setRetaliate(3)` → end turn | Enemy attacks, then takes 3 damage back. Speech bubble "Retaliate 3!" |

### 5b. Multi-Hit

| # | Test | Expected |
|---|------|----------|
| 5.7 | `gameDebug.setIntent('attack', 3, 3)` + `gameDebug.setTaunt('aldric', 1)` → end turn | First hit redirected to Aldric (Taunt consumed), hits 2 & 3 go to MacGuffin |
| 5.8 | `gameDebug.setIntent('attack', 3, 3)` + `gameDebug.setDistract(2)` → end turn | First 2 hits negated by Distract, 3rd hit goes through |
| 5.9 | `gameDebug.setIntent('attack', 5, 2)` + `gameDebug.setBlock(7)` → end turn | Hit 1: Block absorbs 5 (2 left). Hit 2: Block absorbs 2, 3 damage goes through to target |

### 5c. AoE Attacks

| # | Test | Expected |
|---|------|----------|
| 5.10 | `gameDebug.setIntent('attack', 4, 1, 'all')` → end turn | MacGuffin, Aldric, and Pip all take damage independently |
| 5.11 | AoE + Block: `gameDebug.setBlock(5)` + AoE attack → end turn | Block pool shared — first target resolved eats Block, later targets may get less |
| 5.12 | AoE + Taunt: `gameDebug.setTaunt('aldric', 1)` + AoE → end turn | MacGuffin's hit redirected to Aldric. Aldric still also takes AoE hit. Pip takes AoE hit |

---

## 6. Keyword Engine — Positive Keywords (M19)

### 6a. Block (global pool, resets per turn)

| # | Test | Expected |
|---|------|----------|
| 6.1 | Play "Block" card (costs 1 energy, gains 3 Block) | Block indicator appears on MacGuffin area showing 3 |
| 6.2 | End turn → next turn starts | Block resets to 0 (after enemy attacks) |

### 6b. Distract, Taunt, Shield, Retaliate (tested in section 5 above)

### 6c. Inspire

| # | Test | Expected |
|---|------|----------|
| 6.3 | `gameDebug.setKeyword('inspire', 2)` | "Inspire 2" shows in status effects area |
| 6.4 | Play an attack card dealing 3 base damage | 3 + 2 (Inspire) = 5 damage to enemy |
| 6.5 | Inspire persists across turns | Still shows after turn ends (permanent until removed) |

### 6d. Fortify

| # | Test | Expected |
|---|------|----------|
| 6.6 | `gameDebug.setKeyword('fortify', 2)` → play Block card (3 Block) | Gain 3 + 2 = 5 Block |
| 6.7 | Fortify decays by 1 at start of next turn | Fortify goes from 2 → 1 |

### 6e. Piercing

| # | Test | Expected |
|---|------|----------|
| 6.8 | `gameDebug.setKeyword('piercing', 1)` → play attack card | Damage bypasses enemy Block/Shield |
| 6.9 | Piercing decays by 1 next turn | Goes from 1 → 0 |

### 6f. Accuracy

| # | Test | Expected |
|---|------|----------|
| 6.10 | Give enemy accuracy: `gameDebug.setEnemyKeyword('accuracy', 1)` → enemy attacks while you have Taunt/Distract active | Taunt/Distract bypassed (accuracy ignores them) |
| 6.11 | Accuracy also ignores Retaliate | Enemy with accuracy doesn't take Retaliate damage back |

### 6g. Ward

| # | Test | Expected |
|---|------|----------|
| 6.12 | `gameDebug.setKeyword('ward', 2)` | "Ward 2" in status area |
| 6.13 | Enemy inflicts a debuff → Ward blocks it | Ward decrements by 1, debuff NOT applied. Speech bubble shows ward blocked |
| 6.14 | Ward is permanent until consumed | Stays between turns |

### 6h. Luck

| # | Test | Expected |
|---|------|----------|
| 6.15 | `gameDebug.setKeyword('luck', 5)` → play attack card multiple times | 50% chance of 1.5× damage. Should see some enhanced hits in console/speech bubbles |
| 6.16 | Luck decays by 1 each turn | Goes down each turn start |

### 6i. Flourish

| # | Test | Expected |
|---|------|----------|
| 6.17 | `gameDebug.setKeyword('flourish', 1)` → play attack card that hits enemy | Ovation gain doubled (+2 instead of +1 per hit) |
| 6.18 | Flourish resets at turn start | Goes to 0 next turn |

### 6j. Regenerate (protagonist-specific)

| # | Test | Expected |
|---|------|----------|
| 6.19 | `gameDebug.setProtagonistHP('aldric', 10)` then `gameDebug.setDebuff('aldric', 'regenerate' ...)` — Note: regenerate is positive but stored per-protagonist | Use a card that grants Regenerate if available, or set via debug |
| 6.20 | Start of next turn | Aldric heals for Regenerate amount, Regenerate decays by 1 |

---

## 7. Keyword Engine — Negative Keywords (M19)

### 7a. Poison

| # | Test | Expected |
|---|------|----------|
| 7.1 | `gameDebug.setDebuff('aldric', 'poison', 3)` → next turn starts | Aldric takes 3 damage, Poison decays to 2 |
| 7.2 | Try to heal Aldric while poisoned | Healing suppressed (Poison blocks healing) |

### 7b. Burn

| # | Test | Expected |
|---|------|----------|
| 7.3 | `gameDebug.setDebuff('pip', 'burn', 2)` → next turn | Pip takes 2 damage, Burn decays to 1 |
| 7.4 | Burn does NOT suppress healing | Unlike Poison, healing still works |

### 7c. Stage Fright

| # | Test | Expected |
|---|------|----------|
| 7.5 | `gameDebug.setDebuff('aldric', 'stageFright', 1)` | Status shows on Aldric |
| 7.6 | Try to play an Attack card from Aldric | Cannot play — "Stage Fright!" blocks Attack type cards |
| 7.7 | Defense/Action cards still playable | Non-attack cards work fine |
| 7.8 | Decays by 1 next turn | Goes from 1 → 0 |

### 7d. Heckled

| # | Test | Expected |
|---|------|----------|
| 7.9 | `gameDebug.setDebuff('pip', 'heckled', 1)` | Status shows on Pip |
| 7.10 | Try to play a non-Attack card from Pip | Cannot play — Heckled blocks non-Attack cards |
| 7.11 | Attack cards still playable | Attack type cards work |

### 7e. Forgetful

| # | Test | Expected |
|---|------|----------|
| 7.12 | `gameDebug.setDebuff('aldric', 'forgetful', 1)` → play 6 damage attack | Deals 3 damage (50% reduction) |
| 7.13 | Decays by 1 each turn | |

### 7f. Vulnerable

| # | Test | Expected |
|---|------|----------|
| 7.14 | `gameDebug.setDebuff('aldric', 'vulnerable', 1)` + `gameDebug.setTaunt('aldric', 1)` → enemy attacks for 10 | Damage redirected to Aldric, increased by 50% → 15 |
| 7.15 | MacGuffin Vulnerable: check via `gameDebug.setDebuff(...)` if supported on macguffin | MacGuffin takes 50% more damage when Vulnerable |

### 7g. Weak

| # | Test | Expected |
|---|------|----------|
| 7.16 | `gameDebug.setKeyword('weak', 1)` → play Block 3 card | Gain ~1-2 Block instead of 3 (50% reduction) |
| 7.17 | Also reduces Shield generation | |

### 7h. Confused

| # | Test | Expected |
|---|------|----------|
| 7.18 | `gameDebug.setKeyword('confused', 1)` + `gameDebug.setDistract(1)` → enemy attacks | 50% chance Distract fails to trigger |
| 7.19 | Also affects Taunt and Retaliate with 50% failure | |

### 7i. Curse

| # | Test | Expected |
|---|------|----------|
| 7.20 | `gameDebug.setKeyword('curse', 5)` → end turn | After your turn ends but before enemy turn, deal 5 damage through Shield→Block to protagonist/MacGuffin. Curse consumed. |

### 7j. Fear & Frustration (accumulating → conversion)

| # | Test | Expected |
|---|------|----------|
| 7.21 | `gameDebug.setDebuff('aldric', 'fear', 4)` | Shows Fear 4 on Aldric |
| 7.22 | Enemy inflicts 1 more Fear (total 5) | Fear resets to 0, converts to Stage Fright 1 |
| 7.23 | `gameDebug.setDebuff('pip', 'frustration', 4)` → +1 Frustration | Converts to Heckled 1, resets to 0 |

---

## 8. Ovation System (M22)

| # | Test | Expected |
|---|------|----------|
| 8.1 | Ovation meter visible | Shows between MacGuffin and Pip on stage with value "0" |
| 8.2 | Play attack that hits enemy | Ovation +1 per hit (multi-hit = multiple gains) |
| 8.3 | `gameDebug.setKeyword('ovation', 3)` | Meter fills to 3/5 |
| 8.4 | Ovation 2–4: attack deals bonus damage | +1 damage on all attacks |
| 8.5 | `gameDebug.setKeyword('ovation', 5)` | Meter full, gold glow (`.ovation-max` style) |
| 8.6 | Ovation 5: attack deals bonus damage | +2 damage on all attacks |
| 8.7 | Turn starts | Ovation decays by 1 |
| 8.8 | MacGuffin takes unblocked damage | Ovation decreases by 1 per unblocked hit |
| 8.9 | Ovation meter caps at 5 | Cannot exceed 5 |
| 8.10 | Flourish active + hit enemy | Ovation gains doubled (+2 per hit instead of +1) |
| 8.11 | Start new combat | Ovation resets to 0 |

---

## 9. Cards (M20)

### 9a. Card Types & Filtering

| # | Test | Expected |
|---|------|----------|
| 9.1 | `gameDebug.listCards()` | Shows all 34 card IDs |
| 9.2 | Card type rendering | Attack cards, Defense cards, Action cards have visual distinction |
| 9.3 | Stage Fright blocks Attack type | See 7c above |
| 9.4 | Heckled blocks non-Attack type | See 7d above |

### 9b. Key Card Tests

Play through combat and test specific cards:

| # | Card | Test | Expected |
|---|------|------|----------|
| 9.5 | Galvanize (1 cost, Attack) | `gameDebug.addCard('galvanize')` → play | 3 damage + heal each protagonist 1 |
| 9.6 | Bulwark (2 cost, Attack) | `gameDebug.addCard('bulwark')` → play | 5 damage + 4 Block |
| 9.7 | Quick Jab (1 cost, Attack) | `gameDebug.addCard('quick-jab')` → play | 2 damage ×2 hits |
| 9.8 | Lucky Shot (1 cost, Attack) | `gameDebug.addCard('lucky-shot')` → play | 4 damage + Luck 1 |
| 9.9 | Block (1 cost, Defense) | `gameDebug.addCard('block')` → play | Gain 3 Block |
| 9.10 | Inspire (1 cost, Action) | `gameDebug.addCard('inspire')` → play | Gain 1 Inspire (permanent) |
| 9.11 | Protect (0 cost, Defense) | `gameDebug.addCard('protect')` → play | Shield 3 + Taunt 1 on Aldric |
| 9.12 | Coup de Grace (2 cost, Attack) | `gameDebug.addCard('coup-de-grace')` → play | Damage = 2× enemy debuff count |
| 9.13 | Stylish Dance (1 cost, Action) | `gameDebug.addCard('stylish-dance')` → play | Flourish + Draw 1 + Energy +1 |
| 9.14 | Captivating Strike (2 cost, Attack) | `gameDebug.addCard('captivating-strike')` → play | 6 damage + gain Ovation per hit |
| 9.15 | Ultimate Jeer (2 cost, Action) | `gameDebug.addCard('ultimate-jeer')` → play | Inflict Vulnerable 2 + Forgetful 1 + Weak 1 all enemies |
| 9.16 | Stoic Resistance (1 cost, Defense) | `gameDebug.addCard('stoic-resistance')` → play | Gain Block equal to current Ovation (blockOnDraw mechanic) |

---

## 10. Enemies — Act I (M21, M23)

### 10a. Stage Rat (25 HP)

| # | Test | Expected |
|---|------|----------|
| 10.1 | Pattern | Turn 1: Atk 5, Turn 2: Atk 5, Turn 3: AoE 2 (all), repeats |
| 10.2 | No passives | No passive label shown |
| 10.3 | Speech bubbles | "SQUEAK!" on attack, "EEK!" on hurt |

### 10b. Rusty Knight (30 HP)

| # | Test | Expected |
|---|------|----------|
| 10.4 | Passive: Rusty Armor | Starts combat with 3 Block. Label visible |
| 10.5 | Pattern | Block 5, Atk 7, AoE 3 |
| 10.6 | Speech bubbles | "FOR... SOMETHING!" / "CLANK." / "CLANG!" |

### 10c. Moth Swarm (20 HP)

| # | Test | Expected |
|---|------|----------|
| 10.7 | Passive: Erratic | Immune to Fear and Frustration |
| 10.8 | Pattern | Atk 2×3, AoE 1×2, Atk 2×3 |
| 10.9 | Test Fear immunity | `gameDebug.addCard(...)` with Fear inflict → Moth Swarm immune |

### 10d. Stagehand (25 HP)

| # | Test | Expected |
|---|------|----------|
| 10.10 | Passive: Curtain Rigging | +1 Inspire at end of enemy turn |
| 10.11 | Pattern | Atk 4, Atk 4, AoE 2 |
| 10.12 | Verify Inspire stacks | Enemy damage increases each turn cycle |

### 10e. Boss: The Critic (45 HP)

| # | Test | Expected |
|---|------|----------|
| 10.13 | Phase 1 pattern | Atk 6, Inflict Forgetful 2, AoE 3 |
| 10.14 | Passive: Scathing Pen | Heals 3 HP when inflicting a debuff |
| 10.15 | Phase 2 transition (<50% HP = <23 HP) | Gains 5 Block, pattern changes |
| 10.16 | Phase 2 pattern | Atk 8, Inflict Vulnerable 2 (all), Atk 5×2 |
| 10.17 | `gameDebug.setEnemyHP(22)` | Triggers phase transition with speech bubble |

---

## 11. Enemies — Act II (M26, M27)

### 11a. Phantom Understudy (35 HP)

| # | Test | Expected |
|---|------|----------|
| 11.1 | Passive: Understudy's Resilience | First time HP drops below 50% → gains Regenerate 2 |
| 11.2 | Pattern | Atk 6, Regen 2 + Atk 4, Atk 4×2 |
| 11.3 | Resilience triggers once | Damage to <50%, regen 2 appears. Damage again below 50% — no second trigger |

### 11b. Prop Master (40 HP)

| # | Test | Expected |
|---|------|----------|
| 11.4 | Passive: Stage Fortress | Block halves instead of fully resetting |
| 11.5 | Pattern | Block 8, Atk 7 + Weak 1, Block 5 + Atk 5 |
| 11.6 | Block carries over | End of turn: Block 8 → next turn: Block 4 (halved, not zero) |

### 11c. Shadow Mimic (30 HP)

| # | Test | Expected |
|---|------|----------|
| 11.7 | Passive: Mirror Spite | When you attack, Shadow Mimic inflicts 1 Burn on attacker (Aldric or Pip) |
| 11.8 | Pattern | AoE 3, Atk 5 + Burn 1 on all, AoE 2×2 |

### 11d. Spotlight Phantom (35 HP)

| # | Test | Expected |
|---|------|----------|
| 11.9 | Passive: Blinding Light | All enemy attacks have Accuracy (bypass Taunt/Distract/Retaliate) |
| 11.10 | Pattern | Atk 5 + Fear 1, Atk 6, Frustration 1 on all + Burn 1 on all |
| 11.11 | Test with Taunt | `gameDebug.setTaunt('aldric', 1)` → attack ignores Taunt due to Accuracy |

### 11e. Boss: The Director (60 HP)

| # | Test | Expected |
|---|------|----------|
| 11.12 | Passive: Casting Call | Random debuff on all at phase start |
| 11.13 | Phase 1 pattern | Atk 7 + Forgetful 1, Fear 2 on Aldric + Atk 5, Frustration 2 on Pip + Atk 5 |
| 11.14 | Phase 2 transition (<50% = <30 HP) | Clears self debuffs, gains 8 Block, pattern changes |
| 11.15 | Phase 2 pattern | Confused 1 on all + Atk 6, Regen 2 + Block 6, Frustration 2 on Pip + Atk 7 |

---

## 12. Enemies — Act III (M28, M29)

### 12a. Prima Donna (45 HP)

| # | Test | Expected |
|---|------|----------|
| 12.1 | Passive: Dramatic Ego | Starts with permanent Retaliate 2 (does NOT reset); +1 Inspire per turn |
| 12.2 | Pattern | Atk 5 + Inspire 1, Atk 7×2, Vulnerable 1 on all + AoE 4 |
| 12.3 | Retaliate persists | After enemy turn, Retaliate stays at 2 (not reset) |

### 12b. Comedy/Tragedy Mask (50 HP)

| # | Test | Expected |
|---|------|----------|
| 12.4 | Passive: Two Faces | Comedy state: 50% damage reduction; Tragedy state: debuff immune |
| 12.5 | Pattern alternates | Comedy: Block 6 + Atk 4, Tragedy: Atk 8 + Burn 1 on all |
| 12.6 | Test Comedy damage reduction | Attack during Comedy → damage halved |
| 12.7 | Test Tragedy debuff immunity | Inflict debuff during Tragedy → blocked |

### 12c. Puppeteer's Hand (40 HP)

| # | Test | Expected |
|---|------|----------|
| 12.8 | Passive: Tangled Strings | +3 damage if any protagonist has 3+ total debuff stacks |
| 12.9 | Pattern | AoE 4, Atk 5 + Fear 1 + Frustration 1, AoE 3×2 |
| 12.10 | Debuff stack test | `gameDebug.setDebuff('aldric', 'poison', 3)` → Puppeteer's attacks deal +3 |

### 12d. Fallen Curtain (50 HP)

| # | Test | Expected |
|---|------|----------|
| 12.11 | Passive: Iron Curtain | Immune to Forgetful and Vulnerable |
| 12.12 | Pattern | Block 10, Atk 6 + Curse 2, Block 8 + Atk 4 |
| 12.13 | Test immunity | `gameDebug.addCard(...)` with Forgetful inflict → blocked |

### 12e. Final Boss: The Playwright (80 HP)

| # | Test | Expected |
|---|------|----------|
| 12.14 | Passive: Narrative Control | 25% chance to clear a debuff each turn |
| 12.15 | Phase 1 "Act One" | Forgetful 1 on all + Atk 5, Block 6 + Regen 2, Atk 5×2 + Fear 1 |
| 12.16 | Phase 2 "Plot Twist" (<60% = <48 HP) | Transition: clear debuffs, gain 10 Block + Retaliate 2 permanent |
| 12.17 | Phase 2 pattern | Retaliate 3 + Atk 8, Frustration 2 + Burn 1 on all + Atk 5, AoE 4 + Fear 1 |
| 12.18 | Phase 3 "Final Page" (<30% = <24 HP) | Transition: clear debuffs, gain 3 permanent Inspire, lose Retaliate |
| 12.19 | Phase 3 pattern | Inspire 2 + Atk 6, Vulnerable 1 on all + AoE 5, Burn 2 + Poison 2 on all + Atk 5 + Heal 5 |
| 12.20 | `gameDebug.setEnemyHP(47)` | Phase 2 triggers |
| 12.21 | `gameDebug.setEnemyHP(23)` | Phase 3 triggers |

---

## 13. Rewards System

| # | Test | Expected |
|---|------|----------|
| 13.1 | Win normal combat | Reward screen shows 2 card options (1 from Aldric pool, 1 from Pip pool) |
| 13.2 | Select a reward card | Card added to deck. `gameDebug.getState().deckSize` increases |
| 13.3 | Card pools respect rarity | Mix of Uncommon and Rare cards appear over multiple rewards |

---

## 14. Full Run Flow (M29)

This is the complete end-to-end playthrough:

### Act I: The Opening
| # | Step | Expected |
|---|------|----------|
| 14.1 | Title → Character Select | Choose basics (Galvanize + Quick Jab) |
| 14.2 | Scene 1 | Choose Stage Rat or Rusty Knight → combat → win → reward |
| 14.3 | Scene 2 | Choose Moth Swarm or Stagehand → combat → win → reward |
| 14.4 | Boss | Fight The Critic → win → act transition |
| 14.5 | MacGuffin HP carries over | Note HP — it should be < 50 if you took any unblocked damage |

### Act II: Rising Action
| # | Step | Expected |
|---|------|----------|
| 14.6 | Act transition | Curtain close → "Act 2: Rising Action" → scene select |
| 14.7 | Scene 1 | Choose Phantom Understudy or Prop Master → win → reward |
| 14.8 | Scene 2 | Choose Shadow Mimic or Spotlight Phantom → win → reward |
| 14.9 | Boss | Fight The Director → win → act transition |

### Act III: The Climax
| # | Step | Expected |
|---|------|----------|
| 14.10 | Act transition | Curtain close → "Act 3: The Climax" → scene select |
| 14.11 | Scene 1 | Choose Prima Donna or Comedy/Tragedy Mask → win → reward |
| 14.12 | Scene 2 | Choose Puppeteer's Hand or Fallen Curtain → win → reward |
| 14.13 | Final Boss | Fight The Playwright (3 phases) → win |
| 14.14 | Victory | Victory screen appears after defeating The Playwright |

### Defeat Path
| # | Test | Expected |
|---|------|----------|
| 14.15 | MacGuffin reaches 0 HP at any point | Defeat screen with "Try Again" |
| 14.16 | Click "Try Again" | Returns to title screen |

---

## 15. Status Effects Display (Rendering)

| # | Test | Expected |
|---|------|----------|
| 15.1 | Global buffs area | Shows Distract, Retaliate, Inspire, Fortify, Piercing, Accuracy, Ward, Luck, Flourish when active |
| 15.2 | Global debuffs area | Shows Weak, Confused, Curse when active |
| 15.3 | Protagonist debuffs | Each protagonist shows their individual debuffs (Poison, Burn, Stage Fright, etc.) below their HP bar |
| 15.4 | Enemy keywords | Enemy area shows Block, Shield, Regenerate, Inspire, Retaliate, Accuracy when active |
| 15.5 | Enemy passive label | Enemy's passive ability name displayed near enemy |
| 15.6 | Ovation meter | Fills 0–5, gold glow at max |
| 15.7 | Block indicator | Shows on MacGuffin area when Block > 0 |

---

## 16. Reset & Cleanup Timing

| # | Test | Expected |
|---|------|----------|
| 16.1 | Per-turn defenses reset AFTER enemy turn | Block, Shield, Taunt, Distract, Retaliate all reset to 0 after enemy attacks (not at start of player turn) |
| 16.2 | Protagonist HP resets between combats | Start new combat → both at full HP |
| 16.3 | MacGuffin HP does NOT reset | Carries across all 9 encounters |
| 16.4 | Keywords reset between combats | All keywords (Inspire, Fortify, etc.) reset when starting new combat |
| 16.5 | Ovation resets between combats | Starts at 0 each fight |
| 16.6 | Deck preserved between combats | Same cards (including rewards) available in next fight |

---

## Quick Smoke Test (5 min)

If short on time, do this abbreviated check:

1. **Load** → title screen appears
2. **Character Select** → pick Galvanize + Quick Jab → Begin Performance
3. **Act I Scene 1** → pick Stage Rat → play cards → win
4. **Reward** → pick a card
5. **Act I Scene 2** → pick any → win → reward
6. **Act I Boss (Critic)** → fight through phase transition → win
7. **Act II loads** → fight 2 scenes + Director boss → all 3 acts visible in progress
8. **Act III loads** → fight 2 scenes + Playwright boss (3 phases)
9. **Victory screen** appears after Playwright defeat
10. **Console check**: `gameDebug.getState()` returns valid state at any point, no JS errors in console
