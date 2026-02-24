# Curtain Call — Keywords Reference v2

*Implementation reference for all keywords, damage resolution, and status effects.*

---

## Damage Resolution Order

When an enemy attack hits an ally (MacGuffin or protagonist):

1. **Taunt** — Redirect hit to taunting protagonist. Decrement Taunt by 1.
2. **Distract** — If target has Distract, negate entire hit. Decrement Distract by 1. **Stop here.**
3. **Shield** — Protagonist-specific. Reduce remaining damage; Shield reduced by amount absorbed.
4. **Block** — Global pool. Reduce remaining damage; Block reduced by amount absorbed.
5. **Retaliate** — Deal Retaliate amount back to attacker.

Each hit in a multi-hit attack resolves independently through this full sequence.

**Principle:** Personal defense (Shield) before communal defense (Block).

---

## Positive Keywords

### Block
- **Trigger:** Take hit
- **Target:** Global pool (shared by all allies)
- **Effect:** Reduce incoming damage by up to Block amount. Block is reduced by the damage it absorbs.
- **Persistence:** Removed at start of player turn.
- **Notes:** Resolves after Shield in the damage sequence. Shared across all targets.

### Distract
- **Trigger:** Take hit
- **Target:** Global pool
- **Effect:** Negate ALL damage from a single hit, regardless of hit size. Decrement Distract by 1.
- **Persistence:** Removed at start of player turn.
- **Notes:** Strong against multi-hit (absorbs one entire hit per stack). Countered by Accuracy (bypasses it) and Confused (50% chance to not trigger).

### Taunt
- **Trigger:** Take hit (on any ally)
- **Target:** Specific protagonist
- **Effect:** Redirect the hit to this protagonist instead of its original target. Decrement Taunt by 1.
- **Persistence:** Removed at start of player turn.
- **Notes:** Causes the protagonist to take damage from their own HP pool. Core mechanic for protecting the MacGuffin. Countered by Accuracy.

### Shield
- **Trigger:** Take hit (on this protagonist)
- **Target:** Specific protagonist
- **Effect:** Reduce incoming damage to this protagonist by Shield amount. Shield is reduced by damage absorbed.
- **Persistence:** Removed at start of player turn.
- **Notes:** Only protects the protagonist it's applied to. Resolves before Block. Only relevant when the protagonist is being hit (via Taunt, AoE, or self-damage).

### Regenerate
- **Trigger:** Start of turn
- **Target:** Specific protagonist or enemy
- **Effect:** Heal by Regenerate amount. Reduce Regenerate by 1.
- **Persistence:** Decays by 1 each turn (natural decay).
- **Notes:** Regenerate 3 heals for 3, then 2, then 1 = 6 total over 3 turns. Reduced by Poison (Poison reduces healing received).

