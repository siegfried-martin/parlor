# Card UI Specification — Curtain Call

## Overview

Cards in Curtain Call are styled as **horizontal theater tickets**. Each card is rendered as an HTML element with CSS styling — no canvas, no full-SVG cards. The only SVG-dependent elements are the protagonist right-edge treatments, which are handled via CSS `clip-path` and pseudo-elements.

The game engine renders cards dynamically by applying CSS classes and injecting text content. Card "stock" (the visual template) is reusable per protagonist; the engine overlays name, description, energy count, type, and rarity at runtime.

## Reference Screenshots

Visual references for the final approved design are located at:

- `documentation/games/curtain_call/tmp/ticket-example1.png` — Pip, Quick Jab (Common, 1 cost, Attack)
- `documentation/games/curtain_call/tmp/ticket-example2.png` — Aldric, Hammer Swing (Rare, 2 cost, Attack)
- `documentation/games/curtain_call/tmp/ticket-example3.png` — Aldric, Iron Wall (Common, 3 cost, Defense)
- `documentation/games/curtain_call/tmp/ticket-example4.png` — Pip, Smoke Bomb (Uncommon, 2 cost, Action)
- `documentation/games/curtain_call/tmp/ticket-example5.png` — Pip, Grand Finale (Legendary, 5 cost, Attack)

**These are the source of truth for visual appearance.** When in doubt, match the screenshots.

---

## Card Dimensions & Orientation

- **Orientation:** Horizontal (landscape), like a theater ticket
- **Aspect ratio:** Approximately 2.4:1 (480×200 in the reference SVGs)
- **Actual rendered size:** Determined by the card grid layout (see Hand Layout section below)
- **Target device:** 375×812 portrait mobile

---

## Card Anatomy (Left to Right)

```
┌─────────────────────────────────────────────────────────┐
│ RARITY BORDER (top strip, full width)                   │
├────┬┊───────────────────────────────────────────────┬───┤
│    │┊  — PRESENTING —                               │   │
│ ●  │┊                                               │ R │
│    │┊       Card Name                               │ I │
│ ●  │┊  ─────────────●─────────────                  │ G │
│    │┊                                               │ H │
│    │┊  Description line 1                           │ T │
│    │┊  Description line 2                           │   │
│    │┊  Description line 3 (optional)                │ E │
│    │┊                                               │ D │
│    │┊       [ ⚔  TYPE BADGE ]                       │ G │
│    │┊                                               │ E │
├────┴┊───────────────────────────────────────────────┴───┤
│ RARITY BORDER (bottom strip, full width)                │
└─────────────────────────────────────────────────────────┘
 STUB  PERF              BODY                          EDGE
```

### 1. Rarity Border (Top & Bottom)

Full-width horizontal strips along the top and bottom edges of the card.

| Rarity    | Treatment                                                                               |
| --------- | --------------------------------------------------------------------------------------- |
| Common    | `background: #5A4A3A` at `opacity: 0.4`                                                 |
| Uncommon  | CSS linear gradient left→right: `#3A2A18 → #6B5020 → #8B6914 → #6B5020 → #3A2A18`       |
| Rare      | CSS linear gradient (silver shimmer): `#808890 → #B8C0C8 → #D8DCE0 → #B8C0C8 → #808890` |
| Legendary | CSS linear gradient (gold shimmer): `#8B6914 → #D4A030 → #F5D060 → #D4A030 → #8B6914`   |

- **Height:** 7px
- These are simple `div` strips or `::before`/`::after` pseudo-elements on the card container

### 2. Stub (Left Zone)

The ticket stub, visually separated from the card body by the perforation line.

- **Width:** 56px
- **Background:** Slightly darker/warmer than card body — use a left-to-right gradient:
  - Left edge: `#D8C090` at `opacity: 0.7`
  - Right edge: `#E8D0A8` at `opacity: 0.15`
  - This creates a subtle tint that distinguishes the stub from the body
- **Contains:** Energy blips only

### 3. Energy Blips (Inside Stub)

Glowing circles representing the card's energy cost. **Always positioned starting from the top-left of the stub**, stacking downward.

