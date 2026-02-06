# Curtain Call — SVG Asset Requirements

This document tracks all SVG assets needed for Curtain Call. Placeholder versions exist for development; this serves as a spec for creating production-quality artwork.

## Current Placeholder Status

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Bron | `/static/svg/bron.svg` | Placeholder | Needs proper silhouette |
| Pip | `/static/svg/pip.svg` | Placeholder | Needs proper silhouette |
| Enemy (generic) | `/static/svg/enemy-placeholder.svg` | Placeholder | Base enemy shape |
| MacGuffin | `/static/svg/macguffin.svg` | Placeholder | Treasure chest shape |
| Audience | `/static/svg/audience.svg` | Placeholder | Row of head silhouettes |
| Intent: Attack | `/static/svg/intent-attack.svg` | Complete | Sword icon |
| Intent: Block | `/static/svg/intent-block.svg` | Complete | Shield icon |
| Intent: Heal | `/static/svg/intent-heal.svg` | Complete | Heart icon |
| Intent: Buff | `/static/svg/intent-buff.svg` | Complete | Up arrow icon |
| Intent: Debuff | `/static/svg/intent-debuff.svg` | Complete | Skull icon |

---

## Protagonist Silhouettes

### Bron, the Ironclad

**File:** `/static/svg/bron.svg`
**ViewBox:** `0 0 200 320` (body 200×250, stick extends 70px below)

**Design Requirements:**
- Stocky, broad-shouldered figure
- Large hammer weapon (held or resting on shoulder)
- Round head, short sturdy legs
- Cute and sturdy, not intimidating
- Clear puppet stick extending from bottom center

**Expression Cutouts (separate elements for animation):**
- Eyes: Two small oval/round cutouts
- Mouth: Curved line cutout
- States needed: neutral, happy, hurt, angry

**Color:**
- Main body: `#1A1A2E` (near-black silhouette)
- Puppet stick: `#3D2B1F` (dark wood brown)
- Eye/mouth cutouts: transparent (backlight shows through)

---

### Pip, the Nimble

**File:** `/static/svg/pip.svg`
**ViewBox:** `0 0 200 320`

