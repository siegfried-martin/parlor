/**
 * Curtain Call — v2 Card Definitions, Pools & Keywords
 *
 * All card data, reward pools, starting deck composition,
 * and keyword glossary for the v2 system.
 *
 * Card types: 'attack', 'defense', 'action'
 * Rarities: 'basic', 'uncommon', 'rare'
 * Owners: 'aldric', 'pip', 'macguffin'
 */

'use strict';

// === Card Definitions (v2) ===
const CARD_DEFINITIONS = {

    // =====================
    // === Basic Cards ===
    // =====================

    // --- Aldric Basics ---
    'galvanize': {
        id: 'galvanize',
        name: 'Galvanize',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        description: 'Deal 3 damage. Gain 1 Taunt.',
        owner: 'aldric',
        speechBubble: 'RALLY!',
        effects: [
            { type: 'damage', value: 3 },
            { type: 'taunt', value: 1 }
        ]
    },
    'bulwark': {
        id: 'bulwark',
        name: 'Bulwark',
        cost: 1,
        type: 'defense',
        rarity: 'basic',
        description: 'Gain 5 Block and 1 Retaliate.',
        owner: 'aldric',
        speechBubble: 'STAND FIRM!',
        effects: [
            { type: 'block', value: 5 },
            { type: 'retaliate', value: 1 }
        ]
    },

    // --- Pip Basics ---
    'quick-jab': {
        id: 'quick-jab',
        name: 'Quick Jab',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        description: 'Inflict 2 random debuff. Deal 2 per unique debuff on enemy.',
        owner: 'pip',
        speechBubble: 'THWIP!',
        effects: [
            { type: 'inflictRandomDebuff', value: 2 },
            { type: 'damagePerDebuff', base: 0, perDebuff: 2 }
        ]
    },
    'lucky-shot': {
        id: 'lucky-shot',
        name: 'Lucky Shot',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        description: 'Deal 3 damage. Gain 2 Luck.',
        owner: 'pip',
        speechBubble: 'FEELING LUCKY!',
        effects: [
            { type: 'damage', value: 3 },
            { type: 'luck', value: 2 }
        ]
    },

    // --- MacGuffin Basics ---
    'block': {
        id: 'block',
        name: 'Block',
        cost: 0,
        type: 'defense',
        rarity: 'basic',
        description: 'Gain 3 Block.',
        owner: 'macguffin',
        speechBubble: 'BRACE!',
        effects: [{ type: 'block', value: 3 }]
    },
    'inspire': {
        id: 'inspire',
        name: 'Inspire',
        cost: 0,
        type: 'action',
        rarity: 'basic',
        description: 'Gain 1 Inspire.',
        owner: 'macguffin',
        speechBubble: 'TOGETHER!',
        effects: [{ type: 'inspire', value: 1 }]
    },

    // ===========================
    // === Aldric Pool (12) ===
    // ===========================

    'aegis': {
        id: 'aegis',
        name: 'Aegis',
        cost: 1,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 5 Block. Draw 1 card.',
        owner: 'aldric',
        speechBubble: 'SHIELD UP!',
        effects: [
            { type: 'block', value: 5 },
            { type: 'draw', value: 1 }
        ]
    },
    'burning-devotion': {
        id: 'burning-devotion',
        name: 'Burning Devotion',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 15 damage. Gain 2 Burn.',
        owner: 'aldric',
        speechBubble: 'FOR GLORY!',
        effects: [
            { type: 'damage', value: 15 },
            { type: 'selfInflict', keyword: 'burn', value: 2 }
        ]
    },
    'cooperative-strike': {
        id: 'cooperative-strike',
        name: 'Cooperative Strike',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 8 damage. Attack cards in hand from the other protagonist gain +4 attack.',
        owner: 'aldric',
        speechBubble: 'TOGETHER!',
        effects: [
            { type: 'damage', value: 8 },
            { type: 'buffOtherProtagonistAttacks', value: 4 }
        ]
    },
    'protective-stance': {
        id: 'protective-stance',
        name: 'Protective Stance',
        cost: 1,
        type: 'action',
        rarity: 'uncommon',
        description: 'Gain Taunt equal to Ovation. Gain Shield equal to Ovation.',
        owner: 'aldric',
        speechBubble: 'COME AT ME!',
        effects: [
            { type: 'fromOvation', keyword: 'taunt' },
            { type: 'fromOvation', keyword: 'shield' }
        ]
    },
    'protect': {
        id: 'protect',
        name: 'Protect',
        cost: 0,
        type: 'action',
        rarity: 'uncommon',
        description: 'Gain 3 Block and 3 Shield to target protagonist.',
        owner: 'aldric',
        speechBubble: 'I PROTECT!',
        targeting: 'protagonist',
        effects: [
            { type: 'block', value: 3 },
            { type: 'shield', value: 3 }
        ]
    },
    'iron-wall': {
        id: 'iron-wall',
        name: 'Iron Wall',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 10 Block. Gain 1 Fortify.',
        owner: 'aldric',
        speechBubble: 'NOTHING GETS THROUGH!',
        effects: [
            { type: 'block', value: 10 },
            { type: 'fortify', value: 1 }
        ]
    },
    'true-strike': {
        id: 'true-strike',
        name: 'True Strike',
        cost: 1,
        type: 'action',
        rarity: 'uncommon',
        description: 'Target protagonist gains 2 Piercing and 2 Focus.',
        owner: 'aldric',
        speechBubble: 'PRECISION!',
        targeting: 'protagonist',
        effects: [
            { type: 'piercing', value: 2 },
            { type: 'focus', value: 2 }
        ]
    },
    'inspirational-shout': {
        id: 'inspirational-shout',
        name: 'Inspirational Shout',
        cost: 1,
        type: 'action',
        rarity: 'uncommon',
        description: 'Convert Ovation to Inspire.',
        owner: 'aldric',
        speechBubble: 'FIGHT ON!',
        effects: [
            { type: 'convertOvation', to: 'inspire' }
        ]
    },
    'cleanse': {
        id: 'cleanse',
        name: 'Cleanse',
        cost: 1,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 5 Block. Remove all Burn and Poison from target.',
        owner: 'aldric',
        speechBubble: 'PURIFIED!',
        targeting: 'ally',
        effects: [
            { type: 'block', value: 5 },
            { type: 'cleanseBurnPoison' }
        ]
    },
    'aggressive-strike': {
        id: 'aggressive-strike',
        name: 'Aggressive Strike',
        cost: 3,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 20 damage. Inflict 1 Heckled.',
        owner: 'aldric',
        speechBubble: 'SILENCE!',
        effects: [
            { type: 'damage', value: 20 },
            { type: 'inflict', keyword: 'heckled', value: 1 }
        ]
    },
    'captivating-strike': {
        id: 'captivating-strike',
        name: 'Captivating Strike',
        cost: 1,
        type: 'attack',
        rarity: 'rare',
        description: 'Deal 2 damage. Gain 1 Ovation per damage dealt to target.',
        owner: 'aldric',
        speechBubble: 'WATCH THIS!',
        captivating: true,
        effects: [
            { type: 'damage', value: 2 }
        ]
    },
    'heated-resistance': {
        id: 'heated-resistance',
        name: 'Heated Resistance',
        cost: 1,
        type: 'defense',
        rarity: 'rare',
        description: 'Gain 5 Block. Inflict 5 Burn.',
        owner: 'aldric',
        speechBubble: 'BURN BRIGHT!',
        effects: [
            { type: 'block', value: 5 },
            { type: 'inflict', keyword: 'burn', value: 5 }
        ]
    },

    // =======================
    // === Pip Pool (12) ===
    // =======================

    'good-fortune': {
        id: 'good-fortune',
        name: 'Good Fortune',
        cost: 1,
        type: 'action',
        rarity: 'uncommon',
        description: 'Convert Ovation to Luck.',
        owner: 'pip',
        speechBubble: 'LUCKY ME!',
        effects: [
            { type: 'convertOvation', to: 'luck' }
        ]
    },
    'create-opportunity': {
        id: 'create-opportunity',
        name: 'Create Opportunity',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 3 damage. Reduce cost of a random card in hand by 1.',
        owner: 'pip',
        speechBubble: 'HERE WE GO!',
        effects: [
            { type: 'damage', value: 3 },
            { type: 'reduceCostRandom', amount: 1 }
        ]
    },
    'loaded-insult': {
        id: 'loaded-insult',
        name: 'Loaded Insult',
        cost: 1,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 1 Taunt, 1 Distract, and 2 Shield.',
        owner: 'pip',
        speechBubble: 'HEY UGLY!',
        effects: [
            { type: 'taunt', value: 1 },
            { type: 'distract', value: 1 },
            { type: 'shield', value: 2 }
        ]
    },
    'coup-de-grace': {
        id: 'coup-de-grace',
        name: 'Coup de Grace',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 5 + [Ovation x 2] damage.',
        owner: 'pip',
        speechBubble: 'FINISHING BLOW!',
        effects: [
            { type: 'damageFromOvation', base: 5, multiplier: 2 }
        ]
    },
    'pips-cocktail': {
        id: 'pips-cocktail',
        name: "Pip's Cocktail",
        cost: 0,
        type: 'action',
        rarity: 'uncommon',
        description: 'Inflict 2 Poison and 2 Burn.',
        owner: 'pip',
        speechBubble: 'DRINK UP!',
        effects: [
            { type: 'inflict', keyword: 'poison', value: 2 },
            { type: 'inflict', keyword: 'burn', value: 2 }
        ]
    },
    'annoying-poke': {
        id: 'annoying-poke',
        name: 'Annoying Poke',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 2 damage. Inflict 1 Frustration. Gain 1 Distract.',
        owner: 'pip',
        speechBubble: '*POKE*',
        effects: [
            { type: 'damage', value: 2 },
            { type: 'inflict', keyword: 'frustration', value: 1 },
            { type: 'distract', value: 1 }
        ]
    },
    'stylish-dance': {
        id: 'stylish-dance',
        name: 'Stylish Dance',
        cost: 2,
        type: 'action',
        rarity: 'uncommon',
        description: 'Lose all Ovation. Inflict Stage Fright. Gain 1 Energy.',
        owner: 'pip',
        speechBubble: 'DANCE BREAK!',
        effects: [
            { type: 'loseAllOvation' },
            { type: 'inflict', keyword: 'stageFright', value: 1 },
            { type: 'energy', value: 1 }
        ]
    },
    'hit-where-it-hurts': {
        id: 'hit-where-it-hurts',
        name: 'Hit Where It Hurts',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 3 damage. Inflict 2 Vulnerable.',
        owner: 'pip',
        speechBubble: 'GOTCHA!',
        effects: [
            { type: 'damage', value: 3 },
            { type: 'inflict', keyword: 'vulnerable', value: 2 }
        ]
    },
    'vex': {
        id: 'vex',
        name: 'Vex',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 2 Taunt and 2 Shield. Inflict 2 Frustration and 1 Forgetful.',
        owner: 'pip',
        speechBubble: 'OVER HERE!',
        effects: [
            { type: 'taunt', value: 2 },
            { type: 'shield', value: 2 },
            { type: 'inflict', keyword: 'frustration', value: 2 },
            { type: 'inflict', keyword: 'forgetful', value: 1 }
        ]
    },
    'best-explanation': {
        id: 'best-explanation',
        name: 'Best Explanation',
        cost: 1,
        type: 'action',
        rarity: 'uncommon',
        description: 'Inflict 2 Confused and 2 Forgetful.',
        owner: 'pip',
        speechBubble: 'CONFUSING, RIGHT?',
        effects: [
            { type: 'inflict', keyword: 'confused', value: 2 },
            { type: 'inflict', keyword: 'forgetful', value: 2 }
        ]
    },
    'ultimate-jeer': {
        id: 'ultimate-jeer',
        name: 'Ultimate Jeer',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        description: 'Deal [Ovation] damage. Gain [Ovation] Taunt. Inflict [Ovation] Frustration.',
        owner: 'pip',
        speechBubble: 'IS THAT ALL?!',
        effects: [
            { type: 'damageFromOvation', base: 0, multiplier: 1 },
            { type: 'fromOvation', keyword: 'taunt' },
            { type: 'inflictFromOvation', keyword: 'frustration' }
        ]
    },
    'flirtatious-jeer': {
        id: 'flirtatious-jeer',
        name: 'Flirtatious Jeer',
        cost: 1,
        type: 'action',
        rarity: 'rare',
        description: 'Inflict 2 Weak, 2 Confused, and 2 Forgetful.',
        owner: 'pip',
        speechBubble: 'CHARMED!',
        effects: [
            { type: 'inflict', keyword: 'weak', value: 2 },
            { type: 'inflict', keyword: 'confused', value: 2 },
            { type: 'inflict', keyword: 'forgetful', value: 2 }
        ]
    },

    // ===================================
    // === Synergy Accelerator Cards ===
    // ===================================

    // --- Aldric Synergy ---
    'battle-hymn': {
        id: 'battle-hymn',
        name: 'Battle Hymn',
        cost: 1,
        type: 'action',
        rarity: 'uncommon',
        description: 'Gain 1 Inspire and 1 Fortify.',
        owner: 'aldric',
        speechBubble: 'SING WITH ME!',
        effects: [
            { type: 'inspire', value: 1 },
            { type: 'fortify', value: 1 }
        ]
    },
    'shield-bash': {
        id: 'shield-bash',
        name: 'Shield Bash',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 6 damage twice.',
        owner: 'aldric',
        speechBubble: 'DOUBLE STRIKE!',
        effects: [
            { type: 'damage', value: 6 },
            { type: 'damage', value: 6 }
        ]
    },
    'stand-guard': {
        id: 'stand-guard',
        name: 'Stand Guard',
        cost: 0,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 3 Block. Gain 1 Fortify.',
        owner: 'aldric',
        speechBubble: 'ON GUARD!',
        effects: [
            { type: 'block', value: 3 },
            { type: 'fortify', value: 1 }
        ]
    },
    'stalwart': {
        id: 'stalwart',
        name: 'Stalwart',
        cost: 1,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 2 Taunt and 4 Shield.',
        owner: 'aldric',
        speechBubble: 'HOLD THE LINE!',
        effects: [
            { type: 'taunt', value: 2 },
            { type: 'shield', value: 4 }
        ]
    },

    // --- Pip Synergy ---
    'quick-draw': {
        id: 'quick-draw',
        name: 'Quick Draw',
        cost: 1,
        type: 'action',
        rarity: 'uncommon',
        description: 'Draw 2 cards. Gain 1 Luck.',
        owner: 'pip',
        speechBubble: 'FAST HANDS!',
        effects: [
            { type: 'draw', value: 2 },
            { type: 'luck', value: 1 }
        ]
    },
    'pepper-spray': {
        id: 'pepper-spray',
        name: 'Pepper Spray',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 2 damage 3 times. Inflict 1 Burn.',
        owner: 'pip',
        speechBubble: 'TAKE THAT! AND THAT!',
        effects: [
            { type: 'damage', value: 2 },
            { type: 'damage', value: 2 },
            { type: 'damage', value: 2 },
            { type: 'inflict', keyword: 'burn', value: 1 }
        ]
    },
    'mischief': {
        id: 'mischief',
        name: 'Mischief',
        cost: 0,
        type: 'action',
        rarity: 'uncommon',
        description: 'Inflict 1 Vulnerable. Draw 1 card.',
        owner: 'pip',
        speechBubble: 'OOPS!',
        effects: [
            { type: 'inflict', keyword: 'vulnerable', value: 1 },
            { type: 'draw', value: 1 }
        ]
    },
    'twist-the-knife': {
        id: 'twist-the-knife',
        name: 'Twist the Knife',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 1 damage per total debuff stack on enemy.',
        owner: 'pip',
        speechBubble: 'FEEL THAT?',
        effects: [
            { type: 'damagePerTotalDebuff', perStack: 1 }
        ]
    },

    // =============================
    // === Enchantment Cards ===
    // =============================

    // --- Aldric Enchantments ---
    'dramatic-lighting': {
        id: 'dramatic-lighting',
        name: 'Dramatic Lighting',
        cost: 1,
        type: 'enchantment',
        rarity: 'uncommon',
        description: 'At end of turn, double your Retaliate stacks.',
        owner: 'aldric',
        speechBubble: 'SET THE SCENE!',
        effects: []
    },
    'fortress-scene': {
        id: 'fortress-scene',
        name: 'Fortress Scene',
        cost: 2,
        type: 'enchantment',
        rarity: 'uncommon',
        description: 'At end of turn, gain Shield equal to your Taunt stacks.',
        owner: 'aldric',
        speechBubble: 'HOLD FAST!',
        effects: []
    },
    'curtain-of-iron': {
        id: 'curtain-of-iron',
        name: 'Curtain of Iron',
        cost: 1,
        type: 'enchantment',
        rarity: 'uncommon',
        description: 'Whenever you gain Block, gain 1 Ovation.',
        owner: 'aldric',
        speechBubble: 'THE CROWD ROARS!',
        effects: []
    },
    'war-drums': {
        id: 'war-drums',
        name: 'War Drums',
        cost: 2,
        type: 'enchantment',
        rarity: 'rare',
        description: 'At the start of your turn, gain 1 Fortify and 1 Retaliate.',
        owner: 'aldric',
        speechBubble: 'THE BEAT RISES!',
        effects: []
    },

    // --- Pip Enchantments ---
    'comic-relief': {
        id: 'comic-relief',
        name: 'Comic Relief',
        cost: 1,
        type: 'enchantment',
        rarity: 'uncommon',
        description: 'Whenever you inflict a debuff on the enemy, gain 1 Luck.',
        owner: 'pip',
        speechBubble: 'HA HA HA!',
        effects: []
    },
    'plot-twist': {
        id: 'plot-twist',
        name: 'Plot Twist',
        cost: 2,
        type: 'enchantment',
        rarity: 'rare',
        description: 'At the end of the enemy\'s turn, deal damage equal to their Frustrated stacks.',
        owner: 'pip',
        speechBubble: 'DIDN\'T SEE THAT COMING!',
        effects: []
    },
    'encore': {
        id: 'encore',
        name: 'Encore',
        cost: 1,
        type: 'enchantment',
        rarity: 'uncommon',
        description: 'Whenever you play your 3rd card in a turn, gain 1 Ovation and draw 1 card.',
        owner: 'pip',
        speechBubble: 'ONE MORE TIME!',
        effects: []
    },
    'smoke-and-mirrors': {
        id: 'smoke-and-mirrors',
        name: 'Smoke and Mirrors',
        cost: 1,
        type: 'enchantment',
        rarity: 'rare',
        description: 'At the end of your turn, gain Distract equal to unique debuff types on the enemy.',
        owner: 'pip',
        speechBubble: 'NOW YOU SEE ME...',
        effects: []
    }
};

