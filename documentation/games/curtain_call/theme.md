# Curtain Call — Theme & Artistic Direction

## Concept

Curtain Call is a deck-building roguelike staged as a shadow puppet theater performance. The player selects two Protagonists who defend a shared MacGuffin against a series of shadow villains across three acts. The entire game is framed as a live show — complete with a reacting audience, dramatic speech bubbles, and theatrical flair.

The shadow puppet aesthetic isn't a workaround for limited animation capability. It _is_ the identity. Everything in the game should feel handcrafted, warm, and slightly whimsical — like a street performer's show that somehow has real stakes.

## Visual Identity

### The Stage

The primary play area evokes a traditional shadow puppet theater:

- **Background:** Warm parchment/amber tones, subtly textured. Not pure flat color — should feel like light passing through oiled paper or stretched fabric.
- **Frame:** Subtle curtain silhouettes on left and right edges. These don't take up much space but establish "this is a stage." On act transitions, the curtains can close and reopen.
- **Lighting:** A soft radial gradient suggesting a backlight source. Slightly brighter in the center where action happens, dimming toward edges. This sells the "light behind a screen" illusion.

### Silhouettes

All characters — Protagonists and enemies — are rendered as flat black or near-black silhouettes. This is the defining visual constraint.

**Design principles for silhouettes:**

- **Shape language is everything.** A spiky silhouette reads as dangerous. A round one reads as sturdy. A tall thin one reads as mystical. Characters must be instantly distinguishable by outline alone.
- **Puppets on sticks.** Each character has a visible stick/rod extending below them, disappearing off the bottom of the stage area. This reinforces the puppet theater fiction and is a simple visual element (a thin vertical line).
- **Solid silhouettes with expressive cutouts.** Silhouettes are solid fills — no internal clothing or body detail. Identity comes entirely from outline shape — weapons, wings, horns, tails, hats, cloaks all expressed as contour. The exception is **eyes and mouths**: small cutout holes in the silhouette that let the "backlight" shine through, giving each puppet a face. These can be animated — eyes blink, widen on surprise, narrow on anger. Mouths open when the puppet "speaks" via speech bubble. This adds a huge amount of personality while keeping the shadow puppet feel, and is achievable with simple CSS transitions on SVG elements.
- **Scale communicates power.** Regular enemies are roughly protagonist-sized. Bosses are noticeably larger, taking up more stage space.
- **Cutesy over eerie.** Silhouette shapes should lean rounded and friendly rather than angular and unsettling. Even "scary" enemies like dragons or demons should have a plush, storybook quality — big heads, stubby limbs, exaggerated features. The tone is a children's puppet show, not a horror shadow play.

**Sourcing/creating silhouette art:**

- SVG format for perfect scaling across devices
- Simple black fills with cutout shapes for eyes/mouth as separate SVG elements (for independent animation)
- Could be hand-drawn and traced, generated, or sourced from royalty-free silhouette collections
- Each character needs: idle pose, a subtle "breathing" variant (slight scale pulse via CSS), and a defeat pose (tilting/falling off stage)
- Eye/mouth states: neutral, happy/excited, hurt/surprised, angry/focused (4 states covers most combat situations)

### The MacGuffin

Positioned center-stage between the two Protagonists. This is the shared health pool visualization.

- A distinct silhouette object — treasure chest, glowing orb, crown, ancient tome. Could vary by run or protagonist pairing (future feature).
- Health bar displayed directly on or below it.
- As health decreases, the silhouette could subtly crack or dim.
- On defeat: the enemy grabs/destroys it, curtain falls.
- On victory: it glows/pulses, Protagonists bow.

### The Audience

A strip along the bottom of the screen showing small shadow audience member silhouettes — simple head-and-shoulder shapes, maybe 6-8 of them.

**Behavioral guidelines:**

- **Idle:** Mostly still. Occasional subtle shifts (one leans, another adjusts).
- **Big hit dealt:** One or two jump up briefly, maybe a tiny arm raise.
- **Damage taken:** One slumps or covers eyes.
- **Combo/powerful play:** Several stand and wave.
- **Near defeat (low HP):** Audience visibly tense — leaning forward, hands on heads.
- **Victory:** All stand, implied cheering.
- **Defeat:** Slump, one might throw something.

