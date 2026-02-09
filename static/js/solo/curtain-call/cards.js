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
        description: 'Deal 3 damage. Heal each protagonist by 1.',
        owner: 'aldric',
        speechBubble: 'RALLY!',
        effects: [
            { type: 'damage', value: 3 },
            { type: 'healProtagonists', value: 1 }
        ]
    },
    'bulwark': {
        id: 'bulwark',
        name: 'Bulwark',
        cost: 2,
        type: 'attack',
        rarity: 'basic',
        description: 'Deal 5 damage. Reduce the cost of Defense cards in hand by 1.',
        owner: 'aldric',
        speechBubble: 'STAND FIRM!',
        effects: [
            { type: 'damage', value: 5 },
            { type: 'reduceCostType', cardType: 'defense', amount: 1 }
        ]
    },

    // --- Pip Basics ---
    'quick-jab': {
        id: 'quick-jab',
        name: 'Quick Jab',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        description: 'Deal 2 damage + 2 per unique debuff on enemy.',
        owner: 'pip',
        speechBubble: 'THWIP!',
        effects: [
            { type: 'damagePerDebuff', base: 2, perDebuff: 2 }
        ]
    },
    'lucky-shot': {
        id: 'lucky-shot',
        name: 'Lucky Shot',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        description: 'Deal 3 damage. Gain 1 Luck.',
        owner: 'pip',
        speechBubble: 'FEELING LUCKY!',
        effects: [
            { type: 'damage', value: 3 },
            { type: 'luck', value: 1 }
        ]
    },

    // --- MacGuffin Basics ---
    'block': {
        id: 'block',
        name: 'Block',
        cost: 1,
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
        cost: 1,
        type: 'action',
        rarity: 'basic',
        description: 'Gain 2 Inspire.',
        owner: 'macguffin',
        speechBubble: 'TOGETHER!',
        effects: [{ type: 'inspire', value: 2 }]
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
        description: 'Gain 4 Block. Draw 1 card.',
        owner: 'aldric',
        speechBubble: 'SHIELD UP!',
        effects: [
            { type: 'block', value: 4 },
            { type: 'draw', value: 1 }
        ]
    },
    'burning-devotion': {
        id: 'burning-devotion',
        name: 'Burning Devotion',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 12 damage. Gain 1 Burn.',
        owner: 'aldric',
        speechBubble: 'FOR GLORY!',
        effects: [
            { type: 'damage', value: 12 },
            { type: 'selfInflict', keyword: 'burn', value: 1 }
        ]
    },
    'enabling-strike': {
        id: 'enabling-strike',
        name: 'Enabling Strike',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 8 damage. Draw 1 card.',
        owner: 'aldric',
        speechBubble: 'OPENING!',
        effects: [
            { type: 'damage', value: 8 },
            { type: 'draw', value: 1 }
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
        description: 'Gain 2 Shield.',
        owner: 'aldric',
        speechBubble: 'I PROTECT!',
        targeting: 'protagonist',
        effects: [
            { type: 'shield', value: 2 }
        ]
    },
    'iron-wall': {
        id: 'iron-wall',
        name: 'Iron Wall',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 10 Block.',
        owner: 'aldric',
        speechBubble: 'NOTHING GETS THROUGH!',
        effects: [{ type: 'block', value: 10 }]
    },
    'true-strike': {
        id: 'true-strike',
        name: 'True Strike',
        cost: 1,
        type: 'action',
        rarity: 'uncommon',
        description: 'Gain 1 Piercing and 1 Accuracy.',
        owner: 'aldric',
        speechBubble: 'PRECISION!',
        targeting: 'protagonist',
        effects: [
            { type: 'piercing', value: 1 },
            { type: 'accuracy', value: 1 }
        ]
    },
    'inspirational-shout': {
        id: 'inspirational-shout',
        name: 'Inspirational Shout',
        cost: 2,
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
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        description: 'Gain 5 Block. Remove all Burn and Poison from an ally.',
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
        description: 'Deal 14 damage. Inflict 1 Heckled.',
        owner: 'aldric',
        speechBubble: 'SILENCE!',
        effects: [
            { type: 'damage', value: 14 },
            { type: 'inflict', keyword: 'heckled', value: 1 }
        ]
    },
    'captivating-strike': {
        id: 'captivating-strike',
        name: 'Captivating Strike',
        cost: 1,
        type: 'attack',
        rarity: 'rare',
        description: 'Deal 1 damage. Gain 1 Ovation per damage dealt.',
        owner: 'aldric',
        speechBubble: 'WATCH THIS!',
        captivating: true,
        effects: [
            { type: 'damage', value: 1 }
        ]
    },
    'stoic-resistance': {
        id: 'stoic-resistance',
        name: 'Stoic Resistance',
        cost: 1,
        type: 'defense',
        rarity: 'rare',
        description: 'Gain 3 Block. Gain additional Block equal to Ovation on draw.',
        owner: 'aldric',
        speechBubble: 'ENDURE!',
        blockOnDraw: true,
        effects: [
            { type: 'block', value: 3 }
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
        description: 'Gain 1 Taunt and 1 Distract.',
        owner: 'pip',
        speechBubble: 'HEY UGLY!',
        effects: [
            { type: 'taunt', value: 1 },
            { type: 'distract', value: 1 }
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
        cost: 1,
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
        description: 'Deal 1 damage. Inflict 1 Frustration. Gain 1 Distract.',
        owner: 'pip',
        speechBubble: '*POKE*',
        effects: [
            { type: 'damage', value: 1 },
            { type: 'inflict', keyword: 'frustration', value: 1 },
            { type: 'distract', value: 1 }
        ]
    },
    'stylish-dance': {
        id: 'stylish-dance',
        name: 'Stylish Dance',
        cost: 3,
        type: 'action',
        rarity: 'uncommon',
        description: 'Lose all Ovation. Inflict Stage Fright.',
        owner: 'pip',
        speechBubble: 'DANCE BREAK!',
        effects: [
            { type: 'loseAllOvation' },
            { type: 'inflict', keyword: 'stageFright', value: 1 }
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
        description: 'Gain 2 Taunt. Inflict 2 Frustration and 1 Forgetful.',
        owner: 'pip',
        speechBubble: 'OVER HERE!',
        effects: [
            { type: 'taunt', value: 2 },
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
        description: 'Inflict 1 Confused and 1 Forgetful.',
        owner: 'pip',
        speechBubble: 'CONFUSING, RIGHT?',
        effects: [
            { type: 'inflict', keyword: 'confused', value: 1 },
            { type: 'inflict', keyword: 'forgetful', value: 1 }
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
        cost: 2,
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
    }
};

// Card pools for rewards (by protagonist + rarity)
const CARD_POOLS = {
    aldric: [
        'aegis', 'burning-devotion', 'enabling-strike', 'protective-stance',
        'protect', 'iron-wall', 'true-strike', 'inspirational-shout',
        'cleanse', 'aggressive-strike', 'captivating-strike', 'stoic-resistance'
    ],
    pip: [
        'good-fortune', 'create-opportunity', 'loaded-insult', 'coup-de-grace',
        'pips-cocktail', 'annoying-poke', 'stylish-dance', 'hit-where-it-hurts',
        'vex', 'best-explanation', 'ultimate-jeer', 'flirtatious-jeer'
    ]
};

// Pools split by rarity for reward selection
const CARD_POOLS_BY_RARITY = {
    aldric: {
        uncommon: [
            'aegis', 'burning-devotion', 'enabling-strike', 'protective-stance',
            'protect', 'iron-wall', 'true-strike', 'inspirational-shout',
            'cleanse', 'aggressive-strike'
        ],
        rare: ['captivating-strike', 'stoic-resistance']
    },
    pip: {
        uncommon: [
            'good-fortune', 'create-opportunity', 'loaded-insult', 'coup-de-grace',
            'pips-cocktail', 'annoying-poke', 'stylish-dance', 'hit-where-it-hurts',
            'vex', 'best-explanation'
        ],
        rare: ['ultimate-jeer', 'flirtatious-jeer']
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
    'block', 'block', 'block',
    'inspire'
];

// Build a starting deck from chosen basics
function buildStartingDeck(aldricBasic, pipBasic) {
    return [
        aldricBasic, aldricBasic, aldricBasic,
        pipBasic, pipBasic, pipBasic,
        'block', 'block', 'block',
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
    accuracy: {
        name: 'Accuracy',
        icon: '🎯',
        explanation: 'Attacks bypass Taunt/Distract and ignore Retaliate. Decays by 1.',
        hints: [
            "Accuracy bypasses evasion defenses!",
            "Accuracy doesn't bypass Block or Shield!",
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
    }
};
