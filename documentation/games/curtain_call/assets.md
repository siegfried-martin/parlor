# Curtain Call — Assets: Protagonists, Cards & Enemies

This document defines the initial content for the first playable version of Curtain Call. The scope is deliberately tight: two Protagonists, a small card pool, and enough enemies to fill three acts. Expansion comes later once the core loop is validated.

## Protagonists

The first pair is designed to offer a clear mechanical contrast while being thematically complementary on stage together. One is a straightforward damage dealer, the other is a utility/control character. Together they cover offense, defense, and flexibility.

---

### Aldric, the Ironclad

**Silhouette:** Stocky, broad-shouldered figure with a large hammer. Round head, short legs — reads as sturdy and strong. Cute, not intimidating.

**Role:** Heavy hitter. Aldric's cards deal big damage and his keyword rewards committing to consecutive attacks.

**Stats:**

- Attack Bonus: +2 damage on Aldric's attack cards
- Defense Specialty: Block (+2 bonus when Aldric's cards grant Block)
- Keyword Affinity: **Charged** — consecutive attacks by Aldric deal escalating bonus damage

**Personality (speech bubbles):**

- On attack: `"CLANG!"` `"HAVE AT THEE!"` `"BONK!"`
- On taking damage: `"OOF."` `"I FELT THAT."`
- On big combo: `"I'M JUST GETTING STARTED!"`
- On idle too long: `"...WELL?"`

**Cross-protagonist lines (with Pip):**

- After Pip plays a trick: `"WAS THAT NECESSARY?"`
- When Pip is Heckled: `"IGNORE THEM."`
- When both combo: `"GOOD TEAMWORK!"` (Pip responds: `"YOU MEAN MY TEAMWORK."`)

---

### Pip, the Nimble

**Silhouette:** Small, wiry figure with oversized pointy hat and a trailing scarf. Maybe a dagger or wand in hand. Spiky, angular silhouette contrasts with Aldric's roundness.

**Role:** Utility and control. Pip's cards are cheaper, more numerous in effect, and revolve around card manipulation, debuffs, and tactical plays.

**Stats:**

- Attack Bonus: +0 (Pip's attacks are weaker but have effects attached)
- Defense Specialty: Ward (+1 bonus Ward when Pip's cards grant Ward)
- Keyword Affinity: **Encore** — Pip's key cards can be replayed if sequenced correctly

**Personality (speech bubbles):**

- On attack: `"THWIP!"` `"NYEH!"` `"GOTCHA!"`
- On taking damage: `"HEY!"` `"RUDE!"`
- On encore trigger: `"ONCE MORE!"` `"ENCORE, ENCORE!"`
- On playing a debuff: `"HOW'S THAT FEEL?"`

**Cross-protagonist lines (with Aldric):**

- After Aldric's big hit: `"SHOW-OFF."`
- When Aldric is Stage Frighted: `"DEEP BREATHS, BIG GUY."`
- When both combo: `"YOU MEAN MY TEAMWORK."`

---

## Card Pools

### Starting Deck (All Runs)

| Card                | Cost | Owner   | Effect                      | Upgraded Version            | Speech Bubble |
| ------------------- | ---- | ------- | --------------------------- | --------------------------- | ------------- |
| **Basic Block** ×4  | 1    | Neutral | Gain 5 Block.               | Gain 7 Block.               | `"BRACE!"`    |
| **Hammer Swing** ×2 | 1    | Aldric  | Deal 6 damage.              | Deal 8 damage.              | `"CLANG!"`    |
| **Quick Jab** ×2    | 1    | Pip     | Deal 4 damage. Draw 1 card. | Deal 5 damage. Draw 1 card. | `"THWIP!"`    |

**Starting deck total:** 8 cards. Functional but unexciting — every card reward is an improvement.

Note: Aldric's basic attack hits harder (6 + his +2 bonus = 8 effective). Pip's hits softer (4, no attack bonus) but replaces itself with a draw. This immediately establishes their identities.

---

### Aldric's Card Pool

Cards available as Aldric's offering during card rewards. Not all are available from the start — some are unlockables (marked with 🔒).

| Card                    | Cost | Effect                                   | Keywords | Upgraded Version                          | Speech Bubble             |
| ----------------------- | ---- | ---------------------------------------- | -------- | ----------------------------------------- | ------------------------- |
| **Heavy Strike**        | 2    | Deal 12 damage.                          | —        | Deal 16 damage.                           | `"WHAM!"`                 |
| **Forge Ahead**         | 1    | Deal 6 damage. Gain 3 Block.             | —        | Deal 8 damage. Gain 5 Block.              | `"COME ON!"`              |
| **Relentless Blow**     | 1    | Deal 5 damage. Charged 2.                | Charged  | Deal 7 damage. Charged 3.                 | `"AND AGAIN!"`            |
| **Iron Wall**           | 2    | Gain 12 Block.                           | Fortify  | Gain 15 Block. Fortify.                   | `"STAND FIRM!"`           |
| **Tremor**              | 2    | Deal 8 damage. Apply Weakness (2 turns). | —        | Deal 10 damage. Apply Weakness (2 turns). | `"THE GROUND SHAKES!"`    |
| 🔒 **Curtain of Iron**  | 3    | Gain Curtain 2 for this combat.          | Curtain  | Gain Curtain 3 for this combat.           | `"NOTHING GETS THROUGH."` |
| 🔒 **Standing Ovation** | 2    | All attacks deal +3 damage for 2 turns.  | —        | All attacks deal +4 damage for 3 turns.   | `"FEEL THE CROWD!"`       |
| 🔒 **Hammer Encore**    | 2    | Deal 10 damage. Encore.                  | Encore   | Deal 13 damage. Encore.                   | `"ONE MORE TIME!"`        |

---

### Pip's Card Pool

| Card                     | Cost | Effect                                                         | Keywords  | Upgraded Version                             | Speech Bubble             |
| ------------------------ | ---- | -------------------------------------------------------------- | --------- | -------------------------------------------- | ------------------------- |
| **Trick Shot**           | 1    | Deal 4 damage. Apply Weakness (1 turn).                        | —         | Deal 6 damage. Apply Weakness (2 turns).     | `"SURPRISE!"`             |
| **Smoke Bomb**           | 1    | Gain Ward 1. Draw 1 card.                                      | Ward      | Gain Ward 1. Draw 2 cards.                   | `"NOW YOU SEE ME..."`     |
| **Encore Performance**   | 1    | Deal 3 damage. Encore.                                         | Encore    | Deal 5 damage. Encore.                       | `"MISS ME?"`              |
| **Cunning Plan**         | 0    | Draw 2 cards.                                                  | —         | Draw 3 cards.                                | `"I HAVE AN IDEA!"`       |
| **Mockery**              | 1    | Apply Weakness (2 turns). Deal 2 damage.                       | —         | Apply Weakness (2 turns). Deal 4 damage.     | `"HA HA HA!"`             |
| 🔒 **Nimble Dodge**      | 1    | Gain Ward 2.                                                   | Ward      | Gain Ward 2. Gain 3 Block.                   | `"TOO SLOW!"`             |
| 🔒 **Rehearsed Routine** | 1    | This hero's next 3 cards cost 1 less energy.                   | Rehearsed | This hero's next 4 cards cost 1 less energy. | `"I'VE PRACTICED THIS."`  |
| 🔒 **Grand Finale**      | 3    | Deal damage equal to the number of cards played this turn × 4. | —         | Deal damage equal to cards played × 5.       | `"AND FOR MY FINAL ACT!"` |

---

### Neutral Card Pool

Available regardless of protagonist pairing. MacGuffin-themed — protecting the treasure.

| Card                       | Cost | Effect                                             | Keywords | Upgraded Version                                   | Speech Bubble      |
| -------------------------- | ---- | -------------------------------------------------- | -------- | -------------------------------------------------- | ------------------ |
| **Patch Up**               | 1    | Heal 5 MacGuffin HP.                               | —        | Heal 8 MacGuffin HP.                               | `"HOLD TOGETHER!"` |
| **Hunker Down**            | 1    | Gain 8 Block. Cannot play attack cards this turn.  | —        | Gain 12 Block. Cannot play attack cards this turn. | `"INCOMING!"`      |
| **Rally the Crowd**        | 2    | Gain Ovation 4.                                    | Ovation  | Gain Ovation 6.                                    | `"CHEER FOR US!"`  |
| **Second Wind**            | 1    | Gain 1 energy this turn. Draw 1 card.              | —        | Gain 1 energy this turn. Draw 2 cards.             | `"NOT DONE YET!"`  |
| 🔒 **Treasure's Blessing** | 1    | Gain 4 Block and heal 3 MacGuffin HP.              | —        | Gain 6 Block and heal 5 MacGuffin HP.              | `"IT GLOWS!"`      |
| 🔒 **Intermission**        | 2    | Remove all debuffs. Draw 1 card.                   | —        | Remove all debuffs. Draw 2 cards. Gain 3 Block.    | `"TAKE FIVE!"`     |
| 🔒 **Desperate Plea**      | 0    | Gain Block equal to missing MacGuffin HP (max 15). | —        | Gain Block equal to missing HP (max 20). Heal 2.   | `"PLEASE!"`        |

---

## Enemies

### Design Principles

- Each enemy has a clear gimmick hinted at before selection
- Intent is always telegraphed — no hidden behavior
- Act I enemies teach mechanics, Act II enemies test builds, Act III enemies punish weaknesses
- Bosses are multi-phase or have escalating patterns
- Enemy names fit the puppet theater aesthetic — they're characters in the show

---

### Act I — "The Opening"

Simple enemies that teach the player core mechanics.

#### Scene Enemies (Choose 1 of 2)

**Stage Rat**

- HP: 28
- Gimmick hint: _"A scrappy pest. Predictable."_
- Pattern (sequential): Attack 7 → Attack 7 → Attack 10 → repeat
- Speech bubbles: Attack: `"SQUEAK!"` / Hurt: `"EEK!"` / Defeated: `"...squeak."`
- Design intent: Pure damage, teaches blocking.

**Rusty Knight**

- HP: 35
- Gimmick hint: _"Slow but armored."_
- Pattern (sequential): Defend 5 → Attack 12 → Attack 8 → repeat
- Special: Starts with 5 Block each time it defends
- Speech bubbles: Attack: `"FOR... SOMETHING!"` / Defend: `"CLANK."` / Defeated: `"I RUST IN PEACE."`
- Design intent: Teaches that some turns are better for attacking (when enemy defends) and others for defending (when enemy winds up big hit).

**Moth Swarm**

- HP: 22
- Gimmick hint: _"Fragile but relentless."_
- Pattern (sequential): Attack 3 ×3 → Attack 3 ×3 → Attack 5 ×2 → repeat
- Speech bubbles: Attack: `"bzz bzz bzz"` / Hurt: `"SCATTER!"` / Defeated: `"poof"`
- Design intent: Multi-hit attacks teach Ward and Curtain value. Low total HP rewards aggression.

**Stagehand**

- HP: 30
- Gimmick hint: _"Helpful... to the wrong side."_
- Pattern (sequential): Buff self (gain 3 attack permanently) → Attack 5 → Attack 5 → repeat
- Speech bubbles: Attack: `"NOTHING PERSONAL."` / Buff: `"SETTING THE STAGE..."` / Defeated: `"I QUIT."`
- Design intent: Teaches urgency — if you let the Stagehand buff repeatedly, attacks snowball.

---

#### Act I Boss

**The Critic**

- HP: 55
- Gimmick hint: _"Judges your every move."_
- Phase 1 pattern: Attack 8 → Apply Weakness (2 turns) → Attack 10 → repeat
- Phase 2 (below 50% HP): Attack 12 → Apply Stage Fright to random hero (2 turns) → Attack 8 ×2 → repeat
- Special: When The Critic applies a debuff, they heal 5 HP. (Speech bubble: `"SCATHING."`)
- Speech bubbles: Attack: `"PATHETIC."` / Debuff: `"TWO STARS."` / Hurt: `"HMPH."` / Phase transition: `"LET ME GET SERIOUS."` / Defeated: `"...FINE. THREE STARS."`
- Design intent: First real test. Teaches debuff management and the value of burst damage to skip phase 2.

---

### Act II — "Rising Action"

Enemies with more complex patterns that test the player's build.

#### Scene Enemies (Choose 1 of 2)

**Phantom Understudy**

- HP: 40
- Gimmick hint: _"Copies your strengths against you."_
- Pattern (weighted): 40% Attack 10, 30% Heal 8, 30% Apply Forgetfulness (2 turns)
- Special: Attack value increases by 1 each turn.
- Speech bubbles: Attack: `"I LEARNED FROM YOU!"` / Heal: `"SECOND TAKE."` / Defeated: `"THE ROLE... WAS MINE..."`
- Design intent: Scaling pressure + healing forces the player to commit to offense.

**Prop Master**

- HP: 45
- Gimmick hint: _"Builds defenses over time."_
- Pattern (sequential): Defend 8 → Defend 5 + Attack 6 → Attack 10 → Heal 5 → repeat
- Special: Defense stacks persist across turns (unlike player Block).
- Speech bubbles: Attack: `"TAKE THIS PROP!"` / Defend: `"MORE SCENERY..."` / Defeated: `"MY PROPS!"`
- Design intent: Tests Piercing and Sweeping keywords. Patient players must chew through defenses. Rewards aggressive builds.

**Shadow Mimic**

- HP: 35
- Gimmick hint: _"Fragile, but retaliates."_
- Pattern (sequential): Attack 6 → Attack 6 → Attack 4 ×3 → repeat
- Special: Whenever Shadow Mimic takes damage, deals 2 damage to MacGuffin. (Telegraphed as passive ability, always visible.)
- Speech bubbles: Attack: `"RIGHT BACK AT YOU!"` / Retaliate: `"OUCH — BUT ALSO, OUCH."` / Defeated: `"OW OW OW."`
- Design intent: Punishes many small hits. Rewards fewer, larger attacks. Interesting tension with Charged keyword.

**Spotlight Phantom**

- HP: 38
- Gimmick hint: _"Hard to pin down."_
- Pattern (weighted): 40% Attack 9, 30% Attack 6 + Apply Heckled (1 turn), 30% Heal 6
- Special: Gains Ward 1 at the start of every turn.
- Speech bubbles: Attack: `"OVER HERE!"` / Ward: `"CAN'T TOUCH THIS."` / Defeated: `"THE LIGHT... FADES..."`
- Design intent: Auto-Ward makes the first hit each turn miss. Rewards multi-hit strategies or Sweeping.

---

#### Act II Boss

**The Director**

- HP: 75
- Gimmick hint: _"Orchestrates the stage against you."_
- Phase 1 pattern: Attack 10 → Apply Heckled to hero A (2 turns) → Attack 8 ×2 → Apply Stage Fright to hero B (2 turns) → repeat
- Phase 2 (below 50% HP): Attack 14 → Apply Forgetfulness (2 turns) → Heal 10 → Attack 10 ×2 → repeat
- Special: On phase transition, fully clears own debuffs and gains 10 Block. (Speech bubble: `"FROM THE TOP!"`)
- Speech bubbles: Attack: `"AS I DIRECTED!"` / Debuff: `"YOU — OFF SCRIPT."` / Hurt: `"THAT WASN'T IN THE SCRIPT."` / Phase transition: `"REWRITE!"` / Defeated: `"THE SHOW... GOES ON... WITHOUT ME."`
- Design intent: Heavy debuff pressure tests the player's ability to function under constraints. Phase 2 healing means the player can't just turtle.

---

### Act III — "The Climax"

Aggressive enemies that punish weaknesses and demand synergy.

#### Scene Enemies (Choose 1 of 2)

**Prima Donna**

- HP: 50
- Gimmick hint: _"Demands attention. Punishes neglect."_
- Pattern (sequential): Buff self (+5 attack) → Attack current_attack → Attack current_attack → Attack current_attack ×2 → repeat
- Special: Base attack starts at 6. Stacks indefinitely. Must be killed fast.
- Speech bubbles: Attack: `"ALL EYES ON ME!"` / Buff: `"I DESERVE MORE."` / Defeated: `"THIS ISN'T OVER! I'LL HAVE MY— *curtain drops*"`
- Design intent: A DPS check. Pure race — can your build output enough damage before the scaling overwhelms you?

**Mask of Comedy / Mask of Tragedy**

- HP: 55
- Gimmick hint: _"Two faces. Alternating moods."_
- Comedy turns: Attack 5 + Heal 8
- Tragedy turns: Attack 14 + Apply Weakness (1 turn)
- Pattern: Alternates Comedy → Tragedy → Comedy → Tragedy
- Special: On Comedy turns, takes 50% reduced damage. On Tragedy turns, takes normal damage.
- Speech bubbles: Comedy: `"HA HA HA!"` / Tragedy: `"WAAAAH!"` / Defeated: `"*both masks crack*"`
- Design intent: Rhythm puzzle. Big damage should be timed for Tragedy turns. Defensive play on Comedy turns.

**Puppeteer's Hand**

- HP: 45
- Gimmick hint: _"Controls from above."_
- Pattern (sequential): Apply Stage Fright to random hero (2 turns) → Attack 8 → Apply Heckled to other hero (2 turns) → Attack 12 → repeat
- Special: While any debuff is active on a hero, Puppeteer's Hand gains +3 attack.
- Speech bubbles: Attack: `"DANCE FOR ME."` / Debuff: `"YOUR STRINGS ARE MINE."` / Defeated: `"NO... I WAS IN CONTROL..."`
- Design intent: Constant debuff pressure that also powers up attacks. Rewards Intermission card and debuff removal. Tests adaptability.

**Fallen Curtain**

- HP: 55
- Gimmick hint: _"Absorbs damage. Retaliates in bursts."_
- Pattern (sequential): Defend 10 → Defend 10 → Attack (damage = total block accumulated) → repeat
- Special: Stores all unbroken defense and unleashes it as a massive attack every 3rd turn. Block resets after the attack.
- Speech bubbles: Defend: `"WALLING OFF..."` / Attack: `"RELEASE!"` / Defeated: `"*tears apart*"`
- Design intent: Unique timing puzzle. Player must either Pierce through the defense to prevent accumulation, or stack massive Block/Ward for the burst turn.

---

#### Act III Boss — Final Boss

**The Playwright**

- HP: 100
- Gimmick hint: _"Wrote every word. Controls the narrative."_

**Phase 1 — "Act One" (100-66 HP):**

- Pattern: Attack 10 → Apply Weakness (2 turns) → Attack 8 ×2 → Heal 8 → repeat
- The Playwright is writing the story. Manageable but tests resources.

**Phase 2 — "Plot Twist" (66-33 HP):**

- Transition: `"ENOUGH IMPROVISATION."` Gains 15 Block. Clears all own debuffs.
- Pattern: Attack 14 → Apply Stage Fright to both heroes (2 turns) → Attack 10 ×2 → Apply Forgetfulness (2 turns) → repeat
- The Playwright takes control. Heavy debuffs demand the player's best cards and sequencing.

**Phase 3 — "The Final Page" (below 33 HP):**

- Transition: `"THIS STORY ENDS NOW."` Gains Curtain 2 for the rest of the fight.
- Pattern: Attack 18 → Attack 12 ×2 → Heal 12 → Apply Heckled to both heroes (2 turns) → repeat
- All-out assault with self-sustain. The Curtain 2 means chip damage is nearly useless. Player needs their biggest combos.

**Speech bubbles:**

- Attack: `"AS I WROTE IT."` `"THIS WAS ALWAYS THE ENDING."`
- Debuff: `"YOU FORGOT YOUR LINES."`
- Heal: `"LET ME REVISE."`
- Hurt (phase 1): `"AN UNEXPECTED DEVELOPMENT."`
- Hurt (phase 3): `"NO. THIS ISN'T HOW IT ENDS."`
- Defeated: `"...PERHAPS... YOUR STORY... WAS BETTER."`

**Design intent:** A three-phase endurance fight that tests everything — damage output, debuff management, defensive timing, and resource conservation. Each phase demands different priorities. The healing in phases 1 and 3 prevents pure turtle strategies. Curtain 2 in phase 3 rewards builds that invested in big single hits over chip damage. The fight should feel like the climax of a show.

---

## Unlock Progression

### Starting Content (Available Immediately)

**Protagonists:** Aldric, Pip

**Cards available in reward pools:**

- Aldric: Hammer Swing, Heavy Strike, Forge Ahead, Relentless Blow, Iron Wall, Tremor
- Pip: Quick Jab, Trick Shot, Smoke Bomb, Encore Performance, Cunning Plan, Mockery
- Neutral: Basic Block, Patch Up, Hunker Down, Rally the Crowd, Second Wind

### Unlock Tier 1 — Clear Act I

- 🔒 Aldric: Curtain of Iron
- 🔒 Pip: Nimble Dodge
- 🔒 Neutral: Treasure's Blessing

### Unlock Tier 2 — Win a Full Run

- 🔒 Aldric: Standing Ovation, Hammer Encore
- 🔒 Pip: Rehearsed Routine, Grand Finale
- 🔒 Neutral: Intermission, Desperate Plea

### Future Unlocks

Additional protagonists and their card pools would form later unlock tiers, gated behind achievements like winning with specific pairings or completing challenge conditions.

---

## Balance Notes & Design Rationale

**Aldric's identity:** Big numbers, straightforward plans. Charged rewards going all-in on Aldric attacks in a turn. His cards are expensive but impactful. An Aldric-heavy deck wants to set up one explosive turn per combat cycle. Aldric players should feel like they're swinging a wrecking ball.

**Pip's identity:** Cheap, tricky, card-flow-oriented. Encore rewards careful turn sequencing. Pip's attacks are weaker individually but Pip generates more card draw and applies debuffs. A Pip-heavy deck wants to play many cards per turn and control the enemy's effectiveness. Pip players should feel clever and slippery.

**Together:** The pairing creates natural tension — Charged wants consecutive Aldric attacks, but Pip cards are cheap and you want to play them for draw/debuff. The interesting turns are the ones where you decide: do I go full Aldric for the Charged ramp, or mix in Pip for card advantage and control? Neither answer is always correct, which is the hallmark of good deckbuilder design.

**Neutral cards as safety net:** Healing, debuff removal, and emergency defense are mostly in the neutral pool. This means every pairing has access to survival tools, but investing in neutrals means fewer synergy cards. Another meaningful tradeoff.

**Enemy scaling:** Act I enemies have 22-35 HP and simple patterns. Act II enemies have 35-45 HP with one gimmick each. Act III enemies have 45-55 HP with dangerous gimmicks. Bosses are 55 / 75 / 100 HP respectively. This progression should track with the player's growing deck power.

**Numbers to watch during playtesting:**

- MacGuffin starting HP (60) — is this enough to survive 9 encounters with no between-fight healing?
- Basic Block value (5) — does this feel meaningful against Act I damage but insufficient by Act III?
- Card reward pacing — does 1 card per scene give enough build diversity?
- Boss upgrade reward — is 1 upgrade per boss impactful enough to feel exciting?
- Charged scaling — does +2/+3 per consecutive hit create degenerate one-shot combos?