All audience animations are simple CSS transforms — translateY, rotate, scale. No complex keyframes needed. The audience members themselves are basic silhouette shapes, even simpler than the puppet characters.

**Mechanical potential (future):** The audience could fuel a "Showstopper" meter — a powerful once-per-combat ability that charges based on impressive plays. Initially cosmetic only.

## Animation Philosophy

### No Skeletal Animation

Puppets do not have independently moving parts. They are single rigid shapes. All combat animation is applied to the _whole_ silhouette via the **Web Animations API** (`element.animate()`), with CSS transitions for UI state changes:

- **Idle:** Subtle vertical bob or slow scale pulse (breathing). CSS `transform: translateY()` oscillating 2-3px.
- **Attack:** Quick lunge toward enemy (translateX) and snap back. ~200-300ms total. Web Animations API.
- **Taking damage:** Shake (rapid small translateX oscillations). Classic screen-shake but applied to the puppet. Web Animations API.
- **Blocking/absorb:** Brief scale-up pulse. Web Animations API.
- **Defeat:** Rotate to one side (puppet falling over) + translateY downward (sinking below stage). Stick goes limp.
- **Buff/heal:** Brief upward float + subtle glow (CSS box-shadow or filter). Web Animations API.

Animation configs (timing, keyframes, variants) live in `config/animation-config.js`. The `playAnimation(element, name)` helper in `game.js` returns a Promise via `anim.finished` so effects can be sequenced.

### Speech Bubbles as Core Feedback

This is the most important visual system in the game. Speech bubbles and comic-book-style bursts carry ALL combat feedback — damage numbers, status effects, reactions.

**Attack bubbles:** Bold, jagged burst shapes. Large onomatopoeia text.

- `"SLAM!"` `"CRACK!"` `"SLASH!"` for physical attacks
- `"ZZAP!"` `"WHOOSH!"` `"SIZZLE!"` for magical attacks
- Damage number displayed prominently within or beside the burst

**Defense bubbles:** Rounded, solid shapes. Steadier text.

- `"BLOCK!"` `"BRACE!"` `"DEFLECT!"`
- Amount blocked shown inside

**Buff/status bubbles:** Softer shapes, maybe with sparkle/star decorations (CSS-drawn).

- `"FORTIFY!"` `"CHARGED!"` `"WEAKENED!"`

**Hero personality bubbles:** Small speech bubbles from Protagonists reacting to events. These are _not_ mechanical — they're flavor.

- On big hit: `"Take THAT!"` or `"...acceptable."`
- On taking damage: `"Ow!"` or `"'Tis but a scratch."`
- Cross-protagonist banter: unique lines that only appear with specific pairings

**Technical approach:**

- Bubbles are absolutely-positioned divs that appear, animate in (scale from 0 + slight rotation), hold for 2500-4000ms (scaled by word count), then fade out.
- Multiple bubbles can overlap — this creates visual energy during big turns.
- Font: `Bangers` display font for attack/damage text, `system-ui` for audience/crowd bubbles.
- Color coding within the bubble text: red for damage dealt, blue/gray for defense, gold for healing, purple for debuffs.
- A speech priority engine with cooldowns and diminishing returns prevents dialogue from flooding the screen. Config lives in `config/speech-config.js`.

### Screen Transitions

- **Between scenes:** Brief curtain close (curtain silhouettes slide to center) → reopen on new enemy.
- **Between acts:** Longer curtain close, maybe a title card ("Act II") displayed on the curtain before reopening.
- **Card reward screen:** Could be framed as "intermission" — curtain partially drawn, cards displayed center stage.
- **Victory:** Protagonists bow, audience stands, curtain falls gracefully. "FIN" or "THE END" on curtain.
- **Defeat:** Enemy claims MacGuffin, curtain crashes down abruptly. Audience groans.

## Mobile-First Layout

The game is designed for portrait-mode mobile play. All tap targets must be comfortably sized for thumbs.

### Screen Regions (top to bottom)

