# Curtain Call — Ruleset v2

*Updated: February 7, 2026. Captures all changes agreed upon during the card/keyword overhaul session.*

---

## Overview

Curtain Call is a deck-building roguelike framed as a shadow puppet theater performance. The player selects two Protagonists who defend a shared MacGuffin (a treasure) against shadow villains across three acts. The entire game is a live show — the audience reacts, puppets are on sticks, speech bubbles deliver combat feedback, and curtains close between scenes.

---

## Run Structure

```
ACT I — "The Opening"
  Scene 1: Choose 1 of 2 enemies → Combat → Card reward (pick 1 of 3)
  Scene 2: Choose 1 of 2 enemies → Combat → Card reward (pick 1 of 3)
  Boss: The Critic → Combat → Upgrade reward (upgrade 1 existing card)

ACT II — "Rising Action"
  Scene 1: Choose 1 of 2 enemies → Combat → Card reward
  Scene 2: Choose 1 of 2 enemies → Combat → Card reward
  Boss: The Director → Combat → Upgrade reward

ACT III — "The Climax"
  Scene 1: Choose 1 of 2 enemies → Combat → Card reward
  Scene 2: Choose 1 of 2 enemies → Combat → Card reward
  Final Boss: The Playwright → Combat → Victory
```

- 9 total encounters per run (6 scenes + 3 bosses).
- Card rewards offer 1 from Protagonist A's pool, 1 from Protagonist B's pool, 1 neutral. Player picks exactly 1 (no skip).
- Boss rewards let the player upgrade one card in their deck.

---

## Health Pools

### MacGuffin (Shared Run HP)

- Starting HP: 40–50 (exact value TBD during enemy balancing)
- All standard enemy attacks target the MacGuffin.
- **Cannot be healed.** MacGuffin HP is a non-renewable resource across the entire run.
- MacGuffin at 0 HP = run over.

### Protagonist HP (Per-Combat Resource)

- **Aldric:** 20 HP
- **Pip:** 10 HP
- Protagonist HP **fully resets** after each combat encounter.
- Protagonists take damage from: Taunt (redirected attacks), Poison, Burn, and potentially AoE enemy attacks (TBD).
- **Knockout:** When a protagonist reaches 0 HP, the player can no longer play that protagonist's cards for the remainder of the current combat.
- Protagonists can be healed during combat. Since their HP resets between fights, healing is only valuable for absorbing more damage in the current encounter.

### Design Rationale

The two-tier HP system creates a clean resource hierarchy. Protagonist HP is renewable and can be spent freely via Taunt to shield the MacGuffin. MacGuffin HP is permanent and irreplaceable. Every Taunt decision becomes: "spend renewable HP now to preserve irreplaceable HP." Protagonist healing avoids the degenerate "stall and heal to full" pattern because the MacGuffin can never be healed — there's no incentive to prolong fights.

---

## Combat System

### Turn Flow

```
PLAYER TURN
  1. Refresh energy to 3
  2. Draw 5 cards
  3. Ovation decays by 1
  4. Tick down status effect durations (reduce by 1 where applicable)
  5. Player plays cards (costs energy)
  6. Player clicks End Turn

ENEMY TURN
  7. Enemy executes telegraphed action
  8. Block resets to 0, Shield resets to 0, Distract resets to 0
  9. Discard remaining hand
  10. Enemy reveals next turn's intent
  11. Check win/lose conditions
```

### Energy

- 3 energy per turn, refreshes fully (unspent does not carry over).
- Card costs range 0–3. Most cards cost 1–2.

### Enemy Intent

Enemies always telegraph their next action. Displayed as icon + number above the enemy. The player always knows what's coming. This is non-negotiable — the challenge comes from limited energy and cards to respond optimally, not from hidden information.

Intent types: Attack (⚔️), Multi-attack (⚔️⚔️), Defend (🛡️), Buff Self (💪), Debuff (💀), Heal (💛).

---

## Damage Resolution Order

When an enemy attack targets an ally (MacGuffin or protagonist), damage is resolved in this order:

1. **Taunt** — If a protagonist has Taunt, the hit is redirected to that protagonist. Taunt decrements by 1.
2. **Distract** — If the target has Distract, the entire hit is negated. Distract decrements by 1. Resolution stops here for this hit.
3. **Shield** — Protagonist-specific. Reduces remaining damage. (Personal defense consumed before shared defense.)
4. **Block** — Global pool. Reduces remaining damage after Shield.
5. **Retaliate** — After damage resolves, deal Retaliate amount back to the attacker.

**Principle:** Personal defense (Shield) is consumed before communal defense (Block). This preserves the shared Block pool for protecting other targets.

For multi-hit attacks, each individual hit goes through this full sequence independently.

### Damage Preview System

A persistent damage forecast is displayed during the player's turn, updated in real time as cards are played.

- At turn start, each target shows the total incoming damage from the enemy's telegraphed intent (e.g., `▼10` in red above the MacGuffin).
- As the player plays defense cards, the numbers update: Block reduces the MacGuffin's number, Taunt moves damage from MacGuffin to protagonist, Shield reduces protagonist numbers, etc.
- When a target's forecast reaches 0, the red number is replaced with a green indicator (checkmark or shield icon) — signaling that target is fully covered.
- Multi-hit attacks show the total post-mitigation damage, not per-hit breakdown.
- The preview runs a simulation of enemy turn resolution using current defensive state without actually applying it.

---

## Ovation (Crowd Meter)

Ovation is a momentum meter tracking how well the performance is going. It represents the audience's engagement with the show.

### Core Rules

- **Range:** 0–5 (fixed max, does not scale per act)
- **Gain:** +1 per hit dealt to an enemy (each individual hit, not each card)
- **Decay:** −1 at the start of each player turn
- **Loss:** −1 on unblocked damage taken (damage that actually hits the MacGuffin after Block is applied)
- **Resets between encounters:** Each fight starts at 0. The crowd needs to be won over fresh.

### Milestone Bonuses (Damage Only)

| Ovation | Bonus |
|---------|-------|
| 0–1 | No bonus |
| 2–4 | +1 damage on all attacks |
| 5 | +2 damage on all attacks |

This is a universal bonus that applies to all attack cards regardless of protagonist.

### Design Principles

- **One bonus type, fully predictable.** The player always knows exactly what Ovation does.
- **Universal across all protagonists.** Per-protagonist Ovation flavor comes from *cards* that interact with it, not from the base mechanic.
- **Swarm decks build it fast, big-hit decks build it slow.** A deck full of cheap 1-cost attacks gains 4–5 Ovation per turn. A deck with two 2-cost attacks gains 2.
- **Decay prevents "solve once and forget."** Sustaining Ovation is an ongoing performance, not a bar you fill once.
- **Visual payoff is separate from mechanical payoff.** The audience reacts visually to Ovation level. This is flair. The mechanic is just the damage number.

---

## Keywords

### Card Description Language Conventions

- **"Gain"** — Apply a positive keyword or resource to yourself or an ally. (e.g., "Gain 5 Block", "Gain 2 Shield")
- **"Inflict"** — Apply a negative keyword or debuff to an enemy. (e.g., "Inflict 2 Poison", "Inflict 1 Frustrated")
- **"Deal"** — Damage to an enemy. (e.g., "Deal 8 damage")
- **"Draw"** — Cards from the deck. (e.g., "Draw 1 card")

Keywords are always capitalized in card text (Block, Shield, Taunt, Poison, etc.).

### Positive Keywords

| Keyword | Trigger | Target | Effect | Persistence |
|---------|---------|--------|--------|-------------|
| **Block** | Take hit | Global pool | Reduce damage by up to Block amount; Block reduced by damage absorbed | Removed at start of turn |
| **Distract** | Take hit | Global pool | Negate all damage from a single hit; Distract reduced by 1 | Removed at start of turn |
| **Taunt** | Take hit | Protagonist | Redirect hit to this protagonist; Taunt reduced by 1 | Removed at start of turn |
| **Regenerate** | Start of turn | Protagonist or Enemy | Heal by Regenerate amount; reduce Regenerate by 1 | Decays naturally |
| **Retaliate** | Take hit | Global pool | Deal Retaliate amount back to attacker after damage resolves | Removed at start of turn |
| **Shield** | Take hit | Protagonist | Reduce damage to this protagonist by Shield amount; Shield reduced by damage absorbed | Removed at start of turn |
| **Inspire** | Passive | Global pool | Gain +1 damage per Inspire on all attacks | **Permanent** (does not decay) |
| **Fortify** | Gain Block | Global pool | Gain 1 extra Block per Fortify | Reduce by 1 at start of turn |
| **Piercing** | Attack | Protagonist or Enemy | Attacks bypass Block and Shield | Reduce by 1 at start of turn |
| **Accuracy** | Attack | Protagonist or Enemy | Attacks bypass Taunt and Distract and don't trigger Retaliate | Reduce by 1 at start of turn |
| **Ward** | Receive debuff | Global pool | Negate the debuff; remove 1 Ward | **Permanent** (until consumed) |
| **Luck** | Attack | Global pool | 10% chance per Luck to deal 1.5× damage | Reduce by 1 at start of turn |
| **Flourish** | Passive | Global pool | Double all Ovation gains and losses | Removed at start of turn |

