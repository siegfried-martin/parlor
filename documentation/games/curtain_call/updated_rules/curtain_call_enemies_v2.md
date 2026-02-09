# Curtain Call — Enemy Roster v2

*Redesigned for the v2 keyword system. All enemies have at least one attack targeting all allies (MacGuffin + both protagonists). Damage values are preliminary — balance through playtesting.*

*Notation: "All" = hits MacGuffin, Aldric, and Pip individually (each hit resolves through the full damage sequence independently). "Target" = MacGuffin (default enemy target).*

---

## Design Principles for Enemies

- **Every enemy telegraphs intent.** No hidden information. The challenge is resource management, not guessing.
- **Most enemies have one AoE attack** in their rotation. This forces protagonist HP management into every fight, not just Taunt-heavy builds.
- **A few enemies are AoE-heavy** as a differentiator — these are the fights where protagonist HP becomes the central concern.
- **Enemies can use the same keywords as players** (Block, Regenerate, Inspire, etc.). This creates puzzle-solving: "how do I get through their Block?" → Piercing. "How do I stop their healing?" → Poison.
- **Custom passive abilities** give enemies unique identities beyond their attack patterns. These are always visible to the player.
- **Act I teaches.** Simple patterns, low damage, one gimmick per enemy.
- **Act II tests.** Enemies punish passive play or force specific keyword interactions.
- **Act III punishes.** Complex patterns, harsh debuffs, high stakes. Weak decks get exposed.

---

## Act I — "The Opening"

*Target damage range: 3–7 single target, 2–3 AoE. Enemies teach core mechanics one at a time.*

### Stage Rat
- **HP:** 25
- **Teaches:** Blocking basics and AoE awareness.
- **Passive:** None. The simplest enemy in the game.
- **Pattern (repeating):**
  1. Attack Target 5
  2. Attack Target 5
  3. Attack All 2
- **Notes:** Pure introductory enemy. Predictable 3-turn cycle. The AoE turn is light (2 to each = 6 total) but introduces the concept. Player learns: "I need Block for single hits, and AoE means my protagonists take chip damage too."

### Rusty Knight
- **HP:** 30
- **Teaches:** Enemy defenses and attack timing.
- **Passive:** *Rusty Armor* — Starts the fight with 3 Block (one-time).
- **Pattern (repeating):**
  1. Gain 5 Block
  2. Attack Target 7
  3. Attack All 3
- **Notes:** Opening Block plus turn 1 Block means the player's first attacks bounce. Teaches "enemies can have defenses too" and creates the timing question: do I attack into Block or wait? Piercing cards immediately feel valuable. Player learns: "Attack timing matters. Piercing bypasses Block."

### Moth Swarm
- **HP:** 20
- **Teaches:** Multi-hit attacks and the value of Distract.
- **Passive:** *Erratic* — Cannot be affected by Fear or Frustration (immune to slow-build debuffs).
- **Pattern (repeating):**
  1. Attack Target 2 ×3
  2. Attack All 1 ×2
  3. Attack Target 2 ×3
