# Curtain Call — Speech & Animation System Spec

_Implementation spec for puppet animations, speech bubbles, and crowd dialogue. Config-driven — all lines, triggers, and probabilities should live in data files, not hardcoded in game logic._

---

## Core Principle

Life-like behavior comes from restraint and context-sensitivity. Characters should NOT speak after every action. Speech should feel like occasional, natural reactions — not narration. Animations should always play on attacks and hits, but speech is probabilistic and contextual.

---

## Speech Bubble System

### General Rules

- **Only one speech bubble on screen at a time.** If multiple triggers fire simultaneously, use the priority system (see below).
- **Cooldown:** Minimum 2–3 seconds between any two speech bubbles (across all sources — protagonists, enemy, crowd).
- **Display duration:** Speech bubbles stay visible for 1.5–2.5 seconds depending on text length, then fade out.
- **Max length:** Keep all lines to ~8 words or fewer. They need to read in a glance.
- **No queuing.** If a speech trigger fires during cooldown, it's simply skipped. Missed lines are fine — they make the ones that do appear feel more natural.

### Priority System

When multiple speech triggers fire at the same time (e.g., a big hit that also defeats the enemy), only the highest priority one displays.

| Priority    | Trigger Type                       |
| ----------- | ---------------------------------- |
| 1 (highest) | Protagonist knockout reaction      |
| 2           | Enemy defeat line                  |
| 3           | Boss phase transition              |
| 4           | Enemy first-encounter / AoE line   |
| 5           | Protagonist combat reaction        |
| 6           | Cross-protagonist reaction         |
| 7           | Crowd game-event reaction          |
| 8 (lowest)  | Crowd ambient / character-specific |

---

## Enemy Speech

### Guaranteed Lines (always play, 100% chance, once per fight)

| Trigger                            | Description                                                               | Lines Needed                |
| ---------------------------------- | ------------------------------------------------------------------------- | --------------------------- |
| **First attack**                   | Enemy's opening line on their very first attack action. Sets personality. | 1 per enemy                 |
| **First AoE attack**               | Fires the first time the enemy uses an AoE attack.                        | 1 per enemy                 |
| **Defeat**                         | Enemy reaches 0 HP.                                                       | 1–2 per enemy (random pick) |
| **Phase transition** (bosses only) | Boss enters a new phase.                                                  | 1 per phase per boss        |

These are the enemy's "character moments." They should always fire regardless of cooldown (override the cooldown for guaranteed lines).

### Contextual Lines (probabilistic, from shared + per-enemy pools)

| Trigger                              | Chance | Description                                                |
| ------------------------------------ | ------ | ---------------------------------------------------------- |
| **Takes 10+ damage in a single hit** | 40%    | Reaction to a big hit.                                     |
| **Heals**                            | 30%    | Only for enemies with healing in their pattern or passive. |
| **Applies a debuff**                 | 25%    | Taunting the player about the debuff.                      |
| **Gains Block/Shield**               | 20%    | Defensive posturing.                                       |

**Line pool structure:** Each trigger has a shared default pool (3–5 generic lines any enemy can use) plus optional per-enemy overrides. If an enemy has custom lines for a trigger, use those instead of the shared pool. Example: shared big-hit reaction might be "Oof!" or "That stung!" but The Critic's custom line might be "I've received worse reviews."

**Diminishing probability:** Each time a specific trigger fires for the same enemy in the same combat, reduce the chance by half. First big hit: 40%. Second: 20%. Third: 10%. This prevents repetition in longer fights.

### Example Enemy Personality (for reference, not exhaustive)

**Stage Rat:**

- First attack: "Squeak!"
- First AoE: "That means GIVE ME CHEESE!"
- Defeat: "Squeeeak..."

**The Critic:**

- First attack: "Let me see what we're working with."
- First AoE: "A performance for EVERYONE to suffer through."
- Defeat: "Fine. Two stars."
- Phase transition (→ P2): "Intermission is over."
- Custom big-hit reaction: "I've received worse reviews."
- Custom heal reaction: "The show must go on."

_Every enemy in the roster needs these lines written. The implementation agent should create a config file per enemy._