- **Alignment:** Centered horizontally in the stub (≈28px from left edge), top-aligned
- **First blip top offset:** ≈22–30px from card top (below rarity border)
- **Spacing:** ≈26–28px center-to-center between blips
- **Size:** Radius 11px for costs 1–3, radius 9px for costs 4–5 (to fit)

**Color per protagonist:**

| Protagonist | Outer gradient                       | Stroke          | Inner core          |
| ----------- | ------------------------------------ | --------------- | ------------------- |
| Aldric      | radial `#FFE0A0 → #F5B041 → #C07820` | `#8B6914` 1.5px | `#FFF8E0 → #FFE8B0` |
| Pip         | radial `#FFB0A0 → #E06050 → #A03020` | `#802018` 1.5px | `#FFF0E8 → #FFD0C0` |

Each blip is a circle with a radial gradient fill, a colored stroke, and a smaller bright inner circle (≈40% of outer radius) to create a "glowing lantern" effect.

**Implementation:** A flex column container inside the stub, with `n` blip elements where `n` = energy cost. Only filled blips are rendered — no empty/gray placeholders.

### 4. Perforation Line

A dashed vertical line separating the stub from the card body, evoking a tear-off ticket.

- **Position:** At x=56px (right edge of stub)
- **Style:** `border-left: 1.2px dashed #A08060` (or equivalent)
- **Background highlight:** A subtle 8px-wide strip behind the dashes at `#DCC898` with `opacity: 0.25`, creating a slight color shift that reinforces the perforation zone

**Implementation:** A `div` or `::after` pseudo-element with dashed border and a background strip behind it.

### 5. Card Body (Center Zone)

The main content area. All text content lives here.

- **Background:** CSS linear gradient: `#F5E6C8 → #EDD9B5 → #E8D0A8` (warm parchment)
- **Text is centered horizontally** within the body zone (between perforation and right edge)

**Content stack (top to bottom):**

#### a. "— PRESENTING —" Header

- **Font:** `'Special Elite', cursive` (Google Fonts — monospace/typewriter aesthetic)
- **Size:** 9px
- **Color:** `#8B6914`
- **Letter-spacing:** 3px
- **Text:** Literal string `— PRESENTING —` (em dashes)
- **Position:** Near top of body, ≈28px from card top

#### b. Card Name

- **Font:** `'Playfair Display', serif` (Google Fonts — elegant display serif)
- **Weight:** 700 (bold)
- **Size:** 22–24px (24px default, reduce to 22px for long names)
- **Color:** `#3D2B1F` (dark brown, near-black)
- **Letter-spacing:** 1px
- **Position:** ≈28px below PRESENTING header

#### c. Decorative Rule

A thin horizontal line under the card name with a small circle at center.

- **Line:** 1px stroke, color `#8B6914`, extends ≈180px in each direction from center
- **Center ornament:** Small circle (radius 2.5px) with parchment fill and `#8B6914` stroke
- **Implementation:** An `<hr>` with custom styling, or a `div` with `border-top` and a centered `::after` pseudo-element circle. The circle can also be omitted at small card sizes if it doesn't render cleanly.

#### d. Description Text

- **Font:** `'IM Fell English', serif` (Google Fonts — old-style serif, numbers have distinctive character)
- **Size:** 15px
- **Color:** `#4A3520`
- **Line height:** ≈20px (for multi-line)
- **Max lines:** 3 (cards should be written to fit within 3 lines)
- **Alignment:** Center
- **No surrounding box** — text floats freely below the rule

**Note on IM Fell English:** This font was specifically chosen because its numerals are visually distinctive and stand out from the surrounding text. Since numbers in card descriptions (damage values, block amounts, draw counts) are typically the most important information, this font naturally draws the eye to them. This is an intentional design advantage — do not substitute with a font that has uniform numeral styling.

#### e. Type Badge

A rounded pill/rectangle at the bottom of the body area.

