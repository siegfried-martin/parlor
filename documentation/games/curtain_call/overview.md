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

- **Client-side game logic:** All combat, deck management, and turn flow runs in vanilla JavaScript in the browser. The server is not involved during gameplay.
- **Server-side persistence:** SQLite database tracks player unlocks and run history. Username-based identity (no auth). FastAPI serves pages and exposes simple API endpoints.
- **Event bus architecture:** Keywords, status effects, and triggered abilities register as listeners on a central event system rather than being hardcoded into the combat loop. This makes new mechanics composable without touching core code.
- **Mobile-first layout:** Portrait orientation, thumb-friendly tap targets, horizontally scrollable card hand.
- **Art pipeline:** SVG silhouettes, CSS-only animations (transforms, transitions, keyframes), no external animation libraries.

## Documentation Map

### [theme.md](theme.md)

The artistic identity of the game. Read this to understand:

- Shadow puppet theater aesthetic and visual principles
- Silhouette design guidelines (shape language, cutesy tone, eye/mouth cutouts)
- Speech bubble system — how combat feedback is communicated visually
- Audience behavior and reactions
- Animation philosophy (CSS transforms on whole puppets, no skeletal animation)
- Mobile screen layout breakdown
- Color palette (with deuteranomaly-accessible color choices), typography, and art asset checklist

### [core.md](core.md)

The rules of the game and technical architecture. Read this to understand:

- Complete run structure (3 acts × 2 scenes + 1 boss)
- Turn-by-turn combat flow with event hook points
- Energy system (3 per turn, cards cost 0-3)
- All defensive mechanics: Block, Ward, Deflect, Ovation, Curtain
- All keywords: Charged, Fortify, Piercing, Persistent, Encore, Sweeping
- All debuffs: Stage Fright, Heckled, Weakness, Forgetfulness (directional — some enemy→hero only)
- Buffs: Standing Ovation, Rehearsed
- Event bus architecture with full event catalog, mutable context pattern, and priority system
- Card and enemy data structures
- Status effect system
- Between-encounter flow (card rewards, boss upgrades, enemy selection)
- Meta-progression: SQLite schema, unlock system, what persists vs. what resets
- Integration with Parlor platform (routes, file structure, client-server split)

### [assets.md](assets.md)

The actual game content. Read this to understand:

- **Protagonists:** Aldric (heavy hitter, Charged affinity) and Pip (utility/control, Encore affinity) — stats, personality, speech bubbles, cross-protagonist banter
- **Card pools:** Starting deck (8 cards), Aldric's cards (8), Pip's cards (8), neutral cards (7) — all with costs, effects, keywords, upgrade versions, speech bubbles, and unlock tiers
- **Enemies:** 12 scene enemies (4 per act) and 3 bosses — each with HP, gimmick hints, attack patterns, speech bubbles, and design intent explaining what they test
- **The Playwright** as final boss: 3-phase, 100 HP endurance fight
- **Unlock progression:** Tier 1 (clear Act I) and Tier 2 (win a run)
- **Balance notes:** Starting assumptions for HP, damage numbers, and things to watch in playtesting

## Current Scope

The initial implementation targets the minimum viable experience:

- 1 protagonist pair (Aldric + Pip)
- ~23 unique cards (including basics and unlockables)
- 12 scene enemies + 3 bosses
- 3-act run structure with card rewards and boss upgrades
- SQLite persistence for unlocks and run history
- No shops, artifacts, events, or between-encounter healing (intentionally deferred)

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
