/**
 * Curtain Call — v2 Enemy Definitions & Act Structure
 *
 * All enemy data, behavior patterns, passives, phase transitions,
 * and the 3-act progression structure.
 *
 * Pattern format:
 *   Each entry = one enemy turn. Top-level type/value/hits/target
 *   are used for the intent display. If an `actions` array is present,
 *   those actions are executed; otherwise the top-level fields are
 *   treated as a single action.
 *
 * Boss format:
 *   `phases` array. Phase 0 is active at full HP. Subsequent phases
 *   have `hpThreshold` (fraction of maxHP) — when enemy HP drops
 *   below threshold × maxHP, that phase activates. `transition`
 *   effects are applied once on entering the phase.
 */

'use strict';

const ENEMY_DEFINITIONS = {

    // ================================
    // === ACT I — "The Opening" ===
    // ================================

    'stage-rat': {
        id: 'stage-rat',
        name: 'Stage Rat',
        hp: 25,
        gimmick: 'Straightforward attacker',
        passives: [],
        pattern: [
            { type: 'attack', value: 5, hits: 1 },
            { type: 'attack', value: 5, hits: 1 },
            { type: 'attack', value: 2, hits: 1, target: 'all' }
        ],
        speechBubbles: { attack: 'SQUEAK!', hurt: 'EEK!', defeated: '...squeak.' }
    },

    'rusty-knight': {
        id: 'rusty-knight',
        name: 'Rusty Knight',
        hp: 30,
        gimmick: 'Slow but armored',
        passives: [
            { id: 'rusty-armor', name: 'Rusty Armor', description: 'Starts with 3 Block' }
        ],
        pattern: [
            { type: 'block', value: 5 },
            { type: 'attack', value: 7, hits: 1 },
            { type: 'attack', value: 3, hits: 1, target: 'all' }
        ],
        speechBubbles: { attack: 'FOR... SOMETHING!', block: 'CLANK.', hurt: 'CLANG!', defeated: 'I RUST IN PEACE.' }
    },

    'moth-swarm': {
        id: 'moth-swarm',
        name: 'Moth Swarm',
        hp: 20,
        gimmick: 'Multi-hit attacks',
        passives: [
            { id: 'erratic', name: 'Erratic', description: 'Immune to Fear and Frustration' }
        ],
        pattern: [
            { type: 'attack', value: 2, hits: 3 },
            { type: 'attack', value: 1, hits: 2, target: 'all' },
            { type: 'attack', value: 2, hits: 3 }
        ],
        speechBubbles: { attack: 'bzz bzz bzz', hurt: 'SCATTER!', defeated: 'poof' }
    },

    'stagehand': {
        id: 'stagehand',
        name: 'Stagehand',
        hp: 25,
        gimmick: 'Gets stronger over time',
        passives: [
            { id: 'curtain-rigging', name: 'Curtain Rigging', description: 'Gains 1 Inspire each turn' }
        ],
        pattern: [
            { type: 'attack', value: 4, hits: 1 },
            { type: 'attack', value: 4, hits: 1 },
            { type: 'attack', value: 2, hits: 1, target: 'all' }
        ],
        speechBubbles: { attack: 'NOTHING PERSONAL.', buff: 'SETTING THE STAGE...', hurt: 'HEY!', defeated: 'I QUIT.' }
    },

    'the-critic': {
        id: 'the-critic',
        name: 'The Critic',
        hp: 45,
        gimmick: 'Debuffs and self-healing boss',
        isBoss: true,
        passives: [
            { id: 'scathing-pen', name: 'Scathing Pen', description: 'Heals 3 HP when inflicting a debuff' }
        ],
        phases: [
            {
                // Phase 1: above 50% HP
                pattern: [
                    { type: 'attack', value: 6, hits: 1 },
                    { type: 'debuff', value: 0,
                        actions: [
                            { type: 'inflict', keyword: 'forgetful', value: 2, target: 'randomProtagonist' }
                        ]
                    },
                    { type: 'attack', value: 3, hits: 1, target: 'all' }
                ]
            },
            {
                // Phase 2: below 50% HP
                hpThreshold: 0.5,
                transition: { block: 5 },
                pattern: [
                    { type: 'attack', value: 8, hits: 1 },
                    { type: 'debuff', value: 0,
                        actions: [
                            { type: 'inflict', keyword: 'vulnerable', value: 2, target: 'allAllies' }
                        ]
                    },
                    { type: 'attack', value: 5, hits: 2 }
                ]
            }
        ],
        speechBubbles: { attack: 'PATHETIC.', debuff: 'TWO STARS.', hurt: 'HMPH.', defeated: '...FINE. THREE STARS.' }
    },

    // =====================================
    // === ACT II — "Rising Action" ===
    // =====================================

    'phantom-understudy': {
        id: 'phantom-understudy',
        name: 'Phantom Understudy',
        hp: 35,
        gimmick: 'Heals and regenerates',
        passives: [
            { id: 'understudys-resilience', name: "Understudy's Resilience", description: 'Gains Regenerate 2 on first drop below 50% HP' }
        ],
        pattern: [
            { type: 'attack', value: 7, hits: 1 },
            { type: 'buff', value: 0,
                actions: [
                    { type: 'gain', keyword: 'regenerate', value: 2 },
                    { type: 'block', value: 4 }
                ]
            },
            { type: 'attack', value: 3, hits: 1, target: 'all' },
            { type: 'attack', value: 8, hits: 1 }
        ],
        speechBubbles: { attack: 'MY TURN NOW.', buff: 'I ENDURE.', hurt: 'NOT YET!', defeated: '...UNDERSTUDY DOWN.' }
    },

    'prop-master': {
        id: 'prop-master',
        name: 'Prop Master',
        hp: 40,
        gimmick: 'Heavy defenses and Weak',
        passives: [
            { id: 'stage-fortress', name: 'Stage Fortress', description: 'Block halves instead of fully resetting' }
        ],
        pattern: [
            { type: 'block', value: 8 },
            { type: 'attack', value: 6, hits: 1,
                actions: [
                    { type: 'attack', value: 6 },
                    { type: 'inflict', keyword: 'weak', value: 1, target: 'allAllies' }
                ]
            },
            { type: 'attack', value: 4, hits: 1, target: 'all' },
            { type: 'attack', value: 9, hits: 1 }
        ],
        speechBubbles: { attack: 'PLACES, EVERYONE.', block: 'BARRICADED.', hurt: 'CAREFUL!', defeated: 'PROPS DOWN.' }
    },

    'shadow-mimic': {
        id: 'shadow-mimic',
        name: 'Shadow Mimic',
        hp: 30,
        gimmick: 'AoE-heavy, punishes attacks',
        passives: [
            { id: 'mirror-spite', name: 'Mirror Spite', description: 'Inflicts 1 Burn on attacking protagonist' }
        ],
        pattern: [
            { type: 'attack', value: 4, hits: 1, target: 'all' },
            { type: 'attack', value: 3, hits: 1, target: 'all' },
            { type: 'attack', value: 7, hits: 1 }
        ],
        speechBubbles: { attack: 'MIRROR MIRROR...', hurt: 'SHATTER!', defeated: '...REFLECTED.' }
    },

    'spotlight-phantom': {
        id: 'spotlight-phantom',
        name: 'Spotlight Phantom',
        hp: 35,
        gimmick: 'Accuracy attacks, Fear/Frustration pressure',
        passives: [
            { id: 'blinding-light', name: 'Blinding Light', description: 'Attacks have Accuracy (bypass Taunt/Distract)' }
        ],
        pattern: [
            { type: 'attack', value: 6, hits: 1,
                actions: [
                    { type: 'attack', value: 6 },
                    { type: 'inflict', keyword: 'fear', value: 2, target: 'randomProtagonist' }
                ]
            },
            { type: 'attack', value: 3, hits: 1, target: 'all',
                actions: [
                    { type: 'attack', value: 3, target: 'all' },
                    { type: 'inflict', keyword: 'frustration', value: 1, target: 'randomProtagonist' }
                ]
            },
            { type: 'attack', value: 7, hits: 1 },
            { type: 'debuff', value: 0,
                actions: [
                    { type: 'inflict', keyword: 'burn', value: 2, target: 'allAllies' }
                ]
            }
        ],
        speechBubbles: { attack: 'BLINDING!', debuff: 'FEEL THE LIGHT.', hurt: 'DIMMING...', defeated: 'LIGHTS OUT.' }
    },

    'the-director': {
        id: 'the-director',
        name: 'The Director',
        hp: 60,
        gimmick: 'Complex debuff layering boss',
        isBoss: true,
        passives: [
            { id: 'casting-call', name: 'Casting Call', description: 'Random debuff on all allies at start of each phase' }
        ],
        phases: [
            {
                // Phase 1: above 50% HP
                pattern: [
                    { type: 'attack', value: 8, hits: 1 },
                    { type: 'debuff', value: 0,
                        actions: [
                            { type: 'inflict', keyword: 'forgetful', value: 2, target: 'protagonistA' },
                            { type: 'inflict', keyword: 'fear', value: 2, target: 'protagonistA' }
                        ]
                    },
                    { type: 'attack', value: 4, hits: 1, target: 'all' },
                    { type: 'attack', value: 6, hits: 2 }
                ]
            },
            {
                // Phase 2: below 50% HP
                hpThreshold: 0.5,
                transition: { clearDebuffs: true, block: 8 },
                pattern: [
                    { type: 'attack', value: 10, hits: 1 },
                    { type: 'debuff', value: 0,
                        actions: [
                            { type: 'inflict', keyword: 'confused', value: 2, target: 'allAllies' },
                            { type: 'gain', keyword: 'regenerate', value: 2 }
                        ]
                    },
                    { type: 'attack', value: 5, hits: 1, target: 'all' },
                    { type: 'attack', value: 7, hits: 1,
                        actions: [
                            { type: 'inflict', keyword: 'frustration', value: 2, target: 'protagonistB' },
                            { type: 'attack', value: 7 }
                        ]
                    }
                ]
            }
        ],
        speechBubbles: { attack: 'FROM THE TOP!', debuff: 'RECAST!', hurt: 'CUT!', defeated: "...THAT'S A WRAP." }
    },

    // ==================================
    // === ACT III — "The Climax" ===
    // ==================================

    'prima-donna': {
        id: 'prima-donna',
        name: 'Prima Donna',
        hp: 45,
        gimmick: 'DPS race with Retaliate',
        passives: [
            { id: 'dramatic-ego', name: 'Dramatic Ego', description: 'Permanent Retaliate 2. Gains 1 Inspire each turn.' }
        ],
        pattern: [
            { type: 'attack', value: 8, hits: 1 },
            { type: 'attack', value: 6, hits: 1,
                actions: [
                    { type: 'gain', keyword: 'shield', value: 4 },
                    { type: 'attack', value: 6 }
                ]
            },
            { type: 'attack', value: 5, hits: 1, target: 'all' },
            { type: 'attack', value: 7, hits: 2 }
        ],
        speechBubbles: { attack: 'THE SPOTLIGHT IS MINE!', buff: 'ADORE ME!', hurt: 'HOW DARE YOU!', defeated: '...ENCORE?' }
    },

    'comedy-tragedy-mask': {
        id: 'comedy-tragedy-mask',
        name: 'Comedy/Tragedy Mask',
        hp: 50,
        gimmick: 'Alternating states with different rules',
        passives: [
            { id: 'two-faces', name: 'Two Faces', description: 'Comedy: 50% reduced damage taken. Tragedy: immune to debuffs.' }
        ],
        pattern: [
            // Comedy turn
            { type: 'attack', value: 3, hits: 1, target: 'all',
                state: 'comedy',
                actions: [
                    { type: 'attack', value: 3, target: 'all' },
                    { type: 'heal', value: 5 }
                ]
            },
            // Tragedy turn
            { type: 'attack', value: 12, hits: 1,
                state: 'tragedy',
                actions: [
                    { type: 'attack', value: 12 },
                    { type: 'inflict', keyword: 'vulnerable', value: 2, target: 'allAllies' }
                ]
            }
        ],
        speechBubbles: { attack: 'HA HA HA!', hurt: 'SOB...', defeated: '...THE END.' }
    },

    'puppeteers-hand': {
        id: 'puppeteers-hand',
        name: "Puppeteer's Hand",
        hp: 40,
        gimmick: 'AoE-heavy debuff stacker',
        passives: [
            { id: 'tangled-strings', name: 'Tangled Strings', description: '+3 damage while any protagonist has 3+ debuff stacks' }
        ],
        pattern: [
            { type: 'attack', value: 4, hits: 1, target: 'all',
                actions: [
                    { type: 'inflict', keyword: 'fear', value: 2, target: 'randomProtagonist' },
                    { type: 'attack', value: 4, target: 'all' }
                ]
            },
            { type: 'attack', value: 4, hits: 1, target: 'all',
                actions: [
                    { type: 'inflict', keyword: 'burn', value: 1, target: 'allAllies' },
                    { type: 'inflict', keyword: 'poison', value: 1, target: 'allAllies' },
                    { type: 'attack', value: 4, target: 'all' }
                ]
            },
            { type: 'attack', value: 8, hits: 1 },
            { type: 'attack', value: 5, hits: 1, target: 'all',
                actions: [
                    { type: 'inflict', keyword: 'frustration', value: 2, target: 'randomProtagonist' },
                    { type: 'attack', value: 5, target: 'all' }
                ]
            }
        ],
        speechBubbles: { attack: 'DANCE, PUPPET!', debuff: 'TANGLED!', hurt: 'STRINGS CUT!', defeated: '...UNSTRUNG.' }
    },

    'fallen-curtain': {
        id: 'fallen-curtain',
        name: 'Fallen Curtain',
        hp: 50,
        gimmick: 'Defensive wall with Curse',
        passives: [
            { id: 'iron-curtain', name: 'Iron Curtain', description: 'Immune to Forgetful and Vulnerable' }
        ],
        pattern: [
            { type: 'block', value: 10,
                actions: [
                    { type: 'block', value: 10 },
                    { type: 'gain', keyword: 'regenerate', value: 1 }
                ]
            },
            { type: 'debuff', value: 8,
                actions: [
                    { type: 'inflict', keyword: 'curse', value: 8, target: 'macguffin' },
                    { type: 'block', value: 6 }
                ]
            },
            { type: 'attack', value: 4, hits: 1, target: 'all',
                actions: [
                    { type: 'attack', value: 4, target: 'all' },
                    { type: 'attackEqualBlock' }
                ]
            }
        ],
        speechBubbles: { attack: 'CRUSHING WEIGHT!', block: 'IMPENETRABLE.', debuff: 'CURSED!', hurt: 'CRACKING...', defeated: '...CURTAIN FALLS.' }
    },

    'the-playwright': {
        id: 'the-playwright',
        name: 'The Playwright',
        hp: 80,
        gimmick: 'Three-phase final boss',
        isBoss: true,
        passives: [
            { id: 'narrative-control', name: 'Narrative Control', description: '25% chance to clear a debuff each turn' }
        ],
        phases: [
            {
                // Phase 1 — "Act One" (80–54 HP, i.e. above 67.5%)
                pattern: [
                    { type: 'attack', value: 8, hits: 1 },
                    { type: 'debuff', value: 0,
                        actions: [
                            { type: 'inflict', keyword: 'forgetful', value: 2, target: 'bothProtagonists' }
                        ]
                    },
                    { type: 'attack', value: 4, hits: 1, target: 'all' },
                    { type: 'attack', value: 6, hits: 2,
                        actions: [
                            { type: 'attack', value: 6, hits: 2 },
                            { type: 'gain', keyword: 'regenerate', value: 2 }
                        ]
                    }
                ]
            },
            {
                // Phase 2 — "Plot Twist" (53–27 HP, i.e. below 67.5%)
                hpThreshold: 0.675,
                transition: { clearDebuffs: true, block: 10, retaliate: 2 },
                pattern: [
                    { type: 'attack', value: 12, hits: 1 },
                    { type: 'debuff', value: 0,
                        actions: [
                            { type: 'inflict', keyword: 'fear', value: 2, target: 'protagonistA' },
                            { type: 'inflict', keyword: 'frustration', value: 2, target: 'protagonistB' }
                        ]
                    },
                    { type: 'attack', value: 5, hits: 1, target: 'all',
                        actions: [
                            { type: 'attack', value: 5, target: 'all' },
                            { type: 'inflict', keyword: 'burn', value: 1, target: 'allAllies' }
                        ]
                    },
                    { type: 'attack', value: 8, hits: 2 }
                ]
            },
            {
                // Phase 3 — "The Final Page" (<27 HP, i.e. below 33.75%)
                hpThreshold: 0.3375,
                transition: { clearDebuffs: true, inspire: 3, loseRetaliate: true },
                pattern: [
                    { type: 'attack', value: 14, hits: 1 },
                    { type: 'attack', value: 6, hits: 1, target: 'all',
                        actions: [
                            { type: 'inflict', keyword: 'vulnerable', value: 2, target: 'allAllies' },
                            { type: 'attack', value: 6, target: 'all' }
                        ]
                    },
                    { type: 'attack', value: 10, hits: 2,
                        actions: [
                            { type: 'attack', value: 10, hits: 2 },
                            { type: 'heal', value: 8 }
                        ]
                    },
                    { type: 'attack', value: 5, hits: 1, target: 'all',
                        actions: [
                            { type: 'inflict', keyword: 'burn', value: 2, target: 'allAllies' },
                            { type: 'inflict', keyword: 'poison', value: 2, target: 'allAllies' },
                            { type: 'attack', value: 5, target: 'all' }
                        ]
                    }
                ]
            }
        ],
        speechBubbles: { attack: 'THE STORY DEMANDS IT!', debuff: 'PLOT TWIST!', buff: 'REWRITE!', hurt: 'IMPROV!', defeated: '...FIN.' }
    }
};

// === Act Structure ===
const ACT_STRUCTURE = {
    1: {
        name: 'The Opening',
        scenes: [
            { enemies: ['stage-rat', 'rusty-knight'] },
            { enemies: ['moth-swarm', 'stagehand'] }
        ],
        boss: 'the-critic'
    },
    2: {
        name: 'Rising Action',
        scenes: [
            { enemies: ['phantom-understudy', 'prop-master'] },
            { enemies: ['shadow-mimic', 'spotlight-phantom'] }
        ],
        boss: 'the-director'
    },
    3: {
        name: 'The Climax',
        scenes: [
            { enemies: ['prima-donna', 'comedy-tragedy-mask'] },
            { enemies: ['puppeteers-hand', 'fallen-curtain'] }
        ],
        boss: 'the-playwright'
    }
};
