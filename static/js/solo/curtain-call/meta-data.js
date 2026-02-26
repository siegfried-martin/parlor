/**
 * Curtain Call — M7 Meta-Progression Data Definitions
 *
 * MacGuffin variants, unlock tracks, alternative basics,
 * achievement definitions, and difficulty levels.
 *
 * Loaded between cards.js and game.js.
 */

'use strict';

// === MacGuffin Variants ===

const MACGUFFIN_VARIANTS = {
    'treasure-chest': {
        id: 'treasure-chest',
        name: 'Treasure Chest',
        description: 'The classic MacGuffin. Balanced and reliable.',
        icon: '\uD83D\uDCE6',
        hp: 60,
        passive: null,
        startingCards: ['block', 'block', 'inspire']
    },
    'crown': {
        id: 'crown',
        name: 'Royal Crown',
        description: 'Ovation cannot decay below 2.',
        icon: '\uD83D\uDC51',
        hp: 55,
        passive: 'royal-presence',
        startingCards: ['crown-decree', 'crown-decree', 'crown-rally']
    },
    'ancient-tome': {
        id: 'ancient-tome',
        name: 'Ancient Tome',
        description: 'After playing 5 cards in a turn, draw 1.',
        icon: '\uD83D\uDCD6',
        hp: 55,
        passive: 'tome-velocity',
        startingCards: ['tome-study', 'tome-study', 'tome-insight']
    },
    'fragile-heirloom': {
        id: 'fragile-heirloom',
        name: 'Fragile Heirloom',
        description: 'Low HP but starts with powerful cards.',
        icon: '\uD83D\uDC8E',
        hp: 40,
        passive: null,
        startingCards: ['heirloom-radiance', 'block', 'inspire']
    },
    'cursed-idol': {
        id: 'cursed-idol',
        name: 'Cursed Idol',
        description: 'High HP but your deck includes an unremovable Curse card.',
        icon: '\uD83D\uDDFF',
        hp: 90,
        passive: null,
        startingCards: ['block', 'block', 'idol-curse']
    }
};

// === Unlock Tracks ===

const UNLOCK_TRACKS = {
    'aldric-repertoire': {
        id: 'aldric-repertoire',
        name: "Aldric's Repertoire",
        description: 'Unlock new Aldric cards for reward pools.',
        icon: '\u2694\uFE0F',
        tiers: [
            { tier: 1, cost: 20, unlocks: ['heroic-charge'], type: 'card' },
            { tier: 2, cost: 30, unlocks: ['rallying-banner'], type: 'card' },
            { tier: 3, cost: 35, unlocks: ['divine-intervention'], type: 'card' },
            { tier: 4, cost: 45, unlocks: ['phalanx-formation'], type: 'card' },
            { tier: 5, cost: 60, unlocks: ['commanders-presence'], type: 'card' }
        ]
    },
    'pip-repertoire': {
        id: 'pip-repertoire',
        name: "Pip's Repertoire",
        description: 'Unlock new Pip cards for reward pools.',
        icon: '\uD83D\uDDE1\uFE0F',
        tiers: [
            { tier: 1, cost: 20, unlocks: ['sleight-of-hand'], type: 'card' },
            { tier: 2, cost: 30, unlocks: ['dirty-tricks'], type: 'card' },
            { tier: 3, cost: 35, unlocks: ['calculated-gamble'], type: 'card' },
            { tier: 4, cost: 45, unlocks: ['double-cross'], type: 'card' },
            { tier: 5, cost: 60, unlocks: ['grand-finale'], type: 'card' }
        ]
    },
    'neutral-cards': {
        id: 'neutral-cards',
        name: 'Neutral Cards',
        description: 'Unlock MacGuffin cards for reward pools.',
        icon: '\uD83C\uDFAD',
        tiers: [
            { tier: 1, cost: 25, unlocks: ['stage-whisper'], type: 'card' },
            { tier: 2, cost: 35, unlocks: ['standing-ovation'], type: 'card' },
            { tier: 3, cost: 45, unlocks: ['dramatic-pause'], type: 'card' }
        ]
    },
    'stage-props': {
        id: 'stage-props',
        name: 'Stage Props',
        description: 'Unlock new stage props for boss rewards.',
        icon: '\uD83C\uDFAC',
        tiers: [
            { tier: 1, cost: 25, unlocks: ['smoke-machine'], type: 'prop' },
            { tier: 2, cost: 35, unlocks: ['pyrotechnics'], type: 'prop' },
            { tier: 3, cost: 40, unlocks: ['prompters-whisper'], type: 'prop' },
            { tier: 4, cost: 50, unlocks: ['grand-chandelier'], type: 'prop' }
        ]
    },
    'macguffin-variants': {
        id: 'macguffin-variants',
        name: 'MacGuffin Variants',
        description: 'Unlock alternative MacGuffins with unique abilities.',
        icon: '\uD83D\uDCE6',
        tiers: [
            { tier: 1, cost: 80, unlocks: ['crown'], type: 'macguffin' },
            { tier: 2, cost: 85, unlocks: ['ancient-tome'], type: 'macguffin' },
            { tier: 3, cost: 90, unlocks: ['fragile-heirloom'], type: 'macguffin' },
            { tier: 4, cost: 100, unlocks: ['cursed-idol'], type: 'macguffin' }
        ]
    },
    'alt-basics': {
        id: 'alt-basics',
        name: 'Alternative Basics',
        description: 'Unlock alternative starting attacks.',
        icon: '\u2728',
        tiers: [
            { tier: 1, cost: 30, unlocks: ['shield-slam'], type: 'basic', protagonist: 'aldric' },
            { tier: 2, cost: 30, unlocks: ['rallying-cry'], type: 'basic', protagonist: 'aldric' },
            { tier: 3, cost: 30, unlocks: ['smoke-bomb'], type: 'basic', protagonist: 'pip' },
            { tier: 4, cost: 30, unlocks: ['trick-shot'], type: 'basic', protagonist: 'pip' }
        ]
    }
};