**Notes:**
- Inspire is a long-term investment that rewards planning across multiple turns.
- Ward is purely anti-debuff. It does not interact with damage at all.
- Luck is player-only by design. Enemies should never use Luck.
- Piercing bypasses Block and Shield. Accuracy bypasses Taunt and Distract. These are complementary, not overlapping.

### Negative Keywords (Debuffs)

| Keyword | Trigger | Target | Effect | Persistence |
|---------|---------|--------|--------|-------------|
| **Poison** | Start of turn | Any ally or enemy | Take 1 damage per Poison; reduce Poison by 1. **Healing received is reduced by Poison amount.** | Decays naturally |
| **Burn** | Start of turn | Any ally or enemy | Take 1 damage per Burn; reduce Burn by 1 | Decays naturally |
| **Stage Fright** | Passive | Protagonist or Enemy | Cannot make attacks | Reduce by 1 at start of turn |
| **Heckled** | Passive | Protagonist or Enemy | Cannot do actions other than attack | Reduce by 1 at start of turn |
| **Forgetful** | Passive | Protagonist or Enemy | 50% decreased damage dealt | Reduce by 1 at start of turn |
| **Vulnerable** | Passive | Any ally or enemy | 50% increased damage taken | Reduce by 1 at start of turn |
| **Weak** | Passive | Global pool or Enemy | 50% reduced Block or Shield granted | Reduce by 1 at start of turn |
| **Confused** | Passive | Global pool or Enemy | 50% chance Distract, Taunt, or Retaliate doesn't trigger | Reduce by 1 at start of turn |
| **Curse** | End of turn | Any ally or enemy | Deal Curse damage, reduced by Shield then Block | Consumed on effect |
| **Fear** | Reaches 5 | Protagonist or Enemy | Converts to Stage Fright. Fear resets to 0. | **Permanent** (never decays until converted) |
| **Frustration** | Reaches 5 | Protagonist or Enemy | Converts to Heckled. Frustration resets to 0. | **Permanent** (never decays until converted) |

**Notes:**
- Poison's anti-healing effect gives it a unique identity vs Burn. Burn is pure damage over time. Poison is damage over time that also shuts down healing-heavy enemies.
- Fear and Frustration are permanent slow-build pressure. They reset to 0 once they convert at 5 stacks. The converted Stage Fright / Heckled lasts its normal duration (typically 1 turn, removed at start of next turn).
- 50% modifiers (Forgetful, Vulnerable, Weak) are deliberately harsh — the player should feel urgency to end the fight or wait out the duration.
- Not stackable in duration — reapplying refreshes duration.

---

## Protagonists

### Aldric, the Ironclad

- **HP:** 20
- **Silhouette:** Tall, upright, symmetrical. Full plate armor, plumed helmet, large shield. Rigid posture.
- **Role:** Defense, support, and disruption. Block, Shield, Taunt, Stagger, healing, cleansing. Protects the MacGuffin and sustains the team.
- **Keyword affinity:** Fortify, Taunt, Shield, Regenerate, Inspire.
- **Personality:** Noble, earnest, takes the mission seriously. Short formal declarations.
- **Card design edge:** Riveted iron battlements (castle-top scallop).
- **Speech style:** `"HOLD THE LINE."` `"FOR HONOR."` `"I SWORE AN OATH."`

### Pip, the Trickster