### Retaliate
- **Trigger:** Take hit
- **Target:** Global pool
- **Effect:** After damage resolves, deal Retaliate amount back to the attacker.
- **Persistence:** Removed at start of player turn.
- **Notes:** Fires after the full damage sequence. Countered by Accuracy (attacks with Accuracy don't trigger Retaliate). Countered by Confused (50% chance to not trigger).

### Inspire
- **Trigger:** Passive (always active)
- **Target:** Global pool (affects all attacks)
- **Effect:** All attacks deal +1 bonus damage per Inspire stack.
- **Persistence:** **Permanent.** Does not decay. Stacks additively across multiple applications.
- **Notes:** Long-term investment. Playing Inspire early pays off across the entire fight. The basic Inspire card gives 2 stacks.

### Fortify
- **Trigger:** Gain Block
- **Target:** Global pool or enemy
- **Effect:** Whenever Block is gained, gain 1 additional Block per Fortify stack.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Multiplicative with Block cards. Fortify 3 + a 5 Block card = 8 Block.

### Piercing
- **Trigger:** Attack
- **Target:** Specific protagonist or enemy
- **Effect:** Attacks bypass Block and Shield entirely.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Does NOT bypass Taunt or Distract. Complementary to Accuracy (which bypasses Taunt/Distract).

### Accuracy
- **Trigger:** Attack
- **Target:** Specific protagonist or enemy
- **Effect:** Attacks bypass Taunt and Distract. Attacks don't trigger Retaliate.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Does NOT bypass Block or Shield. Complementary to Piercing (which bypasses Block/Shield).

### Ward
- **Trigger:** Receive a debuff
- **Target:** Global pool
- **Effect:** Negate the incoming debuff entirely. Remove 1 Ward.
- **Persistence:** **Permanent** (until consumed).
- **Notes:** Purely anti-debuff. Does NOT interact with damage at all. Each Ward stack negates one debuff application.

### Luck
- **Trigger:** Attack
- **Target:** Global pool
- **Effect:** 10% chance per Luck stack to deal 1.5× damage on an attack.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** **Player-only by design.** Enemies should never have Luck. At 10 stacks, it's functionally guaranteed. Pip's signature keyword. The one intentional exception to the "predictability over surprise" principle — opt-in excitement.

### Flourish
- **Trigger:** Passive (always active)
- **Target:** Global pool
- **Effect:** Double all Ovation gains AND losses.
- **Persistence:** Removed at start of turn.
- **Notes:** High risk/high reward. Doubles gains from hitting enemies but also doubles losses from taking unblocked damage and from decay.

---

## Negative Keywords (Debuffs)

### Poison
- **Trigger:** Start of turn
- **Target:** Any ally or enemy
- **Effect:** Take 1 damage per Poison stack. Reduce Poison by 1. **Additionally, healing received is reduced by Poison amount.**
- **Persistence:** Decays by 1 each turn (natural decay).
- **Notes:** Unique identity vs Burn: Poison shuts down healing. Against healing-heavy enemies (Critic, Director, Playwright), Poison is the strategic counter. Burn is pure damage. Poison 5 = 5+4+3+2+1 = 15 damage AND healing suppression over 5 turns.

### Burn
- **Trigger:** Start of turn
- **Target:** Any ally or enemy
- **Effect:** Take 1 damage per Burn stack. Reduce Burn by 1.
- **Persistence:** Decays by 1 each turn (natural decay).
- **Notes:** Pure damage over time. Burn 5 = 5+4+3+2+1 = 15 damage over 5 turns. Does not affect healing. Simpler and more aggressive than Poison.

### Stage Fright
- **Trigger:** Passive
- **Target:** Specific protagonist or enemy
- **Effect:** Cannot make attacks.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Extremely harsh. On a protagonist, locks out all Attack-type cards from that hero. On an enemy, prevents their attack actions. Can be produced by Fear reaching 5 stacks.

### Heckled
- **Trigger:** Passive
- **Target:** Specific protagonist or enemy
- **Effect:** Cannot perform actions other than attacks.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Extremely harsh. On a protagonist, locks out all Defense and Action cards from that hero. On an enemy, prevents healing, buffing, debuffing — only attacks get through. Can be produced by Frustration reaching 5 stacks.

### Forgetful
- **Trigger:** Passive
- **Target:** Specific protagonist or enemy
- **Effect:** 50% decreased damage dealt.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Harsh modifier. Creates urgency for the affected party to wait it out or for the player to capitalize on the enemy's weakened state.

### Vulnerable
- **Trigger:** Passive
- **Target:** Any ally or enemy
- **Effect:** 50% increased damage taken.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Offensive multiplier. Best used in combination with high-damage attacks during the Vulnerable window.

### Weak
- **Trigger:** Gain Block or Shield
- **Target:** Global pool or enemy
- **Effect:** 50% reduced Block or Shield granted.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Anti-defense debuff. Most effective against enemies that stack defensive keywords (Prop Master, Fallen Curtain).

### Confused
- **Trigger:** Distract, Taunt, or Retaliate triggers
- **Target:** Global pool or enemy
- **Effect:** 50% chance that Distract, Taunt, or Retaliate doesn't activate when it normally would.
- **Persistence:** Reduce by 1 at start of turn.
- **Notes:** Counters binary defense abilities. Amount-based defenses (Block, Shield) have amount-based counters (Weak, Piercing). Binary defenses (Distract, Taunt, Retaliate) have probability-based counter (Confused). Player-only RNG concern — accept this or adjust during playtesting.

### Curse
- **Trigger:** End of turn
- **Target:** Any ally or enemy
- **Effect:** Deal Curse damage. Damage is reduced by Shield then Block (follows normal damage resolution). Consumed after triggering.
- **Persistence:** One-shot — consumed on effect.
- **Notes:** Delayed burst damage. Can be mitigated by defense, unlike Poison/Burn which bypass defenses.

### Fear
- **Trigger:** Reaches 5 stacks
- **Target:** Specific protagonist or enemy
- **Effect:** Converts to Stage Fright (1 turn duration). Fear resets to 0.
- **Persistence:** **Permanent.** Never decays on its own. Only removed by conversion at 5 or by Ward.
- **Notes:** Slow-build pressure keyword. Requires multiple card plays across turns to trigger. After conversion, additional Fear applications start building from 0 again.

### Frustration
- **Trigger:** Reaches 5 stacks
- **Target:** Specific protagonist or enemy
- **Effect:** Converts to Heckled (1 turn duration). Frustration resets to 0.
- **Persistence:** **Permanent.** Never decays on its own. Only removed by conversion at 5 or by Ward.
- **Notes:** Pip's signature pressure mechanic. Pairs with Annoying Poke, Vex, and Ultimate Jeer. Same slow-build design as Fear.

---

## Keyword Interaction Matrix

| Offensive Keyword | Counters |
|-------------------|----------|
| Piercing | Bypasses Block, Shield |
| Accuracy | Bypasses Taunt, Distract; ignores Retaliate |
| Poison | Suppresses healing; damage over time |
| Burn | Pure damage over time |
| Vulnerable | Amplifies all incoming damage |
| Weak | Reduces Block/Shield generation |
| Confused | Disrupts Taunt/Distract/Retaliate |

| Defensive Keyword | Countered By |
|--------------------|-------------|
| Block | Piercing, Weak |
| Shield | Piercing, Weak |
| Taunt | Accuracy, Confused |
| Distract | Accuracy, Confused |
| Retaliate | Accuracy, Confused |
| Ward | (No direct counter — consumed by debuff application) |
| Regenerate | Poison (reduces healing received) |