---

## Protagonist Speech

### Trigger Conditions

| Trigger                                                        | Base Chance | Description                                                            |
| -------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| **Deal 10+ damage in a single hit**                            | 30%         | Big damage moment.                                                     |
| **Block/Shield absorbs an entire attack** (0 damage to target) | 30%         | Full defense success.                                                  |
| **Distract negates a hit**                                     | 30%         | Evasion success.                                                       |
| **Reach Ovation 5**                                            | 30%         | Crowd is maxed out.                                                    |
| **Protagonist drops below 50% HP**                             | 40%         | Danger moment.                                                         |
| **Protagonist gets knocked out (0 HP)**                        | See below   | Special case — the OTHER protagonist reacts.                           |
| **Enemy defeated**                                             | 40%         | Victory moment.                                                        |
| **Debuff applied to enemy**                                    | 20%         | Pip-specific (her identity). Lower chance since it happens frequently. |

### Diminishing Probability Per Trigger

Same system as enemies. Each time the same trigger fires in the same combat, halve the chance. But the FIRST time a trigger fires in a combat, boost the chance to double the base rate (capped at 60%). This ensures the player almost always sees the "first big hit" quip.

| Occurrence             | Modifier                 |
| ---------------------- | ------------------------ |
| 1st time trigger fires | 2× base chance (max 60%) |
| 2nd time               | 1× base chance           |
| 3rd time               | 0.5× base chance         |
| 4th+ time              | 0.25× base chance        |

### Line Pools

Each protagonist needs 3–5 lines per trigger so repeated triggers don't always produce the same text. Lines should never repeat within the same combat — track which lines have been used and exclude them from the random pick.

**Tone guidance:**

- **Aldric:** Noble, earnest, formal. Short declarations. "Hold fast." / "The line holds." / "Well struck." / "For the treasure!"
- **Pip:** Cheeky, irreverent, playful. Quips and taunts. "Too easy!" / "Did that hurt?" / "Gotcha!" / "Oops, my bad."

### Cross-Protagonist Reactions

When one protagonist triggers a speech event, there's an **independent 15% chance** (not 30%) that the OTHER protagonist reacts instead of (not in addition to) the triggering protagonist. Only one speech bubble at a time.

| Trigger on Protagonist A | Protagonist B Might Say                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| Deals 10+ damage         | Compliment or playful rivalry                                              |
| Fully blocks an attack   | Acknowledgment or relief                                                   |
| Drops below 50% HP       | Concern                                                                    |
| Gets knocked out (0 HP)  | **100% chance.** Alarm/determination. This is a guaranteed cross-reaction. |
| Defeats enemy            | Shared celebration                                                         |

**Knockout cross-reaction is the one guaranteed protagonist speech event.** If Aldric goes down, Pip ALWAYS says something. If Pip goes down, Aldric ALWAYS says something. These should be unique, emotional lines — not generic quips. 2–3 lines per protagonist for this trigger.

Example:

- Pip knocked out → Aldric: "PIP! ...I'll finish this." / "No... I will not let this stand."
- Aldric knocked out → Pip: "Aldric?! OK... OK I can do this." / "Hey! Big guy! ...Fine, my turn."

---

## Crowd Dialogue

### Distribution

When a crowd event fires (existing system), the type is chosen by weighted random:

| Type                            | Weight | Description                                                    |
| ------------------------------- | ------ | -------------------------------------------------------------- |
| **Wave**                        | 40%    | Existing wave animation. No speech.                            |
| **Character-specific dialogue** | 30%    | Non-sequitur or personality line from a specific crowd member. |
| **Tutorial hint**               | 30%    | Existing tutorial hint system.                                 |

### Character-Specific Crowd Dialogue

Each crowd member already has a personality object. Extend this with a pool of 5–10 lines per character that reflect their personality, NOT the game state. These are ambient flavor — the audience having their own lives.

**Design guidelines:**

- Max 6–7 words per line.
- Should feel like overheard chatter, not directed at the player.
- Occasionally crowd members can react to each other (reference what a nearby character said in a previous line). This requires tracking the last crowd speech and having a small pool of "response" lines per character pair.
- Keep it light and funny. The crowd is comic relief.