- **Shape:** Rounded rectangle, `border-radius: 5px`
- **Width:** Dynamic, sized to fit content with padding (≈130px for standard types)
- **Height:** 30px
- **Position:** Centered horizontally, near bottom of card body (≈148–150px from top)
- **Text:** Unicode icon + type name, e.g. `⚔  ATTACK`
- **Text font:** `'Playfair Display', serif`, 14px, weight 600, letter-spacing 2px
- **Text color:** `#F5E6C8` (cream on dark background)

| Type    | Badge background             | Icon         |
| ------- | ---------------------------- | ------------ |
| Attack  | `#5A2020` at `opacity: 0.88` | ⚔ (U+2694)   |
| Defense | `#1A3A5A` at `opacity: 0.88` | 🛡 (U+1F6E1) |
| Action  | `#3A2050` at `opacity: 0.88` | ✦ (U+2726)   |

The badge background color and icon are set dynamically by the engine based on card type. The width should accommodate any type name — this is a dynamic element, not fixed-size.

### 6. Right Edge (Protagonist Identity)

The right edge of the card carries the protagonist's visual identity through shape/texture. This is the only part requiring non-trivial CSS.

#### Aldric — Riveted Iron Plate

A vertical strip of metallic gray with evenly spaced rivet details.

- **Strip width:** ≈42px
- **Background:** CSS linear gradient (vertical): `#6B7080 → #8890A0 → #7880A0 → #585E6B`
- **Left border:** 1.5px solid `#505868` (the seam where iron meets parchment)
- **Rivets:** 5 circles evenly spaced vertically
  - Outer circle: radius 5px, fill `#9098A8`, stroke `#505868` 1.5px
  - Inner highlight: radius 2px, fill `#B0B8C8` (metallic shine)
  - Centered horizontally in the strip
  - Evenly distributed from top to bottom (≈y positions 28, 68, 108, 148, 180)

**Implementation:** A `div` positioned absolutely on the right side of the card with the gradient background. Rivets can be small `div` elements with `border-radius: 50%` and a box-shadow or inner element for the highlight, or a repeating background SVG pattern. The card body gets no clip-path — straight right edge.

#### Pip — Torn Paper Edge

The right edge is jagged/torn, as if the ticket was ripped. Small fiber strands extend past the tear.

- **Clip-path:** Apply a CSS `clip-path: polygon(...)` to the entire card creating a zigzag right edge
- **Zigzag pattern:** Alternating x-values between approximately 91% and 93% of card width, stepping every ≈14px vertically. The irregularity is important — don't make it perfectly uniform. Vary the x-positions slightly (89%–94% range) to look like a natural tear.
- **Fiber strands:** Optional decorative detail. Small 8–12px lines extending rightward past the tear at a few points, at low opacity (0.4–0.6), color `#D8C8A0`. These can be `::after` content or omitted at small card sizes.

**Implementation:** The entire Pip card container gets a `clip-path` polygon. Example approximate polygon (adjust values to match screenshots):

```css
.card-pip {
  clip-path: polygon(
    0% 0%,
    92% 0%,
    93% 3%,
    91% 6.5%,
    93% 10%,
    91% 14%,
    93% 17%,
    91% 21%,
    94% 24%,
    91% 28%,
    92% 31.5%,
    90% 35%,
    93% 38.5%,
    91% 42%,
    93% 45%,
    91% 49%,
    92% 52%,
    91% 56%,
    94% 59%,
    91% 63%,
    93% 66%,
    90% 70%,
    92% 73%,
    91% 77%,
    93% 80%,
    91% 84%,
    92% 87%,
    91% 91%,
    93% 94%,
    92% 100%,
    0% 100%
  );
}
```

---

## Color Palette Summary

| Element                | Color                         | Usage                      |
| ---------------------- | ----------------------------- | -------------------------- |
| Card body              | `#F5E6C8 → #EDD9B5 → #E8D0A8` | Parchment gradient         |
| Stub tint              | `#D8C090` at 0.7 opacity      | Left stub zone             |
| Perforation dashes     | `#A08060`                     | Dashed line                |
| Perforation background | `#DCC898` at 0.25 opacity     | Subtle strip behind dashes |
| PRESENTING text        | `#8B6914`                     | Header, rules, ornaments   |
| Card name              | `#3D2B1F`                     | Dark brown display text    |
| Description text       | `#4A3520`                     | Body text                  |
| Badge text             | `#F5E6C8`                     | Cream text on dark badge   |
| Aldric energy          | `#F5B041` dominant            | Warm gold/amber lanterns   |
| Pip energy             | `#E06050` dominant            | Coral/red lanterns         |