// Card pools for rewards (by protagonist + rarity)
const CARD_POOLS = {
    aldric: [
        'aegis', 'burning-devotion', 'cooperative-strike', 'protective-stance',
        'protect', 'iron-wall', 'true-strike', 'inspirational-shout',
        'cleanse', 'aggressive-strike', 'captivating-strike', 'heated-resistance',
        'battle-hymn', 'shield-bash', 'stand-guard', 'stalwart',
        'dramatic-lighting', 'fortress-scene', 'curtain-of-iron', 'war-drums'
    ],
    pip: [
        'good-fortune', 'create-opportunity', 'loaded-insult', 'coup-de-grace',
        'pips-cocktail', 'annoying-poke', 'stylish-dance', 'hit-where-it-hurts',
        'vex', 'best-explanation', 'ultimate-jeer', 'flirtatious-jeer',
        'quick-draw', 'pepper-spray', 'mischief', 'twist-the-knife',
        'comic-relief', 'plot-twist', 'encore', 'smoke-and-mirrors'
    ]
};

// Pools split by rarity for reward selection
const CARD_POOLS_BY_RARITY = {
    aldric: {
        uncommon: [
            'aegis', 'burning-devotion', 'cooperative-strike', 'protective-stance',
            'protect', 'iron-wall', 'true-strike', 'inspirational-shout',
            'cleanse', 'aggressive-strike',
            'battle-hymn', 'shield-bash', 'stand-guard', 'stalwart',
            'dramatic-lighting', 'fortress-scene', 'curtain-of-iron'
        ],
        rare: ['captivating-strike', 'heated-resistance', 'war-drums']
    },
    pip: {
        uncommon: [
            'good-fortune', 'create-opportunity', 'loaded-insult', 'coup-de-grace',
            'pips-cocktail', 'annoying-poke', 'stylish-dance', 'hit-where-it-hurts',
            'vex', 'best-explanation',
            'quick-draw', 'pepper-spray', 'mischief', 'twist-the-knife',
            'comic-relief', 'encore'
        ],
        rare: ['ultimate-jeer', 'flirtatious-jeer', 'plot-twist', 'smoke-and-mirrors']
    }
};