- **HP:** 10
- **Silhouette:** Small, asymmetric, hunched. Oversized wizard hat, flowing scarf, mischievous lean.
- **Role:** Debuff application, damage scaling, and evasion. Cheap attacks that scale off debuff count, Frustration/Fear pressure, Poison/Burn, Taunt/Distract for evasive defense.
- **Keyword affinity:** Luck, Frustration, Fear, Poison, Burn, Distract, Ovation interaction.
- **Personality:** Cheeky, irreverent, treats combat as performance. Secretly relies on Aldric.
- **Card design edge:** Torn paper wizard hat points.
- **Speech style:** `"THWIP!"` `"TOO SLOW!"` `"EASY. BARELY AN INCONVENIENCE."`

### Together

The tank-and-trickster duo creates energy tension every turn. Aldric's defensive and support cards are essential but expensive. Pip's damage and debuff cards are cheap but only effective if you invest in setup. The answer changes every turn based on enemy intent.

---

## Starting Deck (10 cards)

At the start of a run, the player:
1. Chooses two protagonists (currently Aldric and Pip).
2. Chooses one Basic card for each protagonist from that protagonist's Basic options.
3. Receives a starting deck of 10 cards: 3 copies of each chosen protagonist Basic + 3 Block + 1 Inspire.

### Protagonist Basic Options

**Aldric:**
| Card | Cost | Type | Effect |
|------|------|------|--------|
| Galvanize | 1 | Attack | Deal 3 damage. Heal each protagonist by 1 |
| Bulwark | 2 | Attack | Deal 5 damage. Reduce the cost of Defense cards in hand by 1 |

**Pip:**
| Card | Cost | Type | Effect |
|------|------|------|--------|
| Quick Jab | 1 | Attack | Deal 2 damage + 2 damage per unique debuff type on enemy |
| Lucky Shot | 1 | Attack | Deal 3 damage. Gain 1 Luck |

### MacGuffin Cards (always included)

| Card | Copies | Cost | Type | Effect |
|------|--------|------|------|--------|
| Block | 3 | 1 | Defense | Gain 3 Block |
| Inspire | 1 | 1 | Action | Gain 2 Inspire |

### Starting Deck Composition

10 cards = exactly 2 full hands (5 cards drawn per turn). The player sees every card in their deck across the first 2 turns, eliminating early draw variance and ensuring immediate familiarity with their toolkit.

**Example deck (Galvanize + Quick Jab):** Galvanize ×3, Quick Jab ×3, Block ×3, Inspire ×1.

MacGuffin cards are intentionally weak basics designed to be replaced through card rewards. The protagonist Basic choice defines initial synergy direction — Quick Jab builds toward debuff scaling, Lucky Shot toward Luck stacking, Galvanize toward sustain, Bulwark toward defense enablement.

---

## Design Principles

- **Predictability over surprise.** The player should always know exactly what their actions will produce. No hidden bonuses, no surprise triggers. Enemy intent is visible. Ovation milestones are fixed. Keyword effects are deterministic. *(Exception: Luck is player-only RNG that creates opt-in excitement without feel-bad moments.)*

- **Meaningful choices over optimal paths.** Every turn should present a genuine decision between defense and offense, between heroes, between short-term and long-term investment. If one play is always correct, the design has failed.

- **Theater metaphor should enhance, not constrain.** Keywords and mechanics should feel thematically natural (Encore, Ovation, Curtain Call) without forcing awkward names. If the theater name doesn't immediately communicate the mechanic, use a clearer name.

- **Harsh debuffs create urgency.** 50% modifiers are correct — the player should feel Forgetful and want it gone. 25% is invisible at these damage numbers.

- **Ovation is universal, card interactions are specific.** The crowd meter does one simple thing for everyone. Per-protagonist Ovation synergies live in the cards, not the base mechanic.

- **Energy tension is the core loop.** 3 energy per turn, two heroes competing for it. This is where every interesting decision lives.

- **One mechanic, one job.** Block absorbs total damage (global pool). Shield absorbs total damage (protagonist-specific). Distract absorbs hit count. Taunt redirects hits. Retaliate returns damage. Each does something no other mechanic does. No redundancy.

- **Personal defense before communal defense.** Shield resolves before Block. Spend the protagonist's own resources before dipping into the shared pool.