---

## Required Google Fonts

Load these in the page `<head>`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=IM+Fell+English:ital@0;1&family=Special+Elite&display=swap"
  rel="stylesheet"
/>
```

| Font                              | Usage                      |
| --------------------------------- | -------------------------- |
| **Playfair Display** (400, 700)   | Card name, type badge text |
| **IM Fell English** (400, italic) | Description text           |
| **Special Elite**                 | "PRESENTING" header        |

---

## Hand Layout

Cards are displayed in **stacked columns** in the lower portion of the screen (the "pit" — below the stage where puppets perform).

- **Layout:** 2–3 columns depending on final card size and available width at 375px. Determine which fits better at implementation time — readability is the priority.
- **Each column is a vertical stack** of cards. Cards within a stack are fully visible (no overlap) until the stack is full.
- **Stack depth:** Determine based on available vertical space in the pit area. With the horizontal ticket aspect ratio (2.4:1), cards are short enough that 2–3 cards per stack should fit comfortably.
- **Overflow strategy:** Once all stacks are full, additional cards **overlap** within their column — the top portion of each card remains visible. This works well because the card's most important information (energy blips, PRESENTING header, card name) is all concentrated at the top of the card, so partially obscured cards are still scannable.
- **Card gap (non-overlapping):** 8–12px between cards in a stack
- **Overlap offset:** When overlapping, show enough of each card's top to read the name and energy cost (roughly the top 40–50% of the card)
- **Max hand size:** Treat as variable/unrestricted. The stacked column layout with overlap should gracefully handle any hand size without a hard cap.
- **The pit area** should have a darker background than the stage to create visual separation (the cards live in the orchestra pit / puppeteer workspace below the stage, not on the stage itself)

Future enhancement: cards will be **draggable** onto the stage to play them. Plan the card container accordingly — cards should be individually positionable elements (absolute or relative positioning), not table cells or rigid grid items.

---

## Dynamic Fields (Engine Responsibility)

The card template is a static visual stock. The engine populates these fields at runtime:

| Field             | Source             | Notes                                                                                |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------ |
| Energy blip count | `card.cost`        | Render N blip elements, 1–5                                                          |
| Energy blip color | `card.owner`       | Aldric = gold, Pip = coral                                                           |
| Card name         | `card.name`        | Text injection                                                                       |
| Description       | `card.description` | Text injection, up to 3 lines                                                        |
| Type badge text   | `card.type`        | Includes Unicode icon prefix                                                         |
| Type badge color  | `card.type`        | Attack=red, Defense=blue, Action=purple                                              |
| Rarity border     | `card.rarity`      | CSS class: `.rarity-common`, `.rarity-uncommon`, `.rarity-rare`, `.rarity-legendary` |
| Right edge        | `card.owner`       | CSS class: `.card-aldric` or `.card-pip`                                             |

---

## CSS Class Structure

```
.card                       — Base card container (parchment bg, dimensions)
  .card-aldric              — Aldric right edge (iron plate, straight edge)
  .card-pip                 — Pip right edge (torn clip-path)
  .rarity-common            — Common border strips
  .rarity-uncommon          — Uncommon (bronze) border strips
  .rarity-rare              — Rare (silver) border strips
  .rarity-legendary         — Legendary (gold) border strips
  .card__stub               — Left stub zone
  .card__perforation        — Dashed line + background strip
  .card__energy             — Flex column for blips
    .energy-blip            — Individual blip circle
    .energy-blip--aldric    — Gold color variant
    .energy-blip--pip       — Coral color variant
  .card__body               — Center content area
    .card__presenting       — "PRESENTING" text
    .card__name             — Card name
    .card__rule             — Decorative horizontal rule
    .card__description      — Description text container
    .card__type-badge       — Type pill at bottom
      .type-attack          — Red background
      .type-defense         — Blue background
      .type-action          — Purple background