**Design Requirements:**
- Small, wiry figure
- Oversized pointy wizard/jester hat
- Trailing scarf or cape element
- Dagger or wand in hand
- Spiky, angular silhouette (contrasts with Bron's roundness)
- Clear puppet stick extending from bottom

**Expression Cutouts:**
- Eyes: Sharper/narrower than Bron's
- Mouth: Can be more expressive (mischievous grin)
- States needed: neutral, happy/smug, hurt, focused

**Color:** Same as Bron

---

## Enemy Silhouettes

All enemies use **ViewBox:** `0 0 200 320`
Bosses are larger and use **ViewBox:** `0 0 280 400`

### Act I Enemies

| Enemy | Description | Key Silhouette Features |
|-------|-------------|------------------------|
| **Stage Rat** | Scrappy pest | Rounded body, big ears, long tail, whiskers as spikes |
| **Rusty Knight** | Slow armored foe | Boxy helmet, sword and shield shapes, chunky proportions |
| **Moth Swarm** | Fragile multi-hitter | Cluster of wing shapes, antennae, compound eye cutouts |
| **Stagehand** | Helpful to wrong side | Human figure with cap, carrying props (ladder/sandbag) |

### Act I Boss

| Boss | Description | Key Silhouette Features |
|------|-------------|------------------------|
| **The Critic** | Judges your moves | Rotund figure, monocle cutout, notepad, quill, upturned nose |

### Act II Enemies

| Enemy | Description | Key Silhouette Features |
|-------|-------------|------------------------|
| **Phantom Understudy** | Copies strengths | Ghostly flowing shape, theatrical mask face, wispy edges |
| **Prop Master** | Builds defenses | Stocky figure, tool belt silhouette, carrying crate/props |
| **Shadow Mimic** | Retaliates on damage | Mirror-like outline, jagged edges, glowing eye cutouts |
| **Spotlight Phantom** | Hard to pin down | Floating figure in spotlight cone shape, ethereal |

### Act II Boss

| Boss | Description | Key Silhouette Features |
|------|-------------|------------------------|
| **The Director** | Orchestrates the stage | Tall imperious figure, megaphone, director's chair element, beret |

### Act III Enemies

| Enemy | Description | Key Silhouette Features |
|-------|-------------|------------------------|
| **Prima Donna** | Demands attention | Dramatic pose, flowing dress/cape, tiara, theatrical gesture |
| **Mask of Comedy/Tragedy** | Two faces | Two theatrical masks (happy/sad) connected, or figure holding both |
| **Puppeteer's Hand** | Controls from above | Giant disembodied hand with strings, control bar above |
| **Fallen Curtain** | Absorbs and retaliates | Heavy draped curtain shape with menacing face cutout |

### Act III Boss (Final)

| Boss | Description | Key Silhouette Features |
|------|-------------|------------------------|
| **The Playwright** | Wrote every word | Seated figure at desk, quill, stack of papers, ink pot, commanding presence |

---

## MacGuffin

**File:** `/static/svg/macguffin.svg`
**ViewBox:** `0 0 120 120`

**Design Requirements:**
- Treasure chest shape (primary design)
- Ornate lock/clasp detail as cutout
- Slight glow effect (can be CSS)
- Should read as "precious item to protect"

**Future Variants (not needed for v1):**
- Glowing orb
- Crown
- Ancient tome

---

## Audience Members

**File:** `/static/svg/audience.svg`
**ViewBox:** `0 0 400 80`

**Design Requirements:**
- 6-8 simple head-and-shoulder silhouettes in a row
- Variety in head shapes (round, tall, wearing hats)
- Simple enough to animate as a group
- Should read as "watching crowd" at small size

**Individual Audience Members (for varied reactions):**
- `/static/svg/curtain-call/audience-1.svg` through `audience-8.svg`
- Each ~50×80 viewBox
- Different hat/hair shapes for variety

---

## Intent Icons

**ViewBox:** `0 0 24 24` (icon size)
**Status:** Complete

| Icon | File | Shape |
|------|------|-------|
| Attack | `intent-attack.svg` | Sword pointing right |
| Block | `intent-block.svg` | Shield shape |
| Heal | `intent-heal.svg` | Heart |
| Buff | `intent-buff.svg` | Up arrow |
| Debuff | `intent-debuff.svg` | Skull |

---

## UI Elements (Future)

These may be needed for later milestones:

| Element | Purpose | Notes |
|---------|---------|-------|
| Curtain Left | Scene transitions | Draped curtain, left side |
| Curtain Right | Scene transitions | Mirror of left |
| Card Frame | Card backgrounds | Ornate border, parchment fill |
| Speech Bubble (Attack) | Combat feedback | Jagged/explosive burst shape |
| Speech Bubble (Defense) | Combat feedback | Rounded, solid shape |
| Speech Bubble (Buff) | Combat feedback | Soft with sparkles |
| Keyword Icons | Card tags | Small icons for Charged, Encore, etc. |

---

## Art Style Guidelines

All assets should follow these principles from theme.md:

1. **Flat black silhouettes** (`#1A1A2E`) against warm parchment backgrounds
2. **Shape language is everything** — characters distinguishable by outline alone
3. **Cutesy over eerie** — rounded, friendly shapes even for "scary" enemies
4. **Puppet sticks visible** on all character silhouettes
5. **Eye/mouth cutouts** as the only internal detail (backlight shines through)
6. **Scale communicates power** — bosses noticeably larger than regular enemies
7. **SVG format** for perfect scaling across devices

---

## Production Priority

**Phase 1 (MVP):**
1. Bron silhouette (replace placeholder)
2. Pip silhouette (replace placeholder)
3. Stage Rat enemy
4. MacGuffin (polish existing)
5. Audience strip (polish existing)

**Phase 2 (Act I Complete):**
6. Rusty Knight, Moth Swarm, Stagehand enemies
7. The Critic boss
8. Curtain transition elements

**Phase 3 (Full Game):**
9. All Act II enemies + The Director
10. All Act III enemies + The Playwright
11. UI polish elements