**Example lines (for reference):**

- Bowtie guy: "Did I leave the oven on?" / "I paid HOW much for this seat?" / "Marvelous. Simply marvelous."
- Girl: "Dad said this would be amazing." / "When's the intermission?" / "I can't see over your hat."
- Response pair: Bowtie says "Marvelous." → Girl responds next time: "You say that every show."

### Game-Event Crowd Reactions

In addition to the ambient dialogue, the crowd can react to game events. These fire independently from the character-specific pool and use the existing crowd speech display (shown in the audience area).

| Trigger                          | Chance | Example Lines                                            |
| -------------------------------- | ------ | -------------------------------------------------------- |
| MacGuffin takes 8+ damage        | 30%    | "Be careful!" / "Watch out!" / "Oh no!"                  |
| Enemy defeated                   | 40%    | "Bravo!" / "Encore!" / "Magnificent!"                    |
| Ovation reaches 5                | 50%    | (Ties into existing wave/cheer system — crowd goes wild) |
| Protagonist knocked out          | 40%    | "Get up!" / "Someone help!" / "Oh dear..."               |
| Player fully blocks a big attack | 25%    | "What a save!" / "Incredible!"                           |

These use a shared line pool (not character-specific). Any random crowd member can say them. They should not conflict with character-specific ambient lines — if a game-event crowd reaction fires, it replaces the ambient line for that cycle.

---

## Animation System

### Core Principle

All attack and hit animations ALWAYS play. There is no probability — if a character attacks, the animation fires. If a character takes damage, the animation fires. Animations are fast, snappy, and puppet-like.

### Puppet Idle Animation

All puppets (protagonists, enemy, MacGuffin) should have a subtle ambient sway at all times. This sells the "held on a stick" puppet theater feel.

- **Motion:** Very slight rotation oscillation (±1–2 degrees) around the base/stick point.
- **Duration:** 3–4 second full cycle.
- **Easing:** Smooth sinusoidal.
- **Important:** This is always running. Attack/hit animations interrupt it briefly, then it resumes.

### Attack Animations

**Protagonist attacking (toward enemy, upward):**

- Lunge forward/upward toward the enemy (translate toward target).
- Slight rotation in the direction of the lunge (~3–5 degrees).
- Timing: 200ms forward (ease-out), 300ms return (ease-in).
- The puppet "thrusts" like someone jabbing a stick puppet.

**Enemy attacking MacGuffin (downward, single target):**

- Lunge downward toward the MacGuffin.
- Similar timing: 200ms down, 300ms return.
- Slight rotation forward (~3–5 degrees).

**Enemy AoE attack (sweep across stage):**

- Wider arc motion — the enemy puppet sweeps from one side to the other.
- Combine translateX arc with translateY (slight dip downward at the center of the sweep).
- Optional: subtle scale increase at the peak of the sweep (puppet comes "closer" to the audience, 1.0 → 1.05 → 1.0).
- Timing: 400–500ms for the full sweep.
- Should visually "pass over" all three ally positions.

### Hit/Damage Animations

**Protagonist or MacGuffin taking damage:**

- Small knockback (translate away from attacker, ~5–10px).
- Brief shake/wobble: 2–3 rapid small oscillations (±3px horizontal) over ~300ms.
- Like the puppet rod got jostled by the impact.

**MacGuffin at low HP (<30%):**

- Add a persistent subtle wobble animation (separate from hit reaction).
- Slightly faster and more erratic than the normal idle sway.
- Communicates danger without text.

**Enemy taking damage:**

- Same knockback + wobble as allies, but in the opposite direction (upward/backward).
- For 10+ damage hits, slightly larger knockback and an additional brief "flash" (opacity dip to 0.7 and back over 100ms).

### Damage Preview Animations

_Tie-in to the damage preview system from the ruleset._

**When a card is played that changes the damage forecast:**

- The forecast number should animate when it changes — brief scale pulse (1.0 → 1.2 → 1.0 over 200ms) on the number itself.
- Color transition from red to green when damage reaches 0 should be a smooth 300ms transition, not instant.
- The green checkmark/shield icon can have a small "pop in" animation (scale from 0 → 1.1 → 1.0).