- **Notes:** Low individual hits but high hit count. Distract negates an entire hit regardless of amount — premium value here. The Erratic passive teaches that some enemies resist certain strategies (you can't just Frustration-lock everything). AoE is multi-hit too, making it the only enemy where AoE interacts with Distract meaningfully. Player learns: "Distract absorbs whole hits. Some enemies are immune to certain debuffs."

### Stagehand
- **HP:** 25
- **Teaches:** Snowballing threats and kill urgency.
- **Passive:** *Curtain Rigging* — Gains 1 Inspire at the end of every turn (permanent, automatic, in addition to pattern actions).
- **Pattern (repeating):**
  1. Attack Target 4
  2. Attack Target 4
  3. Attack All 2
- **Notes:** The pattern itself is simple, but the passive Inspire stacking makes every turn more dangerous. By turn 4, single-target is 8 and AoE is 6. By turn 7, it's 11 and 9. This is a pure DPS check — the longer the fight, the worse it gets. Player learns: "Some enemies have passive abilities. Kill fast or lose slowly."

### Boss: The Critic
- **HP:** 45
- **Teaches:** Debuffs, phase transitions, and healing enemies.
- **Passive:** *Scathing Pen* — Whenever The Critic inflicts a debuff, heal 3 HP.
- **Phase 1 (repeating until <50% HP):**
  1. Attack Target 6
  2. Inflict Forgetful 2 on random protagonist
  3. Attack All 3
- **Phase 2 (<50% HP):**
  1. Attack Target 8
  2. Inflict Vulnerable 2 on all allies
  3. Attack Target 5 ×2
- **Phase transition:** Gains 5 Block.
- **Notes:** The passive heals 3 HP every time a debuff lands — twice in phase 1's cycle (Forgetful), once per cycle in phase 2 (Vulnerable). Total healing is modest (3-6 per cycle) but extends the fight. Poison counters this directly by suppressing healing. Phase 2 drops the AoE but Vulnerable on everyone before a double-hit is dangerous. Player learns: "Debuffs hurt. Enemies can heal — Poison is the answer. Bosses change behavior at half HP."

---

## Act II — "Rising Action"

*Target damage range: 5–10 single target, 3–5 AoE. Enemies require specific keyword interactions or build strategies.*

### Phantom Understudy
- **HP:** 35
- **Teaches:** Anti-healing strategy and Regenerate.
- **Passive:** *Understudy's Resilience* — Gains Regenerate 2 whenever dropping below 50% HP (triggers once).
- **Pattern (repeating):**
  1. Attack Target 7
  2. Gain Regenerate 2. Gain 4 Block.
  3. Attack All 3
  4. Attack Target 8
- **Notes:** Between the pattern Regenerate and the passive Regenerate (on first drop below 50%), this enemy can heal back a significant chunk. Poison both damages and suppresses all that healing. Without Poison, this fight becomes a war of attrition the player loses. Block on turn 2 protects the Regenerate investment. Player learns: "Poison isn't just damage — it shuts down healing. Some passives trigger on HP thresholds."

### Prop Master
- **HP:** 40
- **Teaches:** Breaking through defenses and Weak as an enemy tool.
- **Passive:** *Stage Fortress* — Block on this enemy does not fully reset at start of turn. Instead, reduce by half (rounded down).
- **Pattern (repeating):**
  1. Gain 8 Block
  2. Attack Target 6. Inflict Weak 1 on all allies.
  3. Attack All 4
  4. Attack Target 9
- **Notes:** The passive means Block accumulates across turns — 8 on turn 1, then ~4 leftover on turn 2, etc. Over time, there's usually a persistent Block floor. Weak on the player makes their own Block cards less effective on the turn before AoE — nasty timing. Piercing is the cleanest answer. Player learns: "Piercing bypasses Block. Enemies can apply Weak to reduce my defenses."

### Shadow Mimic
- **HP:** 30
- **AoE-Heavy Differentiator**
- **Teaches:** Protagonist HP as central resource, reactive damage.
- **Passive:** *Mirror Spite* — Whenever the Shadow Mimic takes damage, inflict 1 Burn on the attacking protagonist.
- **Pattern (repeating):**
  1. Attack All 4
  2. Attack All 3
  3. Attack Target 7
- **Notes:** Two AoE turns out of three, plus the passive punishes every attack by burning the attacker. Pip (10 HP) attacking this enemy repeatedly will burn herself down. The player must balance "I need to kill it fast" against "every attack costs me protagonist HP." Aldric with his larger HP pool and Cleanse card is the safer attacker. Galvanize's per-protagonist healing offsets the Burn. Player learns: "Some enemies punish aggression. Think about WHO attacks, not just whether to attack."

### Spotlight Phantom
- **HP:** 35
- **Teaches:** Ward value, Fear/Frustration pressure, and Accuracy as an enemy tool.
- **Passive:** *Blinding Light* — Attacks by this enemy have Accuracy (bypass Taunt and Distract, don't trigger Retaliate).
- **Pattern (repeating):**
  1. Attack Target 6. Inflict Fear 2 on random protagonist.
  2. Attack All 3. Inflict Frustration 1 on random protagonist.
  3. Attack Target 7
  4. Inflict Burn 2 on all allies.
- **Notes:** The Accuracy passive means Taunt and Distract don't work as defense here — only Block and Shield absorb damage. This forces players who've been relying on evasion to pivot to flat damage reduction. Fear and Frustration build slowly across the fight. Ward negates the debuff applications. Player learns: "Accuracy bypasses my Taunt and Distract. I need Block/Shield against this enemy. Ward protects against debuffs."

### Boss: The Director
- **HP:** 60
- **Teaches:** Complex debuff layering, Confused, and adaptation between phases.
- **Passive:** *Casting Call* — At the start of each phase, The Director inflicts a random debuff (Forgetful, Vulnerable, or Weak) for 1 turn on all allies.
- **Phase 1 (repeating until <50% HP):**
  1. Attack Target 8
  2. Inflict Forgetful 2 on protagonist A. Inflict Fear 2 on protagonist A.
  3. Attack All 4
  4. Attack Target 6 ×2
- **Phase 2 (<50% HP):**
  1. Attack Target 10
  2. Inflict Confused 2 on all allies. Gain Regenerate 2.
  3. Attack All 5
  4. Inflict Frustration 2 on protagonist B. Attack Target 7.
- **Phase transition:** Clears all debuffs on self. Gains 8 Block.
- **Notes:** Phase 1 stacks Forgetful + Fear on one protagonist — if the fight drags, that protagonist gets Stage Fright. Phase 2 applies Confused globally, disrupting Taunt/Distract strategies, then builds Frustration on the OTHER protagonist. The Director systematically disables both heroes across the fight. The Casting Call passive adds an extra random debuff each phase, making Ward even more valuable. Player learns: "Bosses systematically target weaknesses. Confused disrupts evasion. Manage both protagonists' debuff stacks."

---

## Act III — "The Climax"

*Target damage range: 8–16 single target, 4–7 AoE. Enemies exploit specific weaknesses and demand tight play.*

### Prima Donna
- **HP:** 45
- **Teaches:** DPS race, Retaliate as an enemy keyword.
- **Passive:** *Dramatic Ego* — Has permanent Retaliate 2. Gains 1 Inspire at the end of every turn.
- **Pattern (repeating):**
  1. Attack Target 8
  2. Gain 4 Shield. Attack Target 6.
  3. Attack All 5
  4. Attack Target 7 ×2
- **Notes:** Permanent Retaliate 2 means every player attack deals 2 damage back to the MacGuffin (or the taunting protagonist). Combined with permanent Inspire stacking, this is a race: every turn makes the enemy stronger and every attack costs the player HP. Accuracy on attacks bypasses Retaliate. Shield on the enemy protects against some damage — Piercing helps. High attack count decks (like Pip's multi-hit) take more Retaliate damage. Player learns: "Retaliate punishes every attack. Accuracy avoids it. Sometimes fewer, bigger hits are better than many small ones."

### Comedy/Tragedy Mask
- **HP:** 50
- **Teaches:** Rhythm recognition, reactive passives, and burst windows.
- **Passive:** *Two Faces* — While in Comedy: 50% reduced damage taken. While in Tragedy: immune to debuffs.
- **Comedy turn:**
  1. Attack All 3. Heal 5.
- **Tragedy turn:**
  1. Attack Target 12. Inflict Vulnerable 2 on all allies.
- **Alternates Comedy → Tragedy → Comedy → Tragedy...**
- **Notes:** Comedy turns have 50% damage reduction — hitting hard is wasteful. Use Comedy turns to set up (play Inspire, buff, build Ovation). Tragedy turns take full damage but are immune to debuffs — pure damage window, no point using Poison or Forgetful. The heal on Comedy demands Poison... but Poison only works during Comedy when damage is halved. The strategic puzzle: apply Poison during Comedy (half damage but stops healing) and burst during Tragedy (full damage but no debuffs stick). Player learns: "Read passive abilities. Adapt strategy to enemy state. Sometimes the obvious play isn't optimal."

### Puppeteer's Hand
- **HP:** 40
- **AoE-Heavy Differentiator**
- **Teaches:** Debuff cleansing, desperate survival, and protagonist knockout management.
- **Passive:** *Tangled Strings* — While any protagonist has 3+ total debuff stacks, this enemy's attacks deal +3 damage.
- **Pattern (repeating):**
  1. Inflict Fear 2 on random protagonist. Attack All 4.
  2. Inflict Burn 1 and Poison 1 on all allies. Attack All 4.
  3. Attack Target 8.
  4. Inflict Frustration 2 on random protagonist. Attack All 5.
- **Notes:** Three out of four turns are AoE. Burn + Poison on all allies is brutal for protagonist HP. The passive rewards debuff stacking — Fear 2 + Burn 1 + Poison 1 = 4 stacks on a protagonist, activating the +3 damage bonus. Cleansing (Aldric's Cleanse) and Ward are essential to keep debuff counts low. Without them, AoE goes from 4-5 to 7-8 per target. Player learns: "Debuff management isn't optional. Cleanse and Ward save runs. Some passives punish you for ignoring debuffs."

### Fallen Curtain
- **HP:** 50
- **Teaches:** Reading buildup patterns, Piercing necessity, and Curse as an enemy tool.
- **Passive:** *Iron Curtain* — Cannot be affected by Forgetful or Vulnerable (immune to damage modifier debuffs).
- **Pattern (repeating):**
  1. Gain 10 Block. Gain Regenerate 1.
  2. Inflict Curse 8 on MacGuffin. Gain 6 Block.
  3. Attack All 4. Attack Target (equal to current Block).
- **Notes:** Spends two turns stacking defenses and planting a Curse, then unleashes a burst. The Curse hits at end of turn for 8 damage (reduced by Block/Shield the player has). The Target attack equals current Block — potentially 16 if uncontested. Immune to Forgetful and Vulnerable, so the player can't just debuff their way through. Piercing is essential for chipping through Block. Poison handles the Regenerate. The player must decide: spend resources breaking the enemy's Block wall, or invest in their own defenses to survive the burst? Player learns: "Curse is delayed damage I need to block. Piercing is mandatory against defensive enemies. Not every enemy can be debuffed the same way."

### Final Boss: The Playwright
- **HP:** 80
- **Three Phases.** The ultimate test of everything learned across the run.
- **Passive:** *Narrative Control* — At the start of each turn, if the Playwright has any debuffs, 25% chance to clear one random debuff from itself.

**Phase 1 — "Act One" (80–54 HP):**
  1. Attack Target 8
  2. Inflict Forgetful 2 on both protagonists
  3. Attack All 4
  4. Attack Target 6 ×2. Gain Regenerate 2.

**Phase 2 — "Plot Twist" (53–27 HP):**
- **Transition:** Clears all debuffs on self. Gains 10 Block. Gains permanent Retaliate 2.
  1. Attack Target 12
  2. Inflict Fear 2 on protagonist A. Inflict Frustration 2 on protagonist B.
  3. Attack All 5. Inflict Burn 1 on all allies.
  4. Attack Target 8 ×2

**Phase 3 — "The Final Page" (<27 HP):**
- **Transition:** Clears all debuffs on self. Gains 3 Inspire (permanent). Loses Retaliate.
  1. Attack Target 14
  2. Inflict Vulnerable 2 on all allies. Attack All 6.
  3. Attack Target 10 ×2. Heal 8.
  4. Inflict Burn 2 and Poison 2 on all allies. Attack All 5.

**Notes:** Phase 1 is the warm-up — Forgetful and moderate damage. Regenerate creates a Poison incentive. Phase 2 introduces Retaliate (punishing aggressive play) while building Fear/Frustration toward conversion. Burn chip damage pressures protagonist HP. The player must balance offense (through Retaliate damage) against the clock of Fear/Frustration reaching 5. Phase 3 is the finale — permanent Inspire means escalating damage, Vulnerable + AoE is devastating, Burn + Poison on everyone threatens protagonist knockouts, and the heal demands Poison (which may have been cleared at transition). The Narrative Control passive means debuffs on the Playwright aren't fully reliable — the player can't just stack Forgetful and coast. Player learns: "Everything matters. Adapt to phase transitions. Manage resources across a long fight. Win."

---

## Enemy Keyword Usage Summary

### Keywords Used Offensively (Against Player)

| Keyword | Used By |
|---------|---------|
| **Forgetful** | The Critic, The Director, The Playwright |
| **Vulnerable** | The Critic, Comedy/Tragedy Mask, The Playwright |
| **Fear** | Spotlight Phantom, The Director, Puppeteer's Hand, The Playwright |
| **Frustration** | Spotlight Phantom, The Director, Puppeteer's Hand, The Playwright |
| **Burn** | Shadow Mimic (passive), Spotlight Phantom, Puppeteer's Hand, The Playwright |
| **Poison** | Puppeteer's Hand, The Playwright |
| **Weak** | Prop Master |
| **Confused** | The Director |
| **Curse** | Fallen Curtain |

### Keywords Used Defensively (By Enemies)

| Keyword | Used By |
|---------|---------|
| **Block** | Rusty Knight, Prop Master, Fallen Curtain, The Director, The Playwright |
| **Shield** | Prima Donna |
| **Regenerate** | Phantom Understudy, Fallen Curtain, The Playwright |
| **Inspire** | Stagehand (passive), Prima Donna (passive), The Playwright (Phase 3) |
| **Retaliate** | Prima Donna (passive), The Playwright (Phase 2) |
| **Accuracy** | Spotlight Phantom (passive) |

### Custom Enemy Passives

| Enemy | Passive | Effect |
|-------|---------|--------|
| Rusty Knight | *Rusty Armor* | Starts fight with 3 Block |
| Moth Swarm | *Erratic* | Immune to Fear and Frustration |
| Stagehand | *Curtain Rigging* | Gains 1 Inspire at end of every turn |
| The Critic | *Scathing Pen* | Heals 3 HP whenever inflicting a debuff |
| Phantom Understudy | *Understudy's Resilience* | Gains Regenerate 2 on first drop below 50% HP |
| Prop Master | *Stage Fortress* | Block reduces by half at start of turn instead of full reset |
| Shadow Mimic | *Mirror Spite* | Inflicts 1 Burn on the attacking protagonist whenever it takes damage |
| Spotlight Phantom | *Blinding Light* | All attacks have Accuracy |
| The Director | *Casting Call* | Inflicts a random debuff (Forgetful/Vulnerable/Weak) for 1 turn on all allies at start of each phase |
| Prima Donna | *Dramatic Ego* | Permanent Retaliate 2. Gains 1 Inspire at end of every turn. |
| Comedy/Tragedy Mask | *Two Faces* | Comedy: 50% reduced damage taken. Tragedy: immune to debuffs. |
| Puppeteer's Hand | *Tangled Strings* | +3 attack damage while any protagonist has 3+ total debuff stacks |
| Fallen Curtain | *Iron Curtain* | Immune to Forgetful and Vulnerable |
| The Playwright | *Narrative Control* | 25% chance per turn to clear one random debuff from itself |

### Keywords NOT Used by Enemies (by design)

| Keyword | Reason |
|---------|--------|
| **Luck** | Player-only. RNG that hurts the player feels bad. |
| **Flourish** | Player-only Ovation interaction. |
| **Taunt** | Enemies attack the MacGuffin by default; redirection is a player mechanic. |
| **Distract** | Player evasion mechanic. Enemies use Block/Shield instead. |
| **Ward** | Kept out for now so player debuffs feel reliable. Could appear on future enemies as debuff immunity. |

---

## AoE Frequency Summary

| Enemy | AoE Turns | Total Turns | AoE Ratio |
|-------|-----------|-------------|-----------|
| Stage Rat | 1 | 3 | 33% |
| Rusty Knight | 1 | 3 | 33% |
| Moth Swarm | 1 | 3 | 33% |
| Stagehand | 1 | 3 | 33% |
| The Critic | 1 (P1) / 0 (P2) | 3 / 3 | 33% / 0% |
| Phantom Understudy | 1 | 4 | 25% |
| Prop Master | 1 | 4 | 25% |
| **Shadow Mimic** | **2** | **3** | **67%** |
| Spotlight Phantom | 1 | 4 | 25% |
| The Director | 1 per phase | 4 / 4 | 25% |
| Prima Donna | 1 | 4 | 25% |
| Comedy/Tragedy Mask | 1 (Comedy) | 2 | 50% |
| **Puppeteer's Hand** | **3** | **4** | **75%** |
| Fallen Curtain | 1 | 3 | 33% |
| The Playwright | 1 (P1) / 1-2 (P2) / 2 (P3) | 4 / 4 / 4 | 25% / 38% / 50% |

---

## Encounter Progression Checklist

This tracks which concepts the player should understand by the time they face each enemy.

| After Fighting... | Player Should Understand |
|-------------------|------------------------|
| Stage Rat | Block, AoE exists, basic turn flow |
| Rusty Knight | Enemy defenses, attack timing, Piercing value |
| Moth Swarm | Multi-hit, Distract, some enemies resist debuffs |
| Stagehand | Enemy passives, Inspire stacking, kill urgency |
| The Critic | Debuffs (Forgetful, Vulnerable), enemy healing, Poison as counter, phase transitions |
| Phantom Understudy | Regenerate, Poison suppresses healing, HP threshold passives |
| Prop Master | Persistent enemy Block, Weak debuff, Piercing necessity |
| Shadow Mimic | Protagonist HP management, reactive passives, choosing who attacks |
| Spotlight Phantom | Accuracy, Fear/Frustration buildup, Ward, Block/Shield vs Taunt/Distract |
| The Director | Confused, debuff layering, phase adaptation, Ward urgency |
| Prima Donna | Retaliate, DPS race, attack count tradeoffs |
| Comedy/Tragedy Mask | State-based passives, rhythm, strategy adaptation per turn |
| Puppeteer's Hand | Debuff management, Cleanse, AoE survival, conditional passives |
| Fallen Curtain | Curse, buildup-burst patterns, enemy debuff immunities |
| The Playwright | Everything combined |
