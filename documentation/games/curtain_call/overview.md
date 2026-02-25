# Curtain Call — Overview

## What Is This?

Curtain Call is a single-player deck-building roguelike built as a solo game within the Parlor platform. It's styled as a shadow puppet theater performance — two puppet Protagonists defend a shared MacGuffin against a series of shadow villains across three acts, building and upgrading their deck along the way.

**Live at:** `parlor.marstol.com/solo/curtain-call`

**Target experience:** 15-20 minute runs on mobile. Pick two heroes, build a deck, fight through 9 encounters, take a bow or watch the curtain fall.

## How It Plays

1. Player selects two Protagonists (starting pair: Aldric the ironclad, Pip the trickster)
2. Receives a starting deck of 8 basic cards
3. Progresses through 3 acts, each with 2 scenes (choose 1 of 2 enemies) and 1 boss
4. After each scene: choose 1 of 3 new cards to add to the deck
5. After each boss: upgrade 1 existing card
6. Combat is turn-based: enemy telegraphs intent → player plays cards using energy → enemy acts → repeat
7. All damage targets a shared MacGuffin HP pool defended by both heroes
8. Run ends in victory (beat all 3 acts) or defeat (MacGuffin destroyed)

## What Makes It Different

The shadow puppet theater isn't just a skin — it's the design language. Characters are silhouettes on sticks with animated eye and mouth cutouts. Combat feedback comes through comic-book speech bubbles and onomatopoeia rather than particle effects. A shadow audience at the bottom of the screen reacts to the action. The whole thing is warm, whimsical, and designed to feel handcrafted.

Mechanically, the two-Protagonist system creates natural synergy tensions. Each hero has their own card pool and keyword affinity. The interesting decisions come from how you balance investment between them — go all-in on one hero's strengths, or build a flexible deck that can adapt?

## Technical Notes

- **Client-side game logic:** All combat, deck management, and turn flow runs in vanilla JavaScript in the browser. The server only serves the HTML page — no backend game logic, no persistence.
- **Prototype extension pattern:** A single `CurtainCallGame` class is split across 14 JS files via `Object.assign(CurtainCallGame.prototype, { ... })`. No ES modules or build step.
- **Mobile-first layout:** Portrait orientation, thumb-friendly tap targets, two-column card hand with drag-to-play.
- **Art pipeline:** SVG silhouettes, Web Animations API for combat effects, CSS transitions for UI, no external animation libraries. See [theme.md](theme.md) for full artistic direction.
- **Speech priority engine:** Cooldown-based system with diminishing returns governs enemy, protagonist, and crowd speech bubbles so dialogue feels natural without flooding the screen.

## Documentation Map

### [architecture.md](architecture.md)

Code architecture and file layout. Read this to understand:

- All 19 JavaScript files with line counts and roles
- Script load order and dependencies
- Class + prototype extension pattern
- Complete method inventory by file
- Cross-file dependency map
- Editing guide (which files to load for each type of change)

### [theme.md](theme.md)

The artistic identity of the game. Read this to understand:

- Shadow puppet theater aesthetic and visual principles
- Silhouette design guidelines (shape language, cutesy tone, eye/mouth cutouts)
- Speech bubble system — how combat feedback is communicated visually
- Audience behavior and reactions
- Animation philosophy (Web Animations API for combat, CSS transitions for UI)
- Mobile screen layout breakdown
- Color palette (with deuteranomaly-accessible color choices), typography, and art asset checklist

### [card-ui-spec.md](card-ui-spec.md)

Visual design spec for the ticket-stub card UI.

### [verification_guide.md](verification_guide.md)

Checklist for verifying the game works correctly after changes.

### [updated_rules/](updated_rules/)

CSV files with current card definitions and balance data. The canonical source of truth for card stats is `cards.js`, but these CSVs are useful for review and planning.

## Current Scope

The current alpha implementation:

- 1 protagonist pair (Aldric + Pip)
- ~30 unique cards across common/uncommon/rare rarities
- 12 scene enemies + 3 bosses with unique attack patterns and passives
- 3-act run structure with card rewards after each combat
- Keyword system: 11+ buffs/keywords, 11+ debuffs, Ovation meter
- Drag-to-play card interface with two-column hand layout
- Audience members that react to combat and explain keywords on card zoom
- No persistence — each page load is a fresh run (intentionally deferred)

## Future Considerations (Parked)

These ideas are documented but deliberately out of scope for v1:

- Additional protagonist pairs (combinatorial explosion of pairings)
- Shops, rest stops, and narrative events between encounters
- Artifacts (non-card persistent buffs for a run)
- Audience meter fueling a "Showstopper" ability
- MacGuffin variants that change per mission type
- Save/resume for interrupted runs
- Sound design (wooden clacks, audience reactions, music)
- Difficulty scaling system (unlockable modifiers like Monster Train's covenants)