### Animation Timing with Speech

- Speech bubbles should appear AFTER the animation they're reacting to, not during.
- Typical flow: attack animation plays (200–500ms) → brief pause (100ms) → speech bubble fades in (200ms) → holds (1500–2500ms) → fades out (200ms).
- If no speech triggers, the pause is skipped and the game continues immediately after the animation.

### Skew / Distortion

**Do NOT use skew during attack/hit animations.** Fast skew transformations look glitchy rather than shadow-like. The idle sway rotation is sufficient to sell the puppet feel. If skew is explored later, it should be a subtle persistent effect (±1 degree skewX on the idle animation), not tied to combat actions. Test this separately and only add if it looks convincing.

---

## Config File Structure

All speech lines, triggers, probabilities, and animation parameters should live in config/data files, not in game logic. The speech and animation systems should be generic engines that consume these configs.

### Suggested Config Files

| File                                             | Contents                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Per-enemy config** (one per enemy)             | Guaranteed lines (first attack, first AoE, defeat, phase transitions). Contextual line pools with trigger types. Custom probability overrides if different from defaults. |
| **Per-protagonist config** (one per protagonist) | Line pools per trigger type (3–5 lines each). Cross-reaction lines for partner's triggers. Knockout reaction lines (guaranteed).                                          |
| **Crowd config**                                 | Per-character personality lines (5–10 each). Character response pairs. Game-event shared reaction pools per trigger. Distribution weights (40/30/30).                     |
| **Animation config**                             | Timing values, distances, easing functions for each animation type. These should be tunable without changing code.                                                        |
| **Speech system config**                         | Global settings: cooldown duration, display duration, priority table, diminishing probability curve.                                                                      |

### Adding a New Enemy

To give a new enemy a full personality, the writer only needs to create one config file containing:

1. First attack line
2. First AoE line
3. Defeat line(s)
4. Phase transition lines (if boss)
5. Optional custom lines for contextual triggers (big hit reaction, heal reaction, etc.)

Everything else (probability, cooldown, display, animation) is handled by the generic system using defaults.

---

## Summary of Speech Probability Defaults

| Source         | Trigger                 | Base Chance         | Notes                                         |
| -------------- | ----------------------- | ------------------- | --------------------------------------------- |
| Enemy          | First attack            | 100%                | Guaranteed, once per fight                    |
| Enemy          | First AoE               | 100%                | Guaranteed, once per fight                    |
| Enemy          | Defeat                  | 100%                | Guaranteed                                    |
| Enemy          | Boss phase transition   | 100%                | Guaranteed, once per phase                    |
| Enemy          | Takes 10+ damage        | 40%                 | Diminishing per occurrence                    |
| Enemy          | Heals                   | 30%                 | Diminishing per occurrence                    |
| Enemy          | Applies debuff          | 25%                 | Diminishing per occurrence                    |
| Enemy          | Gains Block/Shield      | 20%                 | Diminishing per occurrence                    |
| Protagonist    | Deals 10+ damage        | 30%                 | First occurrence boosted to 60%               |
| Protagonist    | Fully blocks attack     | 30%                 | First occurrence boosted to 60%               |
| Protagonist    | Distract negates hit    | 30%                 | First occurrence boosted to 60%               |
| Protagonist    | Ovation reaches 5       | 30%                 | First occurrence boosted to 60%               |
| Protagonist    | Drops below 50% HP      | 40%                 | First occurrence boosted to 60%               |
| Protagonist    | Partner knocked out     | 100%                | Guaranteed cross-reaction                     |
| Protagonist    | Enemy defeated          | 40%                 | First occurrence boosted to 60%               |
| Protagonist    | Debuff applied to enemy | 20%                 | Pip-weighted. First occurrence boosted to 40% |
| Cross-reaction | Any protagonist trigger | 15%                 | Replaces self-reaction, not additional        |
| Crowd          | Game-event reaction     | 25–50%              | Varies by trigger (see table above)           |
| Crowd          | Character ambient       | 30% of crowd events | Non-game-state personality lines              |