// Starting deck options per protagonist
const BASIC_OPTIONS = {
    aldric: ['galvanize', 'bulwark'],
    pip: ['quick-jab', 'lucky-shot']
};

// Default starting deck (Galvanize + Quick Jab)
const STARTING_DECK = [
    'galvanize', 'galvanize', 'galvanize',
    'quick-jab', 'quick-jab', 'quick-jab',
    'block', 'block',
    'inspire'
];

// Build a starting deck from chosen basics
function buildStartingDeck(aldricBasic, pipBasic) {
    return [
        aldricBasic, aldricBasic, aldricBasic,
        pipBasic, pipBasic, pipBasic,
        'block', 'block',
        'inspire'
    ];
}

// === Keyword Glossary (v2) ===
const KEYWORD_GLOSSARY = {
    // Positive keywords
    block: {
        name: 'Block',
        icon: '🛡️',
        explanation: 'Absorbs damage to the MacGuffin only. Resets at start of turn.',
        hints: [
            "Block protects the MacGuffin!",
            "Use Shield to protect protagonists!",
            "Block resets each turn — use it or lose it!"
        ]
    },
    distract: {
        name: 'Distract',
        icon: '🌀',
        explanation: 'Negate one attack per stack, including all AoE targets. Resets at start of turn.',
        hints: [
            "Distract blocks an entire attack, even AoE!",
            "Great against multi-hit attacks!",
            "One Distract negates one hit for everyone!"
        ]
    },
    taunt: {
        name: 'Taunt',
        icon: '🎯',
        explanation: 'Redirect a hit to this protagonist. Resets at start of turn.',
        hints: [
            "Taunt redirects enemy attacks to the taunting hero!",
            "Use Taunt to protect the MacGuffin!",
            "Protagonist HP is renewable — MacGuffin HP isn't!"
        ]
    },
    shield: {
        name: 'Shield',
        icon: '🛡',
        explanation: 'Protagonist-specific damage reduction. Resets at start of turn.',
        hints: [
            "Shield only protects that specific protagonist!",
            "Shield absorbs before Block does!",
            "Pair Shield with Taunt for best protection!"
        ]
    },
    regenerate: {
        name: 'Regenerate',
        icon: '💚',
        explanation: 'Heal at start of turn. Decays by 1 each turn.',
        hints: [
            "Regenerate heals over multiple turns!",
            "Poison reduces Regenerate healing!",
            "Regenerate 3 heals 3, then 2, then 1 — 6 total!"
        ]
    },
    retaliate: {
        name: 'Retaliate',
        icon: '⚡',
        explanation: 'Deal damage back to attacker per hit. Resets at start of turn.',
        hints: [
            "Retaliate punishes every enemy hit!",
            "Enemies with Accuracy bypass Retaliate!",
            "Great against multi-hit attacks!"
        ]
    },
    inspire: {
        name: 'Inspire',
        icon: '✨',
        explanation: 'Permanent +1 damage per stack on all attacks.',
        hints: [
            "Inspire is permanent — it never goes away!",
            "Playing Inspire early pays off all fight!",
            "All attacks deal +1 per Inspire stack!"
        ]
    },
    fortify: {
        name: 'Fortify',
        icon: '🏰',
        explanation: '+1 bonus Block per stack when gaining Block. Decays by 1.',
        hints: [
            "Fortify makes Block cards better!",
            "Fortify 3 + Block 3 card = 6 Block!",
            "Fortify decays by 1 each turn."
        ]
    },
    piercing: {
        name: 'Piercing',
        icon: '🗡️',
        explanation: 'Attacks bypass Block and Shield. Decays by 1.',
        hints: [
            "Piercing goes right through enemy Block!",
            "Use Piercing against defensive enemies!",
            "Piercing doesn't bypass Taunt or Distract!"
        ]
    },
    focus: {
        name: 'Focus',
        icon: '🎯',
        explanation: 'Attacks bypass Taunt/Distract and ignore Retaliate. Decays by 1.',
        hints: [
            "Focus bypasses evasion defenses!",
            "Focus doesn't bypass Block or Shield!",
            "Complementary to Piercing!"
        ]
    },
    ward: {
        name: 'Ward',
        icon: '🔮',
        explanation: 'Negate one incoming debuff. Permanent until consumed.',
        hints: [
            "Ward blocks debuffs, not damage!",
            "Each Ward stack negates one debuff!",
            "Ward never expires on its own!"
        ]
    },
    luck: {
        name: 'Luck',
        icon: '🍀',
        explanation: '10% chance per stack for 1.5x damage. Permanent.',
        hints: [
            "Luck gives a chance for bonus damage!",
            "At 10 stacks, it's basically guaranteed!",
            "Pip's signature keyword!"
        ]
    },
    flourish: {
        name: 'Flourish',
        icon: '🌟',
        explanation: 'Double all Ovation gains and losses. Resets at start of turn.',
        hints: [
            "Flourish is high risk, high reward!",
            "Doubles both Ovation gains AND losses!",
            "Build Ovation fast — or lose it fast!"
        ]
    },
    ovation: {
        name: 'Ovation',
        icon: '👏',
        explanation: 'Crowd meter (0-5). +1 per hit dealt, -1 per turn. Bonus damage at 2+.',
        hints: [
            "Hit enemies to build Ovation!",
            "Ovation 2-4 = +1 damage. Ovation 5 = +2!",
            "Ovation decays every turn — keep attacking!"
        ]
    },

    // Negative keywords
    poison: {
        name: 'Poison',
        icon: '☠️',
        explanation: '1 damage per stack at turn start. Suppresses healing. Decays by 1.',
        hints: [
            "Poison deals damage AND stops healing!",
            "Use Poison against enemies that heal!",
            "Cleanse removes Poison!"
        ]
    },
    burn: {
        name: 'Burn',
        icon: '🔥',
        explanation: '1 damage per stack at turn start. Decays by 1.',
        hints: [
            "Burn is pure damage over time!",
            "Burn 5 = 5+4+3+2+1 = 15 total damage!",
            "Cleanse removes Burn!"
        ]
    },
    stageFright: {
        name: 'Stage Fright',
        icon: '😰',
        explanation: 'Cannot play Attack cards. Decays by 1.',
        hints: [
            "Stage Fright locks out all attacks!",
            "Can be produced by Fear reaching 5!",
            "Wait it out or use Ward to prevent it!"
        ]
    },
    heckled: {
        name: 'Heckled',
        icon: '🗣️',
        explanation: 'Cannot play non-Attack cards. Decays by 1.',
        hints: [
            "Heckled forces attack-only play!",
            "Can be produced by Frustration reaching 5!",
            "No Defense or Action cards allowed!"
        ]
    },
    forgetful: {
        name: 'Forgetful',
        icon: '💫',
        explanation: '50% decreased damage dealt. Decays by 1.',
        hints: [
            "Forgetful halves all damage!",
            "Very harsh — try to wait it out!",
            "Applied by The Critic and others!"
        ]
    },
    vulnerable: {
        name: 'Vulnerable',
        icon: '💔',
        explanation: '50% increased damage taken. Decays by 1.',
        hints: [
            "Vulnerable means taking 50% more damage!",
            "Use it on enemies to burst them down!",
            "Very dangerous on protagonists!"
        ]
    },
    weak: {
        name: 'Weak',
        icon: '💪',
        explanation: '50% reduced Block/Shield generation. Decays by 1.',
        hints: [
            "Weak cuts Block and Shield gains in half!",
            "Devastating against defensive enemies!",
            "Global effect — affects all Block/Shield!"
        ]
    },
    confused: {
        name: 'Confused',
        icon: '❓',
        explanation: '50% chance Distract/Taunt/Retaliate fails. Decays by 1.',
        hints: [
            "Confused disrupts binary defenses!",
            "Taunt, Distract, Retaliate may not trigger!",
            "Counter to evasion-based strategies!"
        ]
    },
    curse: {
        name: 'Curse',
        icon: '💀',
        explanation: 'Deal Curse damage at end of turn (through Shield/Block). Consumed.',
        hints: [
            "Curse is delayed burst damage!",
            "Block and Shield can reduce it!",
            "One-shot — triggers once then gone!"
        ]
    },
    fear: {
        name: 'Fear',
        icon: '😱',
        explanation: 'Permanent. Converts to Stage Fright at 5 stacks, resets to 0.',
        hints: [
            "Fear builds slowly toward Stage Fright!",
            "At 5 Fear, get 1 turn of Stage Fright!",
            "Ward can negate Fear applications!"
        ]
    },
    frustration: {
        name: 'Frustration',
        icon: '😤',
        explanation: 'Permanent. Converts to Heckled at 5 stacks, resets to 0.',
        hints: [
            "Frustration builds toward Heckled!",
            "At 5 Frustration, get 1 turn of Heckled!",
            "Pip's signature pressure mechanic!"
        ]
    },

    // Card type keywords
    enchantment: {
        name: 'Enchantment',
        icon: '✧',
        explanation: 'Persistent effect that lasts the entire combat. Removed when combat ends.',
        hints: [
            "Enchantments stay active all combat!",
            "Play them early for maximum value!",
            "They don't go to the discard pile!"
        ]
    }
};