```

---

## Implementation Notes

1. **No description box.** Earlier iterations had a bordered rectangle around the description text. This was removed — description text floats freely below the decorative rule.

2. **Energy blips are filled only.** Do not render empty/gray placeholder blips. A 2-cost card shows 2 blips, not 2 lit + 3 dark.

3. **The "— PRESENTING —" header** uses em dashes (—), not hyphens. This is a static string on every card.

4. **Unicode icons in type badges** are standard text characters inserted by the engine as part of the type string. No custom icon images needed. The icons are: ⚔ (U+2694), 🛡 (U+1F6E1), ✦ (U+2726).

5. **Font fallback:** If Google Fonts fail to load, fall back to `serif` for Playfair Display and IM Fell English, and `monospace` for Special Elite. The design degrades gracefully.

6. **Card shadow:** Apply `filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5))` or equivalent `box-shadow` to each card for depth against the pit background.

7. **Protagonist stock images:** Once the HTML/CSS template is validated, export a screenshot of each protagonist's empty card (no text content, just the visual stock with placeholder zones) for reference. The engine does not need stock images to function — it builds cards from CSS classes — but stock images are useful for design documentation and testing.

---

## Implementation Status (Updated 2026-02-06)

### Completed

The card UI has been implemented with a **two-tier approach**:

#### Small View (Hand Cards)
- **Dimensions:** 165×70px (simplified ticket style)
- **Layout:** 2 columns with flex-wrap
- **Visible elements:**
  - Rarity bars (top/bottom, 3px)
  - Stub with energy blips (24px wide, blips 10×10px)
  - Perforation line (dashed border)
  - Card name (10px Playfair Display)
  - Description (9px IM Fell English, 2-line clamp)
  - Type badge (6px, bottom-aligned)
- **Protagonist edges:**
  - Aldric: Iron rivets strip (12px wide)
  - Pip: Torn paper edge via `clip-path: polygon()`
  - Neutral: Straight edge with extra padding

#### Large View (Zoomed/Reward Cards)
- **Dimensions:** 320×180px (zoomed), 280×140px (rewards)
- **Shows full ticket details:**
  - "— PRESENTING —" header
  - Full card name
  - Decorative rule with center ornament
  - Full description (no line clamp)
  - Larger type badge

#### Hand Layout & Overflow
- **2-column layout** with 6px gap
- **Overlap triggers at 7+ cards:** negative margin-bottom creates vertical stacking
  - 7-8 cards: -35px overlap
  - 9+ cards: -45px overlap
- **Z-index stacking:** Later cards appear on top (pairs share z-index since they're side-by-side)
- **Hard maximum:** 16 cards (tested up to 20, still visually acceptable)
- **No scrollbar:** overflow is hidden; game logic enforces hand limits

#### Debug Commands
```javascript
window.gameDebug.draw(n)      // Draw n cards
window.gameDebug.addCard(id)  // Add specific card by ID
window.gameDebug.listCards()  // List all available cards
```

### Files Modified
- `/static/css/solo/curtain-call.css` — All card styling
- `/static/js/solo/curtain-call/game.js` — Card rendering functions:
  - `createCardElement()` — Small hand card
  - `createZoomedCardElement()` — Large zoomed view
  - `renderRewardCards()` — Reward selection screen

### Known Deviations from Spec
1. **Small view is simplified** — Full ticket details (PRESENTING header, decorative rule) only appear in zoomed/reward views
2. **Energy blips are smaller** (10px vs spec's 22px) to fit the compact card size
3. **Stub is narrower** (24px vs spec's 56px) for space efficiency
4. **Description shown in small view** with 2-line clamp (original spec suggested hiding it)

### Next Steps (Milestone Order)
1. **Milestone 16: Starting Menu & Scene Flow** — Title screen, protagonist selection, scene transitions
2. **Milestone 17: Card Logic Overhaul** — Refactor card data/effects, standardize action system
3. **Milestone 18+:** Full Act I Run and remaining milestones