```
┌─────────────────────────┐
│     ENEMY AREA          │  ~25% of screen
│  [enemy silhouette]     │  Intent icon + number above enemy
│  [enemy HP bar]         │  Progress indicator (act/scene dots)
├─────────────────────────┤
│     STAGE               │  ~30% of screen
│  [hero]  [MGF]  [hero]  │  MacGuffin centered, heroes flanking
│          [HP bar]       │  Speech bubbles appear here
├─────────────────────────┤
│     HAND                │  ~30% of screen
│  [card] [card]          │  Two-column grid layout
│  [card] [card]          │  Cards tall enough to read
│  [card]                 │  Drag-to-play onto stage
├─────────────────────────┤
│  [👤👤👤] [⚡3] [END]  │  ~15% of screen
│   audience  energy  btn │  Audience + energy + end turn
└─────────────────────────┘
```

### Interaction Model

- **Drag a card to stage:** Drag upward past the hand area to play it. Cards snap back if released too early or if unplayable. An 8px threshold distinguishes taps from drags.
- **Tap a card:** Opens a zoomed view of the card. Audience members explain the card's keywords via speech bubbles.
- **Tap a Protagonist:** Shows current stats — HP, active buffs/debuffs, keyword status.
- **Tap an enemy:** Shows current HP, active statuses, intent for this turn.
- **Keyword emojis in card text:** Card descriptions display keyword emoji icons (from `KEYWORD_GLOSSARY`) inline, helping players learn keyword associations.
- **End Turn button:** Prominent, bottom-right.

## Color Palette

The palette is warm and limited, evoking firelight and parchment:

- **Background:** `#F4E4C1` (warm parchment) to `#D4A055` (deeper amber at edges)
- **Silhouettes:** `#1A1A2E` (near-black with slight blue undertone, softer than pure black)
- **Puppet sticks:** `#3D2B1F` (dark wood brown)
- **HP bar (full):** `#C0392B` (warm red) — could shift toward `#E74C3C` when low
- **Energy indicator:** `#F1C40F` (golden yellow) — fits the "stage lights" motif
- **Card backgrounds:** Slightly lighter parchment than the stage, `#FAF0DB`, with darker borders
- **Speech bubble fills:** `#FFFEF5` (near-white) with dark text
- **Attack burst outline:** `#E74C3C` (red-orange)
- **Defense burst outline:** `#3498DB` (steel blue)
- **Buff/heal glow:** `#F5B041` (warm gold — distinct from red damage for color vision accessibility)
- **Debuff drip:** `#8E44AD` (purple)

## Typography

- **Speech bubbles / damage text:** A bold display font with character. Consider "Bangers" (Google Fonts) — it's comic-book-styled and free. Or "Luckiest Guy" for a rounder, friendlier feel.
- **UI text (card names, stats):** A clean serif or slab-serif that feels slightly old-timey. "Playfair Display" or "Bitter" work well.
- **Body text (card descriptions, keyword explanations):** Readable sans-serif. System font stack is fine here for performance.

## Audio Direction (Future)

Not in initial scope but noting for later:

- Wooden clacking sounds for puppet movement
- Muffled audience reactions (gasps, cheers, boos)
- A simple musical theme per act — could be public domain classical arrangements
- Sound effects for speech bubble appearances (pop/whoosh)

## Art Asset Status

Current state of visual assets:

- [x] 2 Protagonist silhouettes (Aldric, Pip) — SVG with eye/mouth cutouts
- [x] 1 MacGuffin silhouette — SVG
- [x] Enemy silhouettes — SVG (mix of custom and placeholders in `static/svg/enemies/`)
- [x] 8 audience member types (adults + children) — CSS-drawn silhouettes with colored accessories
- [x] Curtain transitions — CSS gradient curtains that close/open between scenes
- [x] Card frame design — CSS ticket-stub style with rarity borders, energy blips, perforation line
- [x] Speech bubble shapes — CSS (attack burst, defense, buff, heal, debuff variants)
- [x] Keyword icons — emoji from `KEYWORD_GLOSSARY`, displayed in card descriptions and audience explanations
- [x] Background — CSS radial gradient (warm parchment center, darker edges)
- [ ] More unique enemy SVGs (some still use placeholders)
- [ ] Defeat/victory pose variants for protagonists
- [ ] MacGuffin damage states