// === Alternative Basic Cards ===

const ALTERNATIVE_BASICS = {
    aldric: ['shield-slam', 'rallying-cry'],
    pip: ['smoke-bomb', 'trick-shot']
};

// === Achievement Definitions ===

const ACHIEVEMENT_DEFINITIONS = {
    'first-victory': {
        id: 'first-victory',
        name: 'Standing Ovation',
        description: 'Complete a full run.',
        icon: '\uD83C\uDFC6',
        tickets: 20,
        check: (stats) => stats.result === 'victory'
    },
    'boss-act1': {
        id: 'boss-act1',
        name: 'Act I Closer',
        description: 'Defeat the Act 1 boss.',
        icon: '\uD83C\uDFAD',
        tickets: 10,
        check: (stats) => stats.bossesDefeated && stats.bossesDefeated.length >= 1
    },
    'boss-act2': {
        id: 'boss-act2',
        name: 'Act II Closer',
        description: 'Defeat the Act 2 boss.',
        icon: '\uD83C\uDFAD',
        tickets: 15,
        check: (stats) => stats.bossesDefeated && stats.bossesDefeated.length >= 2
    },
    'boss-act3': {
        id: 'boss-act3',
        name: 'Grand Finale',
        description: 'Defeat the Act 3 boss.',
        icon: '\uD83C\uDFAD',
        tickets: 20,
        check: (stats) => stats.bossesDefeated && stats.bossesDefeated.length >= 3
    },
    'ovation-master': {
        id: 'ovation-master',
        name: 'Crowd Favorite',
        description: 'Reach maximum Ovation (5) in a run.',
        icon: '\uD83D\uDC4F',
        tickets: 10,
        check: (stats) => stats.maxOvationReached >= 5
    },
    'debuff-stacker': {
        id: 'debuff-stacker',
        name: 'Walking Disaster',
        description: 'Have 5+ unique debuff types on an enemy at once.',
        icon: '\u2620\uFE0F',
        tickets: 15,
        check: (stats) => stats.maxEnemyDebuffTypes >= 5
    },
    'flawless-boss': {
        id: 'flawless-boss',
        name: 'Flawless Performance',
        description: 'Defeat a boss without losing MacGuffin HP.',
        icon: '\uD83C\uDF1F',
        tickets: 25,
        check: (stats) => stats.flawlessBoss === true
    },
    'gold-hoarder': {
        id: 'gold-hoarder',
        name: 'Gold Hoarder',
        description: 'Finish a run with 100+ gold.',
        icon: '\uD83E\uDE99',
        tickets: 15,
        check: (stats) => stats.finalGold >= 100
    },
    'difficulty-2-clear': {
        id: 'difficulty-2-clear',
        name: 'Evening Performer',
        description: 'Complete a run on Evening Show difficulty.',
        icon: '\uD83C\uDF19',
        tickets: 30,
        check: (stats) => stats.result === 'victory' && stats.difficulty >= 1
    },
    'difficulty-3-clear': {
        id: 'difficulty-3-clear',
        name: 'Opening Night Star',
        description: 'Complete a run on Opening Night difficulty.',
        icon: '\u2B50',
        tickets: 40,
        check: (stats) => stats.result === 'victory' && stats.difficulty >= 2
    }
};

// === Difficulty Definitions ===

const DIFFICULTY_DEFINITIONS = [
    {
        level: 0,
        name: 'Matinee',
        description: 'Standard difficulty. The show as intended.',
        icon: '\u2600\uFE0F',
        hpMultiplier: 1.0,
        enemyInspire: 0,
        maxEnergy: 3,
        requiresAchievement: null
    },
    {
        level: 1,
        name: 'Evening Show',
        description: 'Enemies have +20% HP.',
        icon: '\uD83C\uDF19',
        hpMultiplier: 1.2,
        enemyInspire: 0,
        maxEnergy: 3,
        requiresAchievement: 'first-victory'
    },
    {
        level: 2,
        name: 'Opening Night',
        description: 'Enemies have +40% HP and start with 1 Inspire.',
        icon: '\u2B50',
        hpMultiplier: 1.4,
        enemyInspire: 1,
        maxEnergy: 3,
        requiresAchievement: 'difficulty-2-clear'
    },
    {
        level: 3,
        name: "Critics' Choice",
        description: 'Enemies have +60% HP, start with 1 Inspire, max energy reduced to 2.',
        icon: '\uD83D\uDCF0',
        hpMultiplier: 1.6,
        enemyInspire: 1,
        maxEnergy: 2,
        requiresAchievement: 'difficulty-3-clear'
    }
];
