/**
 * Curtain Call - Shadow Puppet Theater Deck-Building Game
 *
 * Milestones 13-15: Keywords, Debuffs, Defensive Keywords
 * - Charged, Encore, Piercing keywords
 * - Stage Fright, Weakness debuffs
 * - Ward, Ovation defensive mechanics
 *
 * Previous milestones:
 * - M11-12: Act I scene flow, boss
 * - M7-10: Turn loop, combat, rewards
 * - M1-6: UI, cards, animations
 */

'use strict';

// === Card Definitions ===
const CARD_DEFINITIONS = {
    // === Starting/Basic Cards (all Common) ===
    'basic-block': {
        id: 'basic-block',
        name: 'Basic Block',
        cost: 1,
        type: 'block',
        rarity: 'common',
        description: 'Gain 5 Block.',
        owner: 'neutral',
        speechBubble: 'BRACE!',
        effects: [{ type: 'block', value: 5 }]
    },
    'hammer-swing': {
        id: 'hammer-swing',
        name: 'Hammer Swing',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: 'Deal 6 damage.',
        owner: 'aldric',
        speechBubble: 'CLANG!',
        effects: [{ type: 'damage', value: 6 }]
    },
    'quick-jab': {
        id: 'quick-jab',
        name: 'Quick Jab',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: 'Deal 4 damage. Draw 1 card.',
        owner: 'pip',
        speechBubble: 'THWIP!',
        effects: [
            { type: 'damage', value: 4 },
            { type: 'draw', value: 1 }
        ]
    },

    // === Aldric's Card Pool ===
    'heavy-strike': {
        id: 'heavy-strike',
        name: 'Heavy Strike',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: 'Deal 12 damage.',
        owner: 'aldric',
        speechBubble: 'WHAM!',
        effects: [{ type: 'damage', value: 12 }]
    },
    'forge-ahead': {
        id: 'forge-ahead',
        name: 'Forge Ahead',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: 'Deal 6 damage. Gain 3 Block.',
        owner: 'aldric',
        speechBubble: 'COME ON!',
        effects: [
            { type: 'damage', value: 6 },
            { type: 'block', value: 3 }
        ]
    },
    'iron-wall': {
        id: 'iron-wall',
        name: 'Iron Wall',
        cost: 2,
        type: 'block',
        rarity: 'uncommon',
        description: 'Gain 12 Block.',
        owner: 'aldric',
        speechBubble: 'STAND FIRM!',
        effects: [{ type: 'block', value: 12 }]
    },
    'tremor': {
        id: 'tremor',
        name: 'Tremor',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        description: 'Deal 8 damage. Apply Weakness.',
        owner: 'aldric',
        speechBubble: 'THE GROUND SHAKES!',
        effects: [
            { type: 'damage', value: 8 },
            { type: 'applyDebuff', debuff: 'weakness', duration: 2 }
        ]
    },
    'relentless-blow': {
        id: 'relentless-blow',
        name: 'Relentless Blow',
        cost: 1,
        type: 'attack',
        rarity: 'rare',
        description: 'Deal 5 damage. Charged 2.',
        owner: 'aldric',
        keywords: ['charged'],
        chargedBonus: 2,
        speechBubble: 'AND AGAIN!',
        effects: [{ type: 'damage', value: 5 }]
    },
    'curtain-of-iron': {
        id: 'curtain-of-iron',
        name: 'Curtain of Iron',
        cost: 3,
        type: 'block',
        rarity: 'legendary',
        description: 'Gain Curtain 2 for this combat.',
        owner: 'aldric',
        keywords: ['curtain'],
        speechBubble: 'NOTHING GETS THROUGH.',
        effects: [{ type: 'curtain', value: 2 }]
    },

    // === Pip's Card Pool ===
    'trick-shot': {
        id: 'trick-shot',
        name: 'Trick Shot',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: 'Deal 4 damage.',
        owner: 'pip',
        speechBubble: 'SURPRISE!',
        effects: [{ type: 'damage', value: 4 }]
    },
    'smoke-bomb': {
        id: 'smoke-bomb',
        name: 'Smoke Bomb',
        cost: 1,
        type: 'block',
        rarity: 'uncommon',
        description: 'Gain 4 Block. Draw 1 card.',
        owner: 'pip',
        speechBubble: 'NOW YOU SEE ME...',
        effects: [
            { type: 'block', value: 4 },
            { type: 'draw', value: 1 }
        ]
    },
    'cunning-plan': {
        id: 'cunning-plan',
        name: 'Cunning Plan',
        cost: 0,
        type: 'spell',
        rarity: 'uncommon',
        description: 'Draw 2 cards.',
        owner: 'pip',
        speechBubble: 'I HAVE AN IDEA!',
        effects: [{ type: 'draw', value: 2 }]
    },
    'mockery': {
        id: 'mockery',
        name: 'Mockery',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: 'Deal 2 damage. Apply Weakness.',
        owner: 'pip',
        speechBubble: 'HA HA HA!',
        effects: [
            { type: 'damage', value: 2 },
            { type: 'applyDebuff', debuff: 'weakness', duration: 2 }
        ]
    },
    'encore-performance': {
        id: 'encore-performance',
        name: 'Encore Performance',
        cost: 1,
        type: 'attack',
        rarity: 'rare',
        description: 'Deal 3 damage. Encore.',
        owner: 'pip',
        keywords: ['encore'],
        speechBubble: 'MISS ME?',
        effects: [{ type: 'damage', value: 3 }]
    },
    'nimble-dodge': {
        id: 'nimble-dodge',
        name: 'Nimble Dodge',
        cost: 1,
        type: 'block',
        rarity: 'rare',
        description: 'Gain Ward 2.',
        owner: 'pip',
        keywords: ['ward'],
        speechBubble: 'TOO SLOW!',
        effects: [{ type: 'ward', value: 2 }]
    },
    'grand-finale': {
        id: 'grand-finale',
        name: 'Grand Finale',
        cost: 3,
        type: 'attack',
        rarity: 'legendary',
        description: 'Deal 4 damage per card played this turn.',
        owner: 'pip',
        speechBubble: 'AND FOR MY FINAL ACT!',
        effects: [{ type: 'grandFinale', damagePerCard: 4 }]
    },

    // === Neutral Card Pool ===
    'patch-up': {
        id: 'patch-up',
        name: 'Patch Up',
        cost: 1,
        type: 'heal',
        rarity: 'common',
        description: 'Heal 5 HP.',
        owner: 'neutral',
        speechBubble: 'HOLD TOGETHER!',
        effects: [{ type: 'heal', value: 5 }]
    },
    'second-wind': {
        id: 'second-wind',
        name: 'Second Wind',
        cost: 1,
        type: 'spell',
        rarity: 'uncommon',
        description: 'Gain 1 energy. Draw 1 card.',
        owner: 'neutral',
        speechBubble: 'NOT DONE YET!',
        effects: [
            { type: 'energy', value: 1 },
            { type: 'draw', value: 1 }
        ]
    },
    'rally-the-crowd': {
        id: 'rally-the-crowd',
        name: 'Rally the Crowd',
        cost: 2,
        type: 'block',
        rarity: 'rare',
        description: 'Gain Ovation 4.',
        owner: 'neutral',
        keywords: ['ovation'],
        speechBubble: 'CHEER FOR US!',
        effects: [{ type: 'ovation', value: 4 }]
    },
    'intermission': {
        id: 'intermission',
        name: 'Intermission',
        cost: 2,
        type: 'spell',
        rarity: 'rare',
        description: 'Remove all debuffs. Draw 1 card.',
        owner: 'neutral',
        speechBubble: 'TAKE FIVE!',
        effects: [
            { type: 'cleanse' },
            { type: 'draw', value: 1 }
        ]
    },
    'desperate-plea': {
        id: 'desperate-plea',
        name: 'Desperate Plea',
        cost: 0,
        type: 'block',
        rarity: 'legendary',
        description: 'Gain Block equal to missing HP (max 15).',
        owner: 'neutral',
        speechBubble: 'PLEASE!',
        effects: [{ type: 'desperatePlea', max: 15 }]
    }
};

// Card pools for rewards
const CARD_POOLS = {
    aldric: ['heavy-strike', 'forge-ahead', 'iron-wall', 'tremor', 'relentless-blow', 'curtain-of-iron'],
    pip: ['trick-shot', 'smoke-bomb', 'cunning-plan', 'mockery', 'encore-performance', 'nimble-dodge', 'grand-finale'],
    neutral: ['patch-up', 'second-wind', 'rally-the-crowd', 'intermission', 'desperate-plea']
};

// Starting deck composition: 4x Basic Block, 2x Hammer Swing, 2x Quick Jab
const STARTING_DECK = [
    'basic-block', 'basic-block', 'basic-block', 'basic-block',
    'hammer-swing', 'hammer-swing',
    'quick-jab', 'quick-jab'
];

// === Keyword Glossary ===
const KEYWORD_GLOSSARY = {
    ward: {
        name: 'Ward',
        icon: '🛡️',
        explanation: 'Blocks the next N hits completely!',
        hints: [
            "I heard Ward blocks hits completely!",
            "Did you know Ward absorbs whole attacks?",
            "Ward is like having a bodyguard!"
        ]
    },
    ovation: {
        name: 'Ovation',
        icon: '👏',
        explanation: 'Audience shields you, decaying each hit!',
        hints: [
            "Ovation gives you our applause as armor!",
            "Did you know Ovation gets weaker each hit?",
            "We clap, you get protected! That's Ovation!"
        ]
    },
    curtain: {
        name: 'Curtain',
        icon: '🎭',
        explanation: 'Reduces damage from each hit!',
        hints: [
            "Curtain softens every blow!",
            "Did you know Curtain reduces ALL incoming damage?",
            "Behind the Curtain, you're safer!"
        ]
    },
    charged: {
        name: 'Charged',
        icon: '⚡',
        explanation: 'Gets stronger with each consecutive attack!',
        hints: [
            "Charged attacks get stronger in a row!",
            "Keep attacking for Charged bonus damage!",
            "Did you know Charged builds up power?"
        ]
    },
    encore: {
        name: 'Encore',
        icon: '🔄',
        explanation: 'Returns to your hand after playing!',
        hints: [
            "Encore cards come back for more!",
            "Did you know Encore returns to your hand?",
            "Play it again with Encore!"
        ]
    },
    piercing: {
        name: 'Piercing',
        icon: '🗡️',
        explanation: 'Ignores block entirely!',
        hints: [
            "Piercing goes right through block!",
            "Did you know Piercing ignores defense?",
            "No block can stop a Piercing attack!"
        ]
    },
    stageFright: {
        name: 'Stage Fright',
        icon: '😰',
        explanation: 'Cards cost 1 more energy!',
        hints: [
            "Stage Fright makes everything cost more!",
            "Oh no, Stage Fright increases card costs!",
            "Did you know Stage Fright adds +1 to costs?"
        ]
    },
    weakness: {
        name: 'Weakness',
        icon: '💪',
        explanation: 'Deals 50% less damage!',
        hints: [
            "Weakness cuts damage in half!",
            "Did you know Weakness means 50% damage?",
            "Feeling Weak? That's half damage!"
        ]
    },
    heckled: {
        name: 'Heckled',
        icon: '🗣️',
        explanation: 'Take 1 damage when playing cards!',
        hints: [
            "Heckled means every card hurts a little!",
            "Did you know being Heckled damages you?",
            "Ouch! Heckled cards cost health too!"
        ]
    },
    block: {
        name: 'Block',
        icon: '🛡️',
        explanation: 'Absorbs damage until depleted!',
        hints: [
            "Block absorbs damage for you!",
            "Did you know Block resets each turn?",
            "Stack up Block to stay safe!"
        ]
    },
    fortify: {
        name: 'Fortify',
        icon: '🏰',
        explanation: 'Block persists between turns!',
        hints: [
            "Fortify keeps your Block around!",
            "Did you know Fortify Block doesn't expire?",
            "Fortified defenses last forever!"
        ]
    },
    persistent: {
        name: 'Persistent',
        icon: '♾️',
        explanation: 'Effect lasts until removed!',
        hints: [
            "Persistent effects stick around!",
            "Did you know Persistent means permanent?",
            "Persistent buffs are here to stay!"
        ]
    }
};

// === Audience Member Types ===
const AUDIENCE_TYPES = {
    basic: {
        id: 'basic',
        svg: '/static/svg/audience/basic.svg',
        bobCount: 1,
        scale: 1.0,
        isChild: false
    },
    tophat: {
        id: 'tophat',
        svg: '/static/svg/audience/tophat.svg',
        bobCount: 1,  // Dignified, single nod
        scale: 1.0,
        isChild: false
    },
    bowler: {
        id: 'bowler',
        svg: '/static/svg/audience/bowler.svg',
        bobCount: 2,  // Polite double-nod
        scale: 1.0,
        isChild: false
    },
    cap: {
        id: 'cap',
        svg: '/static/svg/audience/cap.svg',
        bobCount: 3,  // Enthusiastic casual fan
        scale: 1.0,
        isChild: false
    },
    ponytail: {
        id: 'ponytail',
        svg: '/static/svg/audience/ponytail.svg',
        bobCount: 2,
        scale: 1.0,
        isChild: false
    },
    bun: {
        id: 'bun',
        svg: '/static/svg/audience/bun.svg',
        bobCount: 1,  // Elegant, restrained
        scale: 1.0,
        isChild: false
    },
    afro: {
        id: 'afro',
        svg: '/static/svg/audience/afro.svg',
        bobCount: 3,  // Grooving along
        scale: 1.0,
        isChild: false
    },
    mohawk: {
        id: 'mohawk',
        svg: '/static/svg/audience/mohawk.svg',
        bobCount: 4,  // Headbanger
        scale: 1.0,
        isChild: false
    },
    cowboy: {
        id: 'cowboy',
        svg: '/static/svg/audience/cowboy.svg',
        bobCount: 1,  // Cool, collected tip of the hat
        scale: 1.0,
        isChild: false
    },
    fancyhat: {
        id: 'fancyhat',
        svg: '/static/svg/audience/fancyhat.svg',
        bobCount: 1,  // Refined
        scale: 1.0,
        isChild: false
    },
    boy: {
        id: 'boy',
        svg: '/static/svg/audience/boy.svg',
        bobCount: 5,  // Kids are excitable!
        scale: 0.75,
        isChild: true
    },
    girl: {
        id: 'girl',
        svg: '/static/svg/audience/girl.svg',
        bobCount: 5,  // Kids are excitable!
        scale: 0.75,
        isChild: true
    },
    glasses: {
        id: 'glasses',
        svg: '/static/svg/audience/glasses.svg',
        bobCount: 2,  // Thoughtful nodding
        scale: 1.0,
        isChild: false
    },
    bald: {
        id: 'bald',
        svg: '/static/svg/audience/bald.svg',
        bobCount: 2,
        scale: 1.0,
        isChild: false
    },
    messy: {
        id: 'messy',
        svg: '/static/svg/audience/messy.svg',
        bobCount: 4,  // Wild and energetic
        scale: 1.0,
        isChild: false
    },
    beanie: {
        id: 'beanie',
        svg: '/static/svg/audience/beanie.svg',
        bobCount: 3,
        scale: 1.0,
        isChild: false
    },
    longhair: {
        id: 'longhair',
        svg: '/static/svg/audience/longhair.svg',
        bobCount: 2,
        scale: 1.0,
        isChild: false
    },
    bowtie: {
        id: 'bowtie',
        svg: '/static/svg/audience/bowtie.svg',
        bobCount: 1,  // Dapper, refined
        scale: 1.0,
        isChild: false
    },
    crown: {
        id: 'crown',
        svg: '/static/svg/audience/crown.svg',
        bobCount: 1,  // Royal, barely deigns to nod
        scale: 1.0,
        isChild: false
    }
};

// List for random selection
const AUDIENCE_TYPE_LIST = Object.values(AUDIENCE_TYPES);
const ADULT_AUDIENCE_TYPES = AUDIENCE_TYPE_LIST.filter(t => !t.isChild);
const CHILD_AUDIENCE_TYPES = AUDIENCE_TYPE_LIST.filter(t => t.isChild);

class CurtainCallGame {
    constructor() {
        this.initialized = false;
        this.deck = [];
        this.hand = [];
        this.discardPile = [];
        this.selectedCardIndex = null;
        this.isAnimating = false; // Prevent actions during animations
        this.bubbleOffset = 0; // For staggering multiple bubbles

        // Turn state (Milestone 7)
        this.turnNumber = 0;
        this.phase = 'player'; // 'player' | 'enemy' | 'gameover'
        this.handSize = 5;

        // Energy state (Milestone 4)
        this.energy = {
            current: 3,
            max: 3
        };

        // Status effects system (Milestone 13-15)
        this.statusEffects = {
            // Player-side effects
            ward: 0,           // Absorbs N instances of damage
            ovation: 0,        // Decaying shield (blocks N, then N-1, etc.)
            curtain: 0,        // Flat damage reduction per hit
            chargedCount: 0,   // Consecutive same-hero attack counter
            lastAttacker: null, // Track last attacking hero for Charged
            cardsPlayedThisTurn: 0, // For Grand Finale

            // Debuffs on player (from enemies)
            stageFright: { active: false, duration: 0, target: null }, // +1 cost on hero's cards
            weakness: { active: false, duration: 0 },    // 50% damage dealt
            heckled: { active: false, duration: 0, target: null },     // Self-damage on play

            // Debuffs on enemy (from player)
            enemyWeakness: { active: false, duration: 0 } // 50% enemy damage
        };

        // Encore tracking
        this.encoreCard = null; // Card to return to hand next turn

        // Card zoom / keyword explanation state
        this.longPressTimer = null;
        this.longPressDuration = 500; // ms to trigger long-press
        this.zoomedCard = null;
        this.zoomedCardElement = null;
        this.explanationBubbles = [];
        this.explanationPage = 0;
        this.explanationKeywords = [];
        this.explanationPaginationTimer = null;

        // Combat state (Milestone 3)
        this.combatState = {
            macguffin: {
                currentHP: 60,
                maxHP: 60,
                block: 0
            },
            enemy: {
                id: 'stage-rat',
                name: 'Stage Rat',
                currentHP: 28,
                maxHP: 28,
                block: 0,
                intent: {
                    type: 'attack',
                    value: 7,
                    hits: 1  // For multi-attack support
                },
                patternIndex: 0,
                speechBubbles: {
                    attack: 'SQUEAK!',
                    hurt: 'EEK!',
                    defeated: '...squeak.'
                }
            }
        };

        // Enemy definitions
        this.enemies = {
            'stage-rat': {
                id: 'stage-rat',
                name: 'Stage Rat',
                hp: 28,
                gimmick: 'Straightforward attacker',
                pattern: [
                    { type: 'attack', value: 7, hits: 1 },
                    { type: 'attack', value: 7, hits: 1 },
                    { type: 'attack', value: 10, hits: 1 }
                ],
                speechBubbles: { attack: 'SQUEAK!', hurt: 'EEK!', defeated: '...squeak.' }
            },
            'rusty-knight': {
                id: 'rusty-knight',
                name: 'Rusty Knight',
                hp: 35,
                gimmick: 'Slow but armored',
                pattern: [
                    { type: 'block', value: 5, hits: 1 },
                    { type: 'attack', value: 12, hits: 1 },
                    { type: 'attack', value: 8, hits: 1 }
                ],
                speechBubbles: { attack: 'FOR... SOMETHING!', block: 'CLANK.', defeated: 'I RUST IN PEACE.' }
            },
            'moth-swarm': {
                id: 'moth-swarm',
                name: 'Moth Swarm',
                hp: 22,
                gimmick: 'Hits multiple times',
                pattern: [
                    { type: 'attack', value: 3, hits: 3 },
                    { type: 'attack', value: 3, hits: 3 },
                    { type: 'attack', value: 5, hits: 2 }
                ],
                speechBubbles: { attack: 'bzz bzz bzz', hurt: 'SCATTER!', defeated: 'poof' }
            },
            'stagehand': {
                id: 'stagehand',
                name: 'Stagehand',
                hp: 30,
                gimmick: 'Gets stronger over time',
                pattern: [
                    { type: 'buff', value: 3, hits: 1 },
                    { type: 'attack', value: 5, hits: 1 },
                    { type: 'attack', value: 5, hits: 1 }
                ],
                speechBubbles: { attack: 'NOTHING PERSONAL.', buff: 'SETTING THE STAGE...', defeated: 'I QUIT.' }
            },
            'the-critic': {
                id: 'the-critic',
                name: 'The Critic',
                hp: 55,
                gimmick: 'Boss - Judges your every move',
                isBoss: true,
                pattern: [
                    { type: 'attack', value: 8, hits: 1 },
                    { type: 'debuff', value: 2, hits: 1 },
                    { type: 'attack', value: 10, hits: 1 }
                ],
                speechBubbles: { attack: 'PATHETIC.', debuff: 'TWO STARS.', hurt: 'HMPH.', defeated: '...FINE. THREE STARS.' }
            }
        };

        // Act/Scene structure
        this.actStructure = {
            1: {
                scenes: [
                    { enemies: ['stage-rat', 'rusty-knight'] },
                    { enemies: ['moth-swarm', 'stagehand'] }
                ],
                boss: 'the-critic'
            }
        };

        // Run progression state
        this.runState = {
            currentAct: 1,
            currentScene: 0, // 0 = scene select, 1 = scene 1, 2 = scene 2, 3 = boss
            phase: 'scene-select' // 'scene-select' | 'combat' | 'reward' | 'boss' | 'act-complete'
        };

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        if (this.initialized) return;
        this.initialized = true;

        console.log('Curtain Call: Initializing...');

        // Cache DOM references
        this.elements = {
            container: document.getElementById('game-container'),
            endTurnBtn: document.getElementById('end-turn-btn'),
            enemyPuppet: document.getElementById('enemy-puppet'),
            heroAldric: document.getElementById('hero-bron'),
            heroPip: document.getElementById('hero-pip'),
            macguffin: document.getElementById('macguffin'),
            handCards: document.getElementById('hand-cards'),
            // Combat state elements (Milestone 3)
            macguffinHPBar: document.querySelector('.macguffin-hp-bar'),
            macguffinHPFill: document.querySelector('.macguffin-hp-bar .hp-fill'),
            macguffinHPText: document.querySelector('.macguffin-hp-bar .hp-text'),
            macguffinBlock: document.getElementById('macguffin-block'),
            enemyHPBar: document.querySelector('.enemy-hp-bar'),
            enemyHPFill: document.querySelector('.enemy-hp-bar .hp-fill'),
            enemyHPText: document.querySelector('.enemy-hp-bar .hp-text'),
            enemyIntent: document.querySelector('.enemy-intent'),
            intentIcon: document.getElementById('intent-icon'),
            intentValue: document.querySelector('.intent-value'),
            // Energy display (Milestone 4)
            energyValue: document.querySelector('.energy-value'),
            // Speech bubbles (Milestone 5)
            speechBubbles: document.getElementById('speech-bubbles'),
            // Rewards screen (Milestone 10)
            rewardsOverlay: document.getElementById('rewards-overlay'),
            rewardsCards: document.getElementById('rewards-cards'),
            confirmRewardBtn: document.getElementById('confirm-reward-btn'),
            skipRewardBtn: document.getElementById('skip-reward-btn'),
            // Scene selection (Milestone 11)
            sceneSelectOverlay: document.getElementById('scene-select-overlay'),
            sceneTitle: document.getElementById('scene-title'),
            enemyChoices: document.getElementById('enemy-choices'),
            progressIndicator: document.getElementById('progress-indicator'),
            // Title & Character Select (Milestone 16)
            titleScreen: document.getElementById('title-screen'),
            characterSelect: document.getElementById('character-select'),
            newPerformanceBtn: document.getElementById('new-performance-btn'),
            raiseCurtainBtn: document.getElementById('raise-curtain-btn'),
        };

        // Rewards state
        this.rewardOptions = [];
        this.selectedRewardIndex = null;

        // Initialize deck
        this.initializeDeck();

        // Initialize combat state display
        this.renderCombatState();
        this.updateProgressIndicator();

        // Set up event listeners
        this.bindEvents();

        // Expose debug API
        this.exposeDebugAPI();

        // Start with curtains closed and title screen (Milestone 16)
        this.elements.container.classList.add('curtain-closed', 'game-ui-hidden');
        this.showTitleScreen();

        console.log('Curtain Call: Ready');
    }

    initializeDeck() {
        // Create deck from starting deck definition
        this.deck = STARTING_DECK.map((cardId, index) => ({
            ...CARD_DEFINITIONS[cardId],
            instanceId: `${cardId}-${index}` // Unique instance ID
        }));

        // Shuffle the deck
        this.shuffleDeck();
    }

    shuffleDeck() {
        // Fisher-Yates shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    // === Animation Initialization ===

    initializeAnimations() {
        // Generate audience with positioning algorithm
        this.generateAudience();

        // Schedule occasional wave (every 20-40 seconds)
        this.scheduleAudienceWave();

        // Initialize protagonists with random animation delays
        if (this.elements.heroAldric) {
            const aldricDelay = Math.random() * 3;
            this.elements.heroAldric.style.animationDelay = `-${aldricDelay}s`;
        }

        if (this.elements.heroPip) {
            const pipDelay = Math.random() * 2.2;
            this.elements.heroPip.style.animationDelay = `-${pipDelay}s`;
        }

        // Also randomize enemy animation delay
        if (this.elements.enemyPuppet) {
            const enemyDelay = Math.random() * 2.5;
            this.elements.enemyPuppet.style.animationDelay = `-${enemyDelay}s`;
        }
    }

    generateAudience() {
        const strip = document.getElementById('audience-strip');
        if (!strip) return;

        // Clear existing audience members
        strip.innerHTML = '';
        this.audienceMembers = [];
        this.audienceTimers = [];

        // Y positions for rows 1-5 (1=front/bottom, 5=back/top)
        // More spread out to use vertical space
        const yPositions = {
            1: 5,    // Front row
            2: 22,   //
            3: 40,   // Middle
            4: 58,   //
            5: 76    // Back row
        };

        // X positions for 6 columns
        const xPositions = [0, 38, 76, 114, 152, 190];

        // Pair configurations: [row1, row2]
        const pairConfigs = [
            [1, 4],
            [1, 5],
            [2, 5]
        ];

        // Single person row options
        const singleRows = [2, 3, 4];

        let memberIndex = 0;

        // For each X position (column)
        xPositions.forEach((xPos, colIndex) => {
            const hasTwoPeople = Math.random() < 0.5;

            if (hasTwoPeople) {
                // Pick a pair configuration
                const pairConfig = pairConfigs[Math.floor(Math.random() * pairConfigs.length)];

                pairConfig.forEach(row => {
                    const member = this.createAudienceMember(xPos, yPositions[row], row, memberIndex);
                    strip.appendChild(member);
                    this.audienceMembers.push(member);
                    this.scheduleAudienceBob(member, memberIndex);
                    memberIndex++;
                });
            } else {
                // Single person in middle rows
                const row = singleRows[Math.floor(Math.random() * singleRows.length)];
                const member = this.createAudienceMember(xPos, yPositions[row], row, memberIndex);
                strip.appendChild(member);
                this.audienceMembers.push(member);
                this.scheduleAudienceBob(member, memberIndex);
                memberIndex++;
            }
        });
    }

    createAudienceMember(xPos, yPos, row, index) {
        const member = document.createElement('div');
        member.className = `audience-member row-${row}`;
        member.dataset.index = index;
        member.dataset.row = row;

        // Pick a random audience type
        // 15% chance for a child in front rows (1-2), otherwise adult
        let audienceType;
        if (row <= 2 && Math.random() < 0.15 && CHILD_AUDIENCE_TYPES.length > 0) {
            audienceType = CHILD_AUDIENCE_TYPES[Math.floor(Math.random() * CHILD_AUDIENCE_TYPES.length)];
        } else {
            audienceType = ADULT_AUDIENCE_TYPES[Math.floor(Math.random() * ADULT_AUDIENCE_TYPES.length)];
        }

        member.dataset.type = audienceType.id;
        member.dataset.bobCount = audienceType.bobCount;

        // Set position via CSS variables
        member.style.setProperty('--pos-x', `${xPos}px`);
        member.style.setProperty('--pos-y', `${yPos}px`);

        // Apply scale for children
        if (audienceType.isChild) {
            member.classList.add('child');
            member.style.setProperty('--member-scale', audienceType.scale);
        }

        // Create the SVG image
        const img = document.createElement('img');
        img.src = audienceType.svg;
        img.alt = audienceType.id;
        img.className = 'audience-svg';
        img.draggable = false;
        member.appendChild(img);

        return member;
    }

    scheduleAudienceBob(member, index) {
        // Random interval between 5-15 seconds before next bob
        const interval = 5000 + Math.random() * 10000;

        const timerId = setTimeout(() => {
            // Don't bob if currently doing wave
            if (member.classList.contains('audience-wave')) {
                this.scheduleAudienceBob(member, index);
                return;
            }

            // Get bob count from personality
            const bobCount = parseInt(member.dataset.bobCount) || 1;

            // Trigger the bob animation with appropriate class
            let bobClass;
            if (bobCount >= 4) {
                bobClass = 'audience-bob-4';
            } else if (bobCount >= 3) {
                bobClass = 'audience-bob-3';
            } else if (bobCount >= 2) {
                bobClass = 'audience-bob-2';
            } else {
                bobClass = 'audience-bob-1';
            }
            member.classList.add(bobClass);

            // Remove class after animation completes (200ms per bob + buffer)
            const duration = bobCount * 200 + 100;
            setTimeout(() => {
                member.classList.remove(bobClass);
            }, duration);

            // Schedule next bob
            this.scheduleAudienceBob(member, index);
        }, interval);

        this.audienceTimers[index] = timerId;
    }

    scheduleAudienceWave() {
        // Wave or tutorial hint every 20-40 seconds
        const interval = 20000 + Math.random() * 20000;

        this.waveTimer = setTimeout(() => {
            // 60% chance of wave, 40% chance of tutorial hint
            if (Math.random() < 0.6) {
                this.triggerAudienceWave();
            } else {
                this.triggerRandomTutorialHint();
            }
            this.scheduleAudienceWave();
        }, interval);
    }

    triggerAudienceWave() {
        // Sort members by X position for wave effect
        const sortedMembers = [...this.audienceMembers].sort((a, b) => {
            const xA = parseInt(a.style.getPropertyValue('--pos-x'));
            const xB = parseInt(b.style.getPropertyValue('--pos-x'));
            return xA - xB;
        });

        sortedMembers.forEach((member, index) => {
            // Stagger the wave from left to right
            const delay = index * 0.08; // 80ms between each member
            member.style.setProperty('--wave-delay', `${delay}s`);
            member.classList.add('audience-wave');

            // Remove wave class after animation
            setTimeout(() => {
                member.classList.remove('audience-wave');
            }, 600 + delay * 1000);
        });
    }

    triggerRandomTutorialHint() {
        // Pick a random keyword from the glossary
        const keywords = Object.keys(KEYWORD_GLOSSARY);
        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
        const glossaryEntry = KEYWORD_GLOSSARY[randomKeyword];

        if (!glossaryEntry || !glossaryEntry.hints || glossaryEntry.hints.length === 0) return;

        // Pick a random hint for this keyword
        const randomHint = glossaryEntry.hints[Math.floor(Math.random() * glossaryEntry.hints.length)];

        // Get a random audience member
        const audienceMembers = this.getRandomAudienceMembers(1);
        if (audienceMembers.length === 0) return;

        // Show the hint with the icon
        const bubbleText = `${glossaryEntry.icon} ${randomHint}`;

        // Create a tutorial hint bubble (slightly different style)
        const bubble = document.createElement('div');
        bubble.className = 'audience-bubble tutorial-hint';
        bubble.textContent = bubbleText;

        const member = audienceMembers[0];
        const memberRect = member.getBoundingClientRect();
        const containerRect = this.elements.container.getBoundingClientRect();

        // Calculate left position, clamping to stay within container
        const rawLeft = memberRect.left - containerRect.left + memberRect.width / 2;
        const minLeft = 110;
        const maxLeft = containerRect.width - 110;
        const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));

        bubble.style.left = `${clampedLeft}px`;
        bubble.style.bottom = `${containerRect.bottom - memberRect.top + 10}px`;

        this.elements.container.appendChild(bubble);

        // Animate in
        requestAnimationFrame(() => {
            bubble.classList.add('visible');
        });

        // Remove after 5 seconds
        setTimeout(() => {
            bubble.classList.remove('visible');
            setTimeout(() => bubble.remove(), 300);
        }, 5000);
    }

    // Public method to trigger reactions on special events
    triggerAudienceReaction(type = 'wave') {
        if (type === 'wave') {
            this.triggerAudienceWave();
        } else if (type === 'excited') {
            this.audienceMembers.forEach(member => {
                member.classList.add('audience-excited');
                setTimeout(() => member.classList.remove('audience-excited'), 400);
            });
        } else if (type === 'worried') {
            this.audienceMembers.forEach(member => {
                member.classList.add('audience-worried');
                setTimeout(() => member.classList.remove('audience-worried'), 500);
            });
        }
    }

    // === Turn Management (Milestone 7) ===

    startTurn() {
        if (this.phase === 'gameover') return;

        this.turnNumber++;
        this.phase = 'player';
        console.log(`Turn ${this.turnNumber} started`);

        // Reset block at start of turn
        this.combatState.macguffin.block = 0;
        this.renderMacGuffinBlock();

        // Reset energy
        this.energy.current = this.energy.max;
        this.renderEnergy();

        // Reset turn-based effects and handle Encore
        this.resetTurnEffects();

        // Draw cards up to hand size
        this.drawToHandSize();

        // Render status effects
        this.renderStatusEffects();

        // Enable End Turn button
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = false;
            this.elements.endTurnBtn.textContent = 'End Turn';
        }
    }

    drawToHandSize() {
        while (this.hand.length < this.handSize) {
            const card = this.drawCard();
            if (!card) break; // No more cards
            this.hand.push(card);
        }
        this.renderHand();
    }

    async endTurn() {
        if (this.phase !== 'player' || this.isAnimating) return;

        this.isAnimating = true;
        this.phase = 'enemy';
        console.log(`Turn ${this.turnNumber} - Player phase ended`);

        // Disable End Turn button during enemy phase
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = 'Enemy Turn...';
        }

        // Deselect any selected card
        this.selectedCardIndex = null;
        this.updateCardSelection();

        // Discard remaining hand
        while (this.hand.length > 0) {
            this.discardPile.push(this.hand.pop());
        }
        this.renderHand();

        await this.wait(300);

        // Enemy executes their intent
        await this.executeEnemyTurn();

        // Tick down status effect durations at end of turn
        this.tickStatusEffects();

        this.isAnimating = false;

        // Check for game over
        if (this.combatState.macguffin.currentHP <= 0) {
            this.onDefeat();
            return;
        }

        if (this.combatState.enemy.currentHP <= 0) {
            // Already handled in onEnemyDefeated
            return;
        }

        // Start next turn
        this.startTurn();
    }

    async executeEnemyTurn() {
        const intent = this.combatState.enemy.intent;
        const hits = intent.hits || 1;
        console.log(`Enemy executes: ${intent.type} ${intent.value}${hits > 1 ? ` ×${hits}` : ''}`);

        switch (intent.type) {
            case 'attack':
                await this.enemyAttack(intent.value, hits);
                break;
            case 'block':
                await this.enemyBlock(intent.value);
                break;
            case 'heal':
                await this.enemyHeal(intent.value);
                break;
            case 'buff':
                await this.enemyBuff(intent.value);
                break;
            case 'debuff':
                await this.enemyDebuff(intent.value);
                break;
        }

        // Set next intent based on enemy pattern
        this.setNextEnemyIntent();
    }

    async enemyAttack(damage, hits = 1) {
        const enemy = this.combatState.enemy;
        const attackBubble = enemy.speechBubbles?.attack || 'ATTACK!';

        // Apply enemy attack bonus (from buff)
        let baseDamage = damage + (enemy.attackBonus || 0);

        // Apply enemy Weakness debuff (50% damage)
        if (this.statusEffects.enemyWeakness.active) {
            const reducedDamage = Math.floor(baseDamage * 0.5);
            console.log(`Enemy Weakness: damage reduced from ${baseDamage} to ${reducedDamage}`);
            baseDamage = reducedDamage;
        }

        for (let hit = 0; hit < hits; hit++) {
            if (this.combatState.macguffin.currentHP <= 0) break;

            // Trigger enemy attack animation
            this.elements.enemyPuppet.classList.remove('enemy-idle');
            this.elements.enemyPuppet.classList.add('enemy-attack');

            // Show attack bubble on first hit
            if (hit === 0) {
                this.showAttackBubble(attackBubble, this.elements.enemyPuppet);
            }

            await this.wait(350);

            this.elements.enemyPuppet.classList.remove('enemy-attack');
            this.elements.enemyPuppet.classList.add('enemy-idle');

            let currentDamage = baseDamage;

            // Apply Curtain (flat damage reduction per hit)
            if (this.statusEffects.curtain > 0) {
                const curtainReduction = Math.min(currentDamage, this.statusEffects.curtain);
                currentDamage -= curtainReduction;
                if (curtainReduction > 0) {
                    this.showSpeechBubble(`Curtain -${curtainReduction}`, 'buff', this.elements.macguffin);
                }
            }

            // Check Ward (absorbs entire hit)
            if (this.statusEffects.ward > 0 && currentDamage > 0) {
                this.statusEffects.ward--;
                this.showSpeechBubble('Ward!', 'buff', this.elements.macguffin);
                this.renderStatusEffects();
                await this.wait(300);
                continue; // Skip to next hit
            }

            // Apply Ovation (decaying shield)
            if (this.statusEffects.ovation > 0 && currentDamage > 0) {
                const ovationBlock = Math.min(currentDamage, this.statusEffects.ovation);
                currentDamage -= ovationBlock;
                this.statusEffects.ovation--;
                this.showSpeechBubble(`Ovation -${ovationBlock}`, 'buff', this.elements.macguffin);
                this.renderStatusEffects();
            }

            // Calculate damage after block
            const block = this.combatState.macguffin.block;
            const damageAfterBlock = Math.max(0, currentDamage - block);
            const blockedAmount = Math.min(block, currentDamage);

            // Consume block
            this.combatState.macguffin.block = Math.max(0, block - currentDamage);
            this.renderMacGuffinBlock();

            if (blockedAmount > 0) {
                this.showSpeechBubble(`Blocked ${blockedAmount}`, 'block', this.elements.macguffin);
            }

            if (damageAfterBlock > 0) {
                // Trigger MacGuffin hurt animation
                this.elements.macguffin.classList.remove('macguffin-idle');
                this.elements.macguffin.classList.add('macguffin-hurt');

                // Show damage bubble
                this.showDamageBubble(damageAfterBlock, this.elements.macguffin);

                // Apply damage to MacGuffin
                this.combatState.macguffin.currentHP = Math.max(0, this.combatState.macguffin.currentHP - damageAfterBlock);
                this.renderMacGuffinHP();

                await this.wait(400);

                this.elements.macguffin.classList.remove('macguffin-hurt');
                this.elements.macguffin.classList.add('macguffin-idle');
            }

            // Brief pause between hits for multi-attack
            if (hit < hits - 1) {
                await this.wait(200);
            }
        }
    }

    async enemyBlock(amount) {
        // Enemy gains block (stored in enemy state for future use)
        console.log(`Enemy blocks for ${amount}`);
        this.showCharacterBubble('CLANK.', this.elements.enemyPuppet);
        await this.wait(500);
    }

    async enemyHeal(amount) {
        const maxHP = this.combatState.enemy.maxHP;
        const oldHP = this.combatState.enemy.currentHP;
        this.combatState.enemy.currentHP = Math.min(maxHP, oldHP + amount);
        const healed = this.combatState.enemy.currentHP - oldHP;

        if (healed > 0) {
            this.showHealBubble(healed, this.elements.enemyPuppet);
            this.renderEnemyHP();
        }
        await this.wait(500);
    }

    async enemyBuff(amount) {
        const enemy = this.combatState.enemy;
        const buffBubble = enemy.speechBubbles?.buff || 'POWER UP!';

        // Enemy gains attack power (increase all pattern attack values)
        this.showSpeechBubble(buffBubble, 'buff', this.elements.enemyPuppet);

        // Store the buff as a multiplier/addition
        if (!enemy.attackBonus) enemy.attackBonus = 0;
        enemy.attackBonus += amount;

        this.showSpeechBubble(`+${amount} Attack`, 'buff', this.elements.enemyPuppet);
        console.log(`Enemy gained +${amount} attack, total bonus: ${enemy.attackBonus}`);

        await this.wait(500);
    }

    async enemyDebuff(duration) {
        const enemy = this.combatState.enemy;
        const debuffBubble = enemy.speechBubbles?.debuff || 'CURSED!';

        // Randomly choose a debuff type and target
        const debuffTypes = ['stageFright', 'weakness', 'heckled'];
        const debuffType = debuffTypes[Math.floor(Math.random() * debuffTypes.length)];
        const targetHero = Math.random() < 0.5 ? 'aldric' : 'pip';

        // Show debuff animation
        this.showSpeechBubble(debuffBubble, 'debuff', this.elements.enemyPuppet);

        switch (debuffType) {
            case 'stageFright':
                this.statusEffects.stageFright = { active: true, duration: duration, target: targetHero };
                this.showSpeechBubble(`Stage Fright!`, 'debuff', this.elements.macguffin);
                console.log(`Applied Stage Fright to ${targetHero} for ${duration} turns`);
                break;
            case 'weakness':
                this.statusEffects.weakness = { active: true, duration: duration };
                this.showSpeechBubble('Weakened!', 'debuff', this.elements.macguffin);
                console.log(`Applied Weakness for ${duration} turns`);
                break;
            case 'heckled':
                this.statusEffects.heckled = { active: true, duration: duration, target: targetHero };
                this.showSpeechBubble(`Heckled!`, 'debuff', this.elements.macguffin);
                console.log(`Applied Heckled to ${targetHero} for ${duration} turns`);
                break;
        }

        this.renderStatusEffects();
        this.renderHand(); // Re-render to show cost changes
        await this.wait(500);
    }

    setNextEnemyIntent() {
        const enemy = this.combatState.enemy;
        const patterns = this.enemyPatterns[enemy.id] || [{ type: 'attack', value: 5, hits: 1 }];

        // Advance pattern index
        enemy.patternIndex = (enemy.patternIndex + 1) % patterns.length;
        const nextIntent = patterns[enemy.patternIndex];

        enemy.intent = { ...nextIntent };
        this.renderEnemyIntent();
    }

    onDefeat() {
        this.phase = 'gameover';
        console.log('MacGuffin destroyed - Defeat!');

        // Show defeat message
        this.showCharacterBubble('NOOO!', this.elements.macguffin);

        // Disable controls
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = 'Defeated';
        }

        // Future: show defeat screen
    }

    drawCard() {
        if (this.deck.length === 0) {
            // Shuffle discard pile into deck
            if (this.discardPile.length === 0) return null;
            this.deck = [...this.discardPile];
            this.discardPile = [];
            this.shuffleDeck();
        }
        return this.deck.pop();
    }

    renderHand() {
        const container = this.elements.handCards;
        if (!container) return;

        // Clear existing cards
        container.innerHTML = '';

        // Render each card in hand
        this.hand.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            container.appendChild(cardElement);
        });
    }

    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'game-card';
        cardDiv.dataset.index = index;
        cardDiv.dataset.cardId = card.id;
        cardDiv.dataset.instanceId = card.instanceId;

        // Add owner class for protagonist edge treatment
        cardDiv.classList.add(`card-${card.owner}`);

        // Add rarity class
        const rarity = card.rarity || 'common';
        cardDiv.classList.add(`rarity-${rarity}`);

        // Calculate effective cost (Stage Fright adds +1)
        const effectiveCost = this.getEffectiveCardCost(card);
        const isPlayable = effectiveCost <= this.energy.current;
        if (!isPlayable) {
            cardDiv.classList.add('unplayable');
        }

        // Top rarity border
        const rarityTop = document.createElement('div');
        rarityTop.className = 'card__rarity-top';
        cardDiv.appendChild(rarityTop);

        // Card content container
        const content = document.createElement('div');
        content.className = 'card__content';

        // Stub with energy blips
        const stub = document.createElement('div');
        stub.className = 'card__stub';

        const energyContainer = document.createElement('div');
        energyContainer.className = 'card__energy';

        // Add energy blips based on effective cost
        for (let i = 0; i < effectiveCost; i++) {
            const blip = document.createElement('div');
            blip.className = `energy-blip energy-blip--${card.owner}`;
            energyContainer.appendChild(blip);
        }
        stub.appendChild(energyContainer);
        content.appendChild(stub);

        // Perforation line
        const perforation = document.createElement('div');
        perforation.className = 'card__perforation';
        content.appendChild(perforation);

        // Card body
        const body = document.createElement('div');
        body.className = 'card__body';

        // "PRESENTING" header
        const presenting = document.createElement('div');
        presenting.className = 'card__presenting';
        presenting.textContent = '— PRESENTING —';
        body.appendChild(presenting);

        // Card name
        const nameSpan = document.createElement('div');
        nameSpan.className = 'card__name';
        nameSpan.textContent = card.name;
        body.appendChild(nameSpan);

        // Decorative rule
        const rule = document.createElement('div');
        rule.className = 'card__rule';
        body.appendChild(rule);

        // Card description
        const descSpan = document.createElement('div');
        descSpan.className = 'card__description';
        descSpan.textContent = card.description;
        body.appendChild(descSpan);

        // Type badge
        const cardType = this.getCardType(card);
        const typeBadge = document.createElement('div');
        typeBadge.className = `card__type-badge type-${cardType.lowercase}`;
        typeBadge.textContent = `${cardType.icon}  ${cardType.label}`;
        body.appendChild(typeBadge);

        content.appendChild(body);

        // Aldric edge with rivets
        if (card.owner === 'aldric') {
            const edge = document.createElement('div');
            edge.className = 'card__edge';
            for (let i = 0; i < 4; i++) {
                const rivet = document.createElement('div');
                rivet.className = 'card__rivet';
                edge.appendChild(rivet);
            }
            content.appendChild(edge);
        }

        cardDiv.appendChild(content);

        // Bottom rarity border
        const rarityBottom = document.createElement('div');
        rarityBottom.className = 'card__rarity-bottom';
        cardDiv.appendChild(rarityBottom);

        return cardDiv;
    }

    getCardType(card) {
        // Check if card has damage effects
        const hasDamage = card.effects?.some(e => e.type === 'damage' || e.type === 'grandFinale');
        // Check if card has block effects
        const hasBlock = card.effects?.some(e => e.type === 'block');

        if (hasDamage) {
            return { icon: '⚔', label: 'ATTACK', lowercase: 'attack' };
        } else if (hasBlock) {
            return { icon: '🛡', label: 'DEFENSE', lowercase: 'defense' };
        } else {
            return { icon: '✦', label: 'ACTION', lowercase: 'action' };
        }
    }

    bindEvents() {
        // End turn button
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.addEventListener('click', () => {
                this.onEndTurn();
            });
        }

        // Card long-press and tap handling (using event delegation)
        if (this.elements.handCards) {
            // Track if long-press was triggered to prevent click
            let longPressTriggered = false;

            // Mouse events for desktop
            this.elements.handCards.addEventListener('mousedown', (e) => {
                const card = e.target.closest('.game-card');
                if (card) {
                    longPressTriggered = false;
                    const index = parseInt(card.dataset.index, 10);
                    this.startLongPress(index, card, () => { longPressTriggered = true; });
                }
            });

            this.elements.handCards.addEventListener('mouseup', () => {
                this.cancelLongPress();
            });

            this.elements.handCards.addEventListener('mouseleave', () => {
                this.cancelLongPress();
            });

            // Touch events for mobile
            this.elements.handCards.addEventListener('touchstart', (e) => {
                const card = e.target.closest('.game-card');
                if (card) {
                    longPressTriggered = false;
                    const index = parseInt(card.dataset.index, 10);
                    this.startLongPress(index, card, () => { longPressTriggered = true; });
                }
            }, { passive: true });

            this.elements.handCards.addEventListener('touchend', () => {
                this.cancelLongPress();
            });

            this.elements.handCards.addEventListener('touchcancel', () => {
                this.cancelLongPress();
            });

            // Click handling (only if not long-press)
            this.elements.handCards.addEventListener('click', (e) => {
                if (longPressTriggered) {
                    longPressTriggered = false;
                    return;
                }
                const card = e.target.closest('.game-card');
                if (card) {
                    const index = parseInt(card.dataset.index, 10);
                    this.onCardTap(index);
                }
            });
        }

        // Dismiss card zoom on click anywhere
        document.addEventListener('click', (e) => {
            if (this.zoomedCard !== null) {
                // Check if click is outside the zoomed card
                const zoomedEl = document.querySelector('.card-zoom-overlay');
                if (zoomedEl && !zoomedEl.contains(e.target)) {
                    this.hideCardZoom();
                }
            }
        });

        // Dismiss card zoom on any tap in the overlay
        document.addEventListener('click', (e) => {
            if (e.target.closest('.card-zoom-overlay')) {
                this.hideCardZoom();
            }
        });

        // Puppet tap handling
        const puppets = [
            this.elements.enemyPuppet,
            this.elements.heroAldric,
            this.elements.heroPip,
            this.elements.macguffin
        ];

        puppets.forEach(puppet => {
            if (puppet) {
                puppet.addEventListener('click', () => {
                    this.onPuppetTap(puppet);
                });
            }
        });

        // Status icon tap handling (event delegation on stage area)
        document.addEventListener('click', (e) => {
            const statusIcon = e.target.closest('.status-icon');
            if (statusIcon) {
                const title = statusIcon.getAttribute('title');
                if (title) {
                    // Convert title to keyword key (e.g., "Stage Fright" -> "stageFright")
                    const keywordKey = this.titleToKeywordKey(title);
                    if (keywordKey && KEYWORD_GLOSSARY[keywordKey]) {
                        this.showAudienceExplanation(keywordKey);
                    }
                }
            }
        });

        // Rewards screen buttons (Milestone 10)
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.addEventListener('click', () => {
                this.confirmReward();
            });
        }
        if (this.elements.skipRewardBtn) {
            this.elements.skipRewardBtn.addEventListener('click', () => {
                this.skipReward();
            });
        }
        // Reward card selection (event delegation)
        if (this.elements.rewardsCards) {
            this.elements.rewardsCards.addEventListener('click', (e) => {
                const card = e.target.closest('.reward-card');
                if (card) {
                    const index = parseInt(card.dataset.index, 10);
                    this.selectReward(index);
                }
            });
        }
    }

    // Convert status title to keyword key
    titleToKeywordKey(title) {
        const mapping = {
            'Ward': 'ward',
            'Ovation': 'ovation',
            'Curtain': 'curtain',
            'Stage Fright': 'stageFright',
            'Weakness': 'weakness',
            'Heckled': 'heckled',
            'Charged': 'charged',
            'Encore': 'encore',
            'Piercing': 'piercing',
            'Block': 'block',
            'Fortify': 'fortify',
            'Persistent': 'persistent'
        };
        return mapping[title] || null;
    }

    // === Long-press and Card Zoom System ===

    startLongPress(cardIndex, cardElement, onTriggered) {
        this.cancelLongPress(); // Clear any existing timer

        this.longPressTimer = setTimeout(() => {
            onTriggered();
            this.showCardZoom(cardIndex, cardElement);
        }, this.longPressDuration);
    }

    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    showCardZoom(cardIndex, originalCardElement) {
        const card = this.hand[cardIndex];
        if (!card) return;

        this.zoomedCard = cardIndex;

        // Create zoom overlay
        const overlay = document.createElement('div');
        overlay.className = 'card-zoom-overlay';

        // Create enlarged card using the same structure as createCardElement
        const zoomedCardDiv = this.createZoomedCardElement(card);

        overlay.appendChild(zoomedCardDiv);
        document.body.appendChild(overlay);

        this.zoomedCardElement = overlay;

        // Show keyword explanations via audience
        if (card.keywords && card.keywords.length > 0) {
            this.showKeywordExplanations(card.keywords);
        }
    }

    createZoomedCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `game-card zoomed card-${card.owner}`;

        // Add rarity class
        const rarity = card.rarity || 'common';
        cardDiv.classList.add(`rarity-${rarity}`);

        const effectiveCost = this.getEffectiveCardCost(card);

        // Top rarity border
        const rarityTop = document.createElement('div');
        rarityTop.className = 'card__rarity-top';
        cardDiv.appendChild(rarityTop);

        // Card content container
        const content = document.createElement('div');
        content.className = 'card__content';

        // Stub with energy blips
        const stub = document.createElement('div');
        stub.className = 'card__stub';

        const energyContainer = document.createElement('div');
        energyContainer.className = 'card__energy';

        for (let i = 0; i < effectiveCost; i++) {
            const blip = document.createElement('div');
            blip.className = `energy-blip energy-blip--${card.owner}`;
            energyContainer.appendChild(blip);
        }
        stub.appendChild(energyContainer);
        content.appendChild(stub);

        // Perforation line
        const perforation = document.createElement('div');
        perforation.className = 'card__perforation';
        content.appendChild(perforation);

        // Card body
        const body = document.createElement('div');
        body.className = 'card__body';

        // "PRESENTING" header
        const presenting = document.createElement('div');
        presenting.className = 'card__presenting';
        presenting.textContent = '— PRESENTING —';
        body.appendChild(presenting);

        // Card name
        const nameSpan = document.createElement('div');
        nameSpan.className = 'card__name';
        nameSpan.textContent = card.name;
        body.appendChild(nameSpan);

        // Decorative rule
        const rule = document.createElement('div');
        rule.className = 'card__rule';
        body.appendChild(rule);

        // Card description
        const descSpan = document.createElement('div');
        descSpan.className = 'card__description';
        descSpan.textContent = card.description;
        body.appendChild(descSpan);

        // Type badge
        const cardType = this.getCardType(card);
        const typeBadge = document.createElement('div');
        typeBadge.className = `card__type-badge type-${cardType.lowercase}`;
        typeBadge.textContent = `${cardType.icon}  ${cardType.label}`;
        body.appendChild(typeBadge);

        content.appendChild(body);

        // Aldric edge with rivets
        if (card.owner === 'aldric') {
            const edge = document.createElement('div');
            edge.className = 'card__edge';
            for (let i = 0; i < 5; i++) {
                const rivet = document.createElement('div');
                rivet.className = 'card__rivet';
                edge.appendChild(rivet);
            }
            content.appendChild(edge);
        }

        cardDiv.appendChild(content);

        // Bottom rarity border
        const rarityBottom = document.createElement('div');
        rarityBottom.className = 'card__rarity-bottom';
        cardDiv.appendChild(rarityBottom);

        return cardDiv;
    }

    hideCardZoom() {
        if (this.zoomedCardElement) {
            this.zoomedCardElement.remove();
            this.zoomedCardElement = null;
        }
        this.zoomedCard = null;

        // Clear explanation bubbles and pagination
        this.clearKeywordExplanations();
    }

    showKeywordExplanations(keywords) {
        this.explanationKeywords = keywords;
        this.explanationPage = 0;
        this.showExplanationPage();
    }

    showExplanationPage() {
        // Clear existing bubbles
        this.clearExplanationBubbles();

        const keywords = this.explanationKeywords;
        const startIndex = this.explanationPage * 3;
        const pageKeywords = keywords.slice(startIndex, startIndex + 3);

        if (pageKeywords.length === 0) {
            // Loop back to first page
            this.explanationPage = 0;
            if (keywords.length > 0) {
                this.showExplanationPage();
            }
            return;
        }

        // Get random audience members for each explanation
        const audienceMembers = this.getRandomAudienceMembers(pageKeywords.length);

        pageKeywords.forEach((keyword, index) => {
            const glossaryEntry = KEYWORD_GLOSSARY[keyword];
            if (!glossaryEntry) return;

            const audienceMember = audienceMembers[index];
            if (!audienceMember) return;

            const bubbleText = `${glossaryEntry.icon} ${glossaryEntry.name}: ${glossaryEntry.explanation}`;
            this.showAudienceBubble(bubbleText, audienceMember, index * 150);
        });

        // If there are more keywords, schedule next page
        if (keywords.length > (this.explanationPage + 1) * 3) {
            this.explanationPaginationTimer = setTimeout(() => {
                this.explanationPage++;
                this.showExplanationPage();
            }, 4000); // Show each page for 4 seconds
        } else if (keywords.length > 3) {
            // Loop back after showing all
            this.explanationPaginationTimer = setTimeout(() => {
                this.explanationPage = 0;
                this.showExplanationPage();
            }, 4000);
        }
    }

    clearExplanationBubbles() {
        this.explanationBubbles.forEach(bubble => bubble.remove());
        this.explanationBubbles = [];
    }

    clearKeywordExplanations() {
        if (this.explanationPaginationTimer) {
            clearTimeout(this.explanationPaginationTimer);
            this.explanationPaginationTimer = null;
        }
        this.clearExplanationBubbles();
        this.explanationKeywords = [];
        this.explanationPage = 0;
    }

    getRandomAudienceMembers(count) {
        if (!this.audienceMembers || this.audienceMembers.length === 0) return [];

        const shuffled = [...this.audienceMembers].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    showAudienceBubble(text, audienceMember, delay = 0) {
        setTimeout(() => {
            const bubble = document.createElement('div');
            bubble.className = 'audience-bubble';
            bubble.textContent = text;

            // Position above the audience member
            const memberRect = audienceMember.getBoundingClientRect();
            const containerRect = this.elements.container.getBoundingClientRect();

            // Calculate left position, clamping to stay within container
            const rawLeft = memberRect.left - containerRect.left + memberRect.width / 2;
            const minLeft = 110; // Half of max-width + some padding
            const maxLeft = containerRect.width - 110;
            const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));

            bubble.style.left = `${clampedLeft}px`;
            bubble.style.bottom = `${containerRect.bottom - memberRect.top + 10}px`;

            this.elements.container.appendChild(bubble);
            this.explanationBubbles.push(bubble);

            // Animate in
            requestAnimationFrame(() => {
                bubble.classList.add('visible');
            });
        }, delay);
    }

    showAudienceExplanation(keywordKey) {
        const glossaryEntry = KEYWORD_GLOSSARY[keywordKey];
        if (!glossaryEntry) return;

        // Get a random audience member
        const audienceMembers = this.getRandomAudienceMembers(1);
        if (audienceMembers.length === 0) return;

        // Clear any existing explanation bubbles
        this.clearExplanationBubbles();

        const bubbleText = `${glossaryEntry.icon} ${glossaryEntry.name}: ${glossaryEntry.explanation}`;
        this.showAudienceBubble(bubbleText, audienceMembers[0]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            this.clearExplanationBubbles();
        }, 4000);
    }

    onEndTurn() {
        if (this.phase !== 'player' || this.isAnimating) return;
        this.endTurn();
    }

    onCardTap(index) {
        // If card is zoomed, dismiss zoom instead of processing tap
        if (this.zoomedCard !== null) {
            this.hideCardZoom();
            return;
        }

        if (this.isAnimating) return;

        const card = this.hand[index];
        console.log('Card tapped:', index, card);

        if (this.selectedCardIndex === index) {
            // Tapping already selected card - try to play it
            if (this.canPlayCard(card)) {
                this.playCard(index);
            } else {
                // Can't play - just deselect
                this.selectedCardIndex = null;
                this.updateCardSelection();
            }
        } else {
            // Select this card
            this.selectedCardIndex = index;
            this.updateCardSelection();
        }
    }

    canPlayCard(card) {
        if (this.phase !== 'player') return false;

        // Calculate effective cost (Stage Fright adds +1)
        let effectiveCost = card.cost;
        if (this.statusEffects.stageFright.active &&
            this.statusEffects.stageFright.target === card.owner) {
            effectiveCost += 1;
        }

        return effectiveCost <= this.energy.current;
    }

    getEffectiveCardCost(card) {
        let cost = card.cost;
        if (this.statusEffects.stageFright.active &&
            this.statusEffects.stageFright.target === card.owner) {
            cost += 1;
        }
        return cost;
    }

    async playCard(index) {
        const card = this.hand[index];
        if (!this.canPlayCard(card)) return;

        this.isAnimating = true;
        console.log('Playing card:', card.name);

        // Deduct effective energy cost
        const effectiveCost = this.getEffectiveCardCost(card);
        this.energy.current -= effectiveCost;
        this.renderEnergy();

        // Get the card element for animation
        const cardElements = this.elements.handCards.querySelectorAll('.game-card');
        const cardEl = cardElements[index];

        // Animate card being played
        if (cardEl) {
            cardEl.classList.add('playing');
            await this.wait(300);
        }

        // Execute card effects
        await this.executeCardEffects(card);

        // Remove card from hand and add to discard
        this.hand.splice(index, 1);
        this.discardPile.push(card);

        // Clear selection
        this.selectedCardIndex = null;

        // Re-render hand
        this.renderHand();

        this.isAnimating = false;
    }

    async executeCardEffects(card) {
        // Track cards played for Grand Finale
        this.statusEffects.cardsPlayedThisTurn++;

        // Handle Charged keyword
        if (card.keywords?.includes('charged')) {
            if (this.statusEffects.lastAttacker === card.owner) {
                this.statusEffects.chargedCount++;
            } else {
                this.statusEffects.chargedCount = 1;
                this.statusEffects.lastAttacker = card.owner;
            }
        } else if (card.type === 'attack') {
            // Non-charged attack resets the counter if different hero
            if (this.statusEffects.lastAttacker !== card.owner) {
                this.statusEffects.chargedCount = 0;
            }
            this.statusEffects.lastAttacker = card.owner;
        }

        // Check for Heckled debuff (self-damage on play)
        if (this.statusEffects.heckled.active &&
            this.statusEffects.heckled.target === card.owner) {
            this.combatState.macguffin.currentHP = Math.max(0, this.combatState.macguffin.currentHP - 1);
            this.renderMacGuffinHP();
            this.showDamageBubble(1, this.elements.macguffin);
            await this.wait(200);
        }

        for (const effect of card.effects) {
            switch (effect.type) {
                case 'damage':
                    await this.dealDamageToEnemy(effect.value, card);
                    break;
                case 'block':
                    await this.gainBlock(effect.value, card);
                    break;
                case 'draw':
                    await this.drawCards(effect.value);
                    break;
                case 'heal':
                    await this.healMacGuffin(effect.value, card);
                    break;
                case 'energy':
                    await this.gainEnergy(effect.value);
                    break;
                // New keyword effects
                case 'ward':
                    await this.gainWard(effect.value, card);
                    break;
                case 'ovation':
                    await this.gainOvation(effect.value, card);
                    break;
                case 'curtain':
                    await this.gainCurtain(effect.value, card);
                    break;
                case 'applyDebuff':
                    await this.applyDebuffToEnemy(effect.debuff, effect.duration);
                    break;
                case 'cleanse':
                    await this.cleanseDeBufss();
                    break;
                case 'desperatePlea':
                    await this.desperatePlea(effect.max, card);
                    break;
                case 'grandFinale':
                    await this.grandFinale(effect.damagePerCard, card);
                    break;
            }
        }

        // Handle Encore keyword - save card for next turn
        if (card.keywords?.includes('encore') && this.statusEffects.cardsPlayedThisTurn === this.hand.length + 1) {
            // This was the last card played this turn
            this.encoreCard = { ...card, instanceId: `${card.id}-encore-${Date.now()}` };
            this.showCharacterBubble('ENCORE!', card.owner === 'aldric' ? this.elements.heroAldric : this.elements.heroPip);
        }
    }

    async healMacGuffin(amount, sourceCard) {
        const maxHP = this.combatState.macguffin.maxHP;
        const oldHP = this.combatState.macguffin.currentHP;
        this.combatState.macguffin.currentHP = Math.min(maxHP, oldHP + amount);
        const healed = this.combatState.macguffin.currentHP - oldHP;

        if (healed > 0) {
            if (sourceCard.speechBubble) {
                this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
            }
            this.showHealBubble(healed, this.elements.macguffin);
            this.renderMacGuffinHP();
        }
        await this.wait(200);
    }

    async gainEnergy(amount) {
        this.energy.current = Math.min(this.energy.max + amount, this.energy.current + amount);
        this.renderEnergy();
        await this.wait(100);
    }

    // === Keyword Effects (Milestone 13-15) ===

    async gainWard(amount, sourceCard) {
        this.statusEffects.ward += amount;
        console.log(`Gained Ward ${amount}, total: ${this.statusEffects.ward}`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }
        this.showSpeechBubble(`Ward ${this.statusEffects.ward}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();
        await this.wait(200);
    }

    async gainOvation(amount, sourceCard) {
        this.statusEffects.ovation += amount;
        console.log(`Gained Ovation ${amount}, total: ${this.statusEffects.ovation}`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }
        this.showSpeechBubble(`Ovation ${this.statusEffects.ovation}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();
        await this.wait(200);
    }

    async gainCurtain(amount, sourceCard) {
        this.statusEffects.curtain += amount;
        console.log(`Gained Curtain ${amount}, total: ${this.statusEffects.curtain}`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }
        this.showSpeechBubble(`Curtain ${this.statusEffects.curtain}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();
        await this.wait(200);
    }

    async applyDebuffToEnemy(debuff, duration) {
        if (debuff === 'weakness') {
            this.statusEffects.enemyWeakness = { active: true, duration: duration };
            console.log(`Applied Weakness to enemy for ${duration} turns`);
            this.showSpeechBubble('Weakened!', 'debuff', this.elements.enemyPuppet);
        }
        this.renderStatusEffects();
        await this.wait(200);
    }

    async cleanseDeBufss() {
        let cleansed = false;

        if (this.statusEffects.stageFright.active) {
            this.statusEffects.stageFright = { active: false, duration: 0, target: null };
            cleansed = true;
        }
        if (this.statusEffects.weakness.active) {
            this.statusEffects.weakness = { active: false, duration: 0 };
            cleansed = true;
        }
        if (this.statusEffects.heckled.active) {
            this.statusEffects.heckled = { active: false, duration: 0, target: null };
            cleansed = true;
        }

        if (cleansed) {
            console.log('Cleansed all debuffs');
            this.showSpeechBubble('Cleansed!', 'heal', this.elements.macguffin);
        }
        this.renderStatusEffects();
        await this.wait(200);
    }

    async desperatePlea(max, sourceCard) {
        const missingHP = this.combatState.macguffin.maxHP - this.combatState.macguffin.currentHP;
        const blockGain = Math.min(missingHP, max);

        if (blockGain > 0) {
            await this.gainBlock(blockGain, sourceCard);
        }
    }

    async grandFinale(damagePerCard, sourceCard) {
        const cardsPlayed = this.statusEffects.cardsPlayedThisTurn;
        const totalDamage = cardsPlayed * damagePerCard;

        console.log(`Grand Finale: ${cardsPlayed} cards × ${damagePerCard} = ${totalDamage} damage`);
        await this.dealDamageToEnemy(totalDamage, sourceCard);
    }

    async dealDamageToEnemy(amount, sourceCard) {
        // Apply hero attack bonus (Bron gets +2)
        let finalDamage = amount;
        if (sourceCard.owner === 'aldric') {
            finalDamage += 2; // Bron's attack bonus
        }

        // Apply Charged keyword bonus
        if (sourceCard.keywords?.includes('charged') && this.statusEffects.chargedCount > 1) {
            const chargedBonus = (this.statusEffects.chargedCount - 1) * (sourceCard.chargedBonus || 2);
            finalDamage += chargedBonus;
            console.log(`Charged bonus: +${chargedBonus} (${this.statusEffects.chargedCount} consecutive)`);
        }

        // Apply player Weakness debuff (50% damage)
        if (this.statusEffects.weakness.active) {
            finalDamage = Math.floor(finalDamage * 0.5);
            console.log(`Weakness applied: damage reduced to ${finalDamage}`);
        }

        console.log(`Dealing ${finalDamage} damage to enemy`);

        // Trigger attack animation on the hero
        const heroElement = sourceCard.owner === 'aldric'
            ? this.elements.heroAldric
            : sourceCard.owner === 'pip'
                ? this.elements.heroPip
                : null;

        if (heroElement) {
            const idleClass = `${sourceCard.owner}-idle`;
            const attackClass = `${sourceCard.owner}-attack`;
            heroElement.classList.remove(idleClass);
            heroElement.classList.add(attackClass);

            // Show attack speech bubble from the hero
            if (sourceCard.speechBubble) {
                this.showAttackBubble(sourceCard.speechBubble, heroElement);
            }

            await this.wait(350);

            heroElement.classList.remove(attackClass);
            heroElement.classList.add(idleClass);
        }

        // Trigger enemy hurt animation
        this.elements.enemyPuppet.classList.remove('enemy-idle');
        this.elements.enemyPuppet.classList.add('enemy-hurt');

        // Show damage number on enemy
        this.showDamageBubble(finalDamage, this.elements.enemyPuppet);

        // Apply damage
        this.combatState.enemy.currentHP = Math.max(0, this.combatState.enemy.currentHP - finalDamage);
        this.renderEnemyHP();

        await this.wait(300);

        this.elements.enemyPuppet.classList.remove('enemy-hurt');
        this.elements.enemyPuppet.classList.add('enemy-idle');

        // Check for enemy defeat
        if (this.combatState.enemy.currentHP <= 0) {
            this.onEnemyDefeated();
        }
    }

    async gainBlock(amount, sourceCard) {
        // Apply hero defense bonus (Bron gets +2 on his block cards)
        let finalBlock = amount;
        if (sourceCard.owner === 'aldric') {
            finalBlock += 2; // Bron's defense specialty
        }

        console.log(`Gaining ${finalBlock} block`);

        // Show defense speech bubble
        if (sourceCard.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        // Show block gained bubble
        this.showBlockBubble(finalBlock, this.elements.macguffin);

        this.combatState.macguffin.block += finalBlock;
        this.renderMacGuffinBlock();

        await this.wait(200);
    }

    async drawCards(count) {
        console.log(`Drawing ${count} card(s)`);
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            if (card) {
                this.hand.push(card);
            }
        }
        this.renderHand();
        await this.wait(200);
    }

    onEnemyDefeated() {
        this.phase = 'reward';
        const enemy = this.combatState.enemy;
        console.log(`${enemy.name} defeated!`);

        this.elements.enemyPuppet.classList.remove('enemy-idle', 'enemy-hurt');
        this.elements.enemyPuppet.classList.add('enemy-defeat');

        // Show defeated speech bubble
        if (enemy.speechBubbles?.defeated) {
            this.showCharacterBubble(enemy.speechBubbles.defeated, this.elements.enemyPuppet);
        }

        // Show victory message
        setTimeout(() => {
            this.showCharacterBubble('WE DID IT!', this.elements.heroAldric);
        }, 500);

        // Disable controls
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = enemy.isBoss ? 'Boss Defeated!' : 'Victory!';
        }

        // Update progress
        this.updateProgressIndicator();

        // Show rewards after a brief delay (skip for boss - goes straight to act complete)
        if (enemy.isBoss) {
            setTimeout(() => this.advanceScene(), 2000);
        } else {
            setTimeout(() => this.showRewardsScreen(), 1500);
        }
    }

    // === Card Rewards System (Milestone 10) ===

    showRewardsScreen() {
        // Generate 3 reward options: 1 from Bron, 1 from Pip, 1 neutral
        this.rewardOptions = [
            this.getRandomCardFromPool('aldric'),
            this.getRandomCardFromPool('pip'),
            this.getRandomCardFromPool('neutral')
        ];
        this.selectedRewardIndex = null;

        // Render reward cards
        this.renderRewardCards();

        // Show overlay
        if (this.elements.rewardsOverlay) {
            this.elements.rewardsOverlay.style.display = 'flex';
        }

        // Reset button state
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.disabled = true;
        }
    }

    getRandomCardFromPool(pool) {
        const cardIds = CARD_POOLS[pool];
        if (!cardIds || cardIds.length === 0) return null;
        const randomId = cardIds[Math.floor(Math.random() * cardIds.length)];
        return { ...CARD_DEFINITIONS[randomId] };
    }

    renderRewardCards() {
        const container = this.elements.rewardsCards;
        if (!container) return;

        container.innerHTML = '';

        this.rewardOptions.forEach((card, index) => {
            if (!card) return;

            const cardDiv = document.createElement('div');
            cardDiv.className = `game-card reward-card card-${card.owner}`;
            cardDiv.dataset.index = index;

            // Add rarity class
            const rarity = card.rarity || 'common';
            cardDiv.classList.add(`rarity-${rarity}`);

            // Top rarity border
            const rarityTop = document.createElement('div');
            rarityTop.className = 'card__rarity-top';
            cardDiv.appendChild(rarityTop);

            // Card content container
            const content = document.createElement('div');
            content.className = 'card__content';

            // Stub with energy blips
            const stub = document.createElement('div');
            stub.className = 'card__stub';

            const energyContainer = document.createElement('div');
            energyContainer.className = 'card__energy';

            for (let i = 0; i < card.cost; i++) {
                const blip = document.createElement('div');
                blip.className = `energy-blip energy-blip--${card.owner}`;
                energyContainer.appendChild(blip);
            }
            stub.appendChild(energyContainer);
            content.appendChild(stub);

            // Perforation line
            const perforation = document.createElement('div');
            perforation.className = 'card__perforation';
            content.appendChild(perforation);

            // Card body
            const body = document.createElement('div');
            body.className = 'card__body';

            // "PRESENTING" header
            const presenting = document.createElement('div');
            presenting.className = 'card__presenting';
            presenting.textContent = '— PRESENTING —';
            body.appendChild(presenting);

            // Card name
            const nameSpan = document.createElement('div');
            nameSpan.className = 'card__name';
            nameSpan.textContent = card.name;
            body.appendChild(nameSpan);

            // Decorative rule
            const rule = document.createElement('div');
            rule.className = 'card__rule';
            body.appendChild(rule);

            // Card description
            const descSpan = document.createElement('div');
            descSpan.className = 'card__description';
            descSpan.textContent = card.description;
            body.appendChild(descSpan);

            // Type badge
            const cardType = this.getCardType(card);
            const typeBadge = document.createElement('div');
            typeBadge.className = `card__type-badge type-${cardType.lowercase}`;
            typeBadge.textContent = `${cardType.icon}  ${cardType.label}`;
            body.appendChild(typeBadge);

            content.appendChild(body);

            // Aldric edge with rivets
            if (card.owner === 'aldric') {
                const edge = document.createElement('div');
                edge.className = 'card__edge';
                for (let i = 0; i < 4; i++) {
                    const rivet = document.createElement('div');
                    rivet.className = 'card__rivet';
                    edge.appendChild(rivet);
                }
                content.appendChild(edge);
            }

            cardDiv.appendChild(content);

            // Bottom rarity border
            const rarityBottom = document.createElement('div');
            rarityBottom.className = 'card__rarity-bottom';
            cardDiv.appendChild(rarityBottom);

            container.appendChild(cardDiv);
        });
    }

    selectReward(index) {
        this.selectedRewardIndex = index;

        // Update visual selection
        const cards = this.elements.rewardsCards.querySelectorAll('.reward-card');
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Enable confirm button
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.disabled = false;
        }
    }

    confirmReward() {
        if (this.selectedRewardIndex === null) return;

        const selectedCard = this.rewardOptions[this.selectedRewardIndex];
        if (selectedCard) {
            // Add card to deck (discard pile so it shuffles in next combat)
            const newCard = {
                ...selectedCard,
                instanceId: `${selectedCard.id}-reward-${Date.now()}`
            };
            this.discardPile.push(newCard);
            console.log(`Added ${selectedCard.name} to deck`);
        }

        this.hideRewardsScreen();
    }

    skipReward() {
        console.log('Skipped card reward');
        this.hideRewardsScreen();
    }

    hideRewardsScreen() {
        if (this.elements.rewardsOverlay) {
            this.elements.rewardsOverlay.style.display = 'none';
        }

        // Reset state
        this.rewardOptions = [];
        this.selectedRewardIndex = null;

        // Advance to next scene
        this.advanceScene();
    }

    // === Title & Character Select (Milestone 16) ===

    showTitleScreen() {
        this.runState.phase = 'menu';

        if (this.elements.titleScreen) {
            this.elements.titleScreen.style.display = 'flex';
        }
        if (this.elements.characterSelect) {
            this.elements.characterSelect.style.display = 'none';
        }

        // Bind button (use onclick to avoid duplicate listeners)
        if (this.elements.newPerformanceBtn) {
            this.elements.newPerformanceBtn.onclick = () => this.showCharacterSelect();
        }
    }

    showCharacterSelect() {
        this.runState.phase = 'character-select';

        if (this.elements.titleScreen) {
            this.elements.titleScreen.style.display = 'none';
        }
        if (this.elements.characterSelect) {
            this.elements.characterSelect.style.display = 'flex';
        }

        // Bind protagonist card click handlers
        const csCards = document.querySelectorAll('.cs-card');
        csCards.forEach(card => {
            card.onclick = () => {
                // With only 2 protagonists, both are always required.
                // When more protagonists exist, toggle freely with min/max constraints.
                const selectedCards = document.querySelectorAll('.cs-card.selected');
                if (card.classList.contains('selected') && selectedCards.length <= 2) {
                    // Can't deselect — need minimum 2. Show a brief shake.
                    card.classList.add('cs-card-shake');
                    setTimeout(() => card.classList.remove('cs-card-shake'), 400);
                    return;
                }
                card.classList.toggle('selected');
            };
        });

        // Bind button
        if (this.elements.raiseCurtainBtn) {
            this.elements.raiseCurtainBtn.onclick = () => this.startPerformance();
        }
    }

    startPerformance() {
        // Hide character select
        if (this.elements.characterSelect) {
            this.elements.characterSelect.style.display = 'none';
        }

        // Show game UI behind closed curtains
        this.elements.container.classList.remove('game-ui-hidden');

        // Keep curtain-closed (don't open yet) - scene selection appears on top
        // Initialize animations now that the game is starting
        this.initializeAnimations();

        // Show scene selection overlay (z-index 100, above closed curtains at z-index 40)
        this.showSceneSelection();
    }

    /**
     * Reusable curtain close/open transition.
     * Closes curtains, executes callback, then opens curtains.
     * Used for cases that need auto close+open (like boss entrance).
     * @param {Function} callback - Called while curtains are closed
     */
    curtainTransition(callback) {
        this.isAnimating = true;

        // Close curtains
        this.elements.container.classList.add('curtain-closing');

        setTimeout(() => {
            // Curtains now closed
            this.elements.container.classList.remove('curtain-closing');
            this.elements.container.classList.add('curtain-closed');

            // Execute the content swap
            if (callback) callback();

            // Brief pause while closed
            setTimeout(() => {
                // Open curtains
                this.elements.container.classList.remove('curtain-closed');
                this.elements.container.classList.add('curtain-opening');

                setTimeout(() => {
                    this.elements.container.classList.remove('curtain-opening');
                    this.isAnimating = false;
                }, 1300);
            }, 400);
        }, 1300);
    }

    /**
     * Close curtains and execute callback. Does NOT auto-open.
     * Player action (e.g. selecting an enemy) will trigger the open.
     * @param {Function} callback - Called after curtains are closed
     */
    curtainClose(callback) {
        this.isAnimating = true;

        this.elements.container.classList.add('curtain-closing');

        setTimeout(() => {
            this.elements.container.classList.remove('curtain-closing');
            this.elements.container.classList.add('curtain-closed');
            this.isAnimating = false;

            if (callback) callback();
        }, 1300);
    }

    /**
     * Open curtains from closed state and execute callback when done.
     * @param {Function} callback - Called after curtains finish opening
     */
    curtainOpen(callback) {
        this.isAnimating = true;

        this.elements.container.classList.remove('curtain-closed');
        this.elements.container.classList.add('curtain-opening');

        setTimeout(() => {
            this.elements.container.classList.remove('curtain-opening');
            this.isAnimating = false;

            if (callback) callback();
        }, 1300);
    }

    // === Scene Selection System (Milestone 11) ===

    showSceneSelection() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act) return;

        // Determine which enemies to show
        let enemyIds;
        let sceneNumber;

        if (this.runState.currentScene < act.scenes.length) {
            // Regular scene
            sceneNumber = this.runState.currentScene + 1;
            enemyIds = act.scenes[this.runState.currentScene].enemies;

            if (this.elements.sceneTitle) {
                this.elements.sceneTitle.textContent = `Act ${this.runState.currentAct} - Scene ${sceneNumber}`;
            }
        } else {
            // Boss scene
            this.startBossCombat();
            return;
        }

        this.runState.phase = 'scene-select';
        this.renderEnemyChoices(enemyIds);

        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'flex';
        }
    }

    renderEnemyChoices(enemyIds) {
        const container = this.elements.enemyChoices;
        if (!container) return;

        container.innerHTML = '';

        enemyIds.forEach(enemyId => {
            const enemy = this.enemies[enemyId];
            if (!enemy) return;

            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'enemy-choice';
            choiceDiv.dataset.enemyId = enemyId;

            choiceDiv.innerHTML = `
                <div class="enemy-choice-silhouette">
                    <img src="/static/svg/enemy-placeholder.svg" alt="${enemy.name}">
                </div>
                <div class="enemy-choice-name">${enemy.name}</div>
                <div class="enemy-choice-hp">HP: ${enemy.hp}</div>
                <div class="enemy-choice-gimmick">${enemy.gimmick}</div>
            `;

            choiceDiv.addEventListener('click', () => this.selectEnemy(enemyId));

            container.appendChild(choiceDiv);
        });
    }

    selectEnemy(enemyId) {
        const enemy = this.enemies[enemyId];
        if (!enemy) return;
        if (this.isAnimating) return;

        console.log(`Selected enemy: ${enemy.name}`);

        // Hide scene selection overlay
        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'none';
        }

        // Set up combat behind closed curtains
        this.startCombatWithEnemy(enemyId);

        // Open curtains to reveal combat
        this.curtainOpen();
    }

    startCombatWithEnemy(enemyId) {
        const enemy = this.enemies[enemyId];
        if (!enemy) return;

        // Set up enemy state
        this.combatState.enemy = {
            id: enemy.id,
            name: enemy.name,
            currentHP: enemy.hp,
            maxHP: enemy.hp,
            block: 0,
            intent: { ...enemy.pattern[0] },
            patternIndex: 0,
            speechBubbles: enemy.speechBubbles,
            isBoss: enemy.isBoss || false
        };

        // Store pattern for this enemy
        this.enemyPatterns = { [enemy.id]: enemy.pattern };

        // Reset combat state
        this.combatState.macguffin.block = 0;

        // Reset status effects for new combat (keep persistent ones like curtain)
        this.statusEffects.ward = 0;
        this.statusEffects.ovation = 0;
        // Curtain persists across the combat but resets between combats
        this.statusEffects.curtain = 0;
        this.statusEffects.chargedCount = 0;
        this.statusEffects.lastAttacker = null;
        this.statusEffects.cardsPlayedThisTurn = 0;
        this.statusEffects.stageFright = { active: false, duration: 0, target: null };
        this.statusEffects.weakness = { active: false, duration: 0 };
        this.statusEffects.heckled = { active: false, duration: 0, target: null };
        this.statusEffects.enemyWeakness = { active: false, duration: 0 };
        this.encoreCard = null;

        this.renderCombatState();
        this.renderStatusEffects();

        // Update UI
        this.elements.enemyPuppet.classList.remove('enemy-defeat', 'enemy-hurt');
        this.elements.enemyPuppet.classList.add('enemy-idle');

        // Update progress indicator
        this.updateProgressIndicator();

        // Start the turn
        this.runState.phase = 'combat';
        this.startTurn();
    }

    startBossCombat() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act || !act.boss) return;

        // Hide scene selection
        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'none';
        }

        if (this.elements.sceneTitle) {
            this.elements.sceneTitle.textContent = `Act ${this.runState.currentAct} - BOSS`;
        }

        this.runState.currentScene = 'boss';
        // Set up boss behind closed curtains, then open
        this.startCombatWithEnemy(act.boss);
        this.curtainOpen();
    }

    advanceScene() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act) return;

        if (typeof this.runState.currentScene === 'number') {
            this.runState.currentScene++;

            // Close curtains, then show scene selection on top
            // Player picks enemy -> selectEnemy() handles opening
            this.curtainClose(() => {
                this.showSceneSelection();
            });
        } else if (this.runState.currentScene === 'boss') {
            // Boss defeated, act complete
            this.onActComplete();
        }
    }

    onActComplete() {
        console.log(`Act ${this.runState.currentAct} complete!`);
        this.phase = 'gameover';
        this.runState.phase = 'act-complete';

        // Show victory state
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.textContent = `Act ${this.runState.currentAct} Clear!`;
        }

        // Future: proceed to next act or show final victory
    }

    updateProgressIndicator() {
        const dots = this.elements.progressIndicator?.querySelectorAll('.progress-dot');
        if (!dots) return;

        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'complete');

            const sceneAttr = dot.dataset.scene;

            if (sceneAttr === 'boss') {
                if (this.runState.currentScene === 'boss') {
                    dot.classList.add('active');
                }
            } else {
                const sceneNum = parseInt(sceneAttr);
                if (this.runState.currentScene === sceneNum - 1) {
                    dot.classList.add('active');
                } else if (typeof this.runState.currentScene === 'number' && sceneNum <= this.runState.currentScene) {
                    dot.classList.add('complete');
                } else if (this.runState.currentScene === 'boss') {
                    dot.classList.add('complete');
                }
            }
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === Speech Bubbles (Milestone 5) ===

    /**
     * Show a speech bubble near a target element
     * @param {string} text - The text to display
     * @param {string} type - 'damage' | 'block' | 'heal' | 'buff' | 'debuff' | 'attack-burst' | 'character'
     * @param {HTMLElement} targetElement - Element to position the bubble near
     * @param {Object} options - Additional options
     */
    showSpeechBubble(text, type, targetElement, options = {}) {
        if (!this.elements.speechBubbles || !targetElement) return;

        const bubble = document.createElement('div');
        bubble.className = `speech-bubble ${type}`;

        // Add stagger offset for multiple bubbles
        if (this.bubbleOffset > 0) {
            bubble.classList.add(`offset-${Math.min(this.bubbleOffset, 3)}`);
        }
        this.bubbleOffset++;

        bubble.textContent = text;

        // Position relative to target element
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = this.elements.speechBubbles.getBoundingClientRect();

        // Calculate position (center above target with some randomness to prevent overlap)
        const offsetX = options.offsetX || (Math.random() - 0.5) * 30;
        const offsetY = options.offsetY || 0;

        const left = targetRect.left - containerRect.left + targetRect.width / 2 + offsetX;
        const top = targetRect.top - containerRect.top + offsetY;

        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
        bubble.style.transform = 'translateX(-50%)';

        this.elements.speechBubbles.appendChild(bubble);

        // Remove bubble after animation completes
        setTimeout(() => {
            bubble.remove();
            this.bubbleOffset = Math.max(0, this.bubbleOffset - 1);
        }, 1500);
    }

    /**
     * Show damage number bubble
     */
    showDamageBubble(amount, targetElement) {
        this.showSpeechBubble(`-${amount}`, 'damage', targetElement);
    }

    /**
     * Show block gained bubble
     */
    showBlockBubble(amount, targetElement) {
        this.showSpeechBubble(`+${amount} Block`, 'block', targetElement);
    }

    /**
     * Show heal bubble
     */
    showHealBubble(amount, targetElement) {
        this.showSpeechBubble(`+${amount}`, 'heal', targetElement);
    }

    /**
     * Show attack onomatopoeia bubble
     */
    showAttackBubble(text, targetElement) {
        this.showSpeechBubble(text, 'attack-burst', targetElement, { offsetY: -20 });
    }

    /**
     * Show character speech bubble
     */
    showCharacterBubble(text, targetElement) {
        this.showSpeechBubble(text, 'character', targetElement, { offsetY: -30 });
    }

    updateCardSelection() {
        const cards = this.elements.handCards.querySelectorAll('.game-card');
        cards.forEach((cardEl, index) => {
            if (index === this.selectedCardIndex) {
                cardEl.classList.add('selected');
            } else {
                cardEl.classList.remove('selected');
            }
        });
    }

    onPuppetTap(puppet) {
        const id = puppet.id;
        console.log('Puppet tapped:', id);
        // Future: show stats popup
    }

    // === Energy Display (Milestone 4) ===

    renderEnergy() {
        if (this.elements.energyValue) {
            this.elements.energyValue.textContent = this.energy.current;
        }
        // Update card playability when energy changes
        this.updateCardPlayability();
    }

    // === Status Effects Display (Milestone 13-15) ===

    renderStatusEffects() {
        // Get or create status container
        let container = document.getElementById('status-effects');
        if (!container) {
            container = document.createElement('div');
            container.id = 'status-effects';
            container.className = 'status-effects';
            this.elements.macguffin?.parentNode?.insertBefore(container, this.elements.macguffin.nextSibling);
        }

        const effects = [];

        // Positive effects
        if (this.statusEffects.ward > 0) {
            effects.push(`<span class="status-icon buff" title="Ward">🛡️${this.statusEffects.ward}</span>`);
        }
        if (this.statusEffects.ovation > 0) {
            effects.push(`<span class="status-icon buff" title="Ovation">👏${this.statusEffects.ovation}</span>`);
        }
        if (this.statusEffects.curtain > 0) {
            effects.push(`<span class="status-icon buff" title="Curtain">🎭${this.statusEffects.curtain}</span>`);
        }

        // Debuffs
        if (this.statusEffects.stageFright.active) {
            effects.push(`<span class="status-icon debuff" title="Stage Fright">😰${this.statusEffects.stageFright.duration}</span>`);
        }
        if (this.statusEffects.weakness.active) {
            effects.push(`<span class="status-icon debuff" title="Weakness">💪${this.statusEffects.weakness.duration}</span>`);
        }
        if (this.statusEffects.heckled.active) {
            effects.push(`<span class="status-icon debuff" title="Heckled">🗣️${this.statusEffects.heckled.duration}</span>`);
        }

        container.innerHTML = effects.join('');

        // Enemy status effects
        let enemyContainer = document.getElementById('enemy-status-effects');
        if (!enemyContainer) {
            enemyContainer = document.createElement('div');
            enemyContainer.id = 'enemy-status-effects';
            enemyContainer.className = 'status-effects enemy-status';
            this.elements.enemyPuppet?.appendChild(enemyContainer);
        }

        const enemyEffects = [];
        if (this.statusEffects.enemyWeakness.active) {
            enemyEffects.push(`<span class="status-icon debuff" title="Weakness">💪${this.statusEffects.enemyWeakness.duration}</span>`);
        }

        enemyContainer.innerHTML = enemyEffects.join('');
    }

    tickStatusEffects() {
        // Tick down player debuffs
        if (this.statusEffects.stageFright.active) {
            this.statusEffects.stageFright.duration--;
            if (this.statusEffects.stageFright.duration <= 0) {
                this.statusEffects.stageFright = { active: false, duration: 0, target: null };
                console.log('Stage Fright expired');
            }
        }
        if (this.statusEffects.weakness.active) {
            this.statusEffects.weakness.duration--;
            if (this.statusEffects.weakness.duration <= 0) {
                this.statusEffects.weakness = { active: false, duration: 0 };
                console.log('Weakness expired');
            }
        }
        if (this.statusEffects.heckled.active) {
            this.statusEffects.heckled.duration--;
            if (this.statusEffects.heckled.duration <= 0) {
                this.statusEffects.heckled = { active: false, duration: 0, target: null };
                console.log('Heckled expired');
            }
        }

        // Tick down enemy debuffs
        if (this.statusEffects.enemyWeakness.active) {
            this.statusEffects.enemyWeakness.duration--;
            if (this.statusEffects.enemyWeakness.duration <= 0) {
                this.statusEffects.enemyWeakness = { active: false, duration: 0 };
                console.log('Enemy Weakness expired');
            }
        }

        this.renderStatusEffects();
    }

    resetTurnEffects() {
        // Reset turn-based counters
        this.statusEffects.chargedCount = 0;
        this.statusEffects.lastAttacker = null;
        this.statusEffects.cardsPlayedThisTurn = 0;

        // Handle Encore - return card to hand
        if (this.encoreCard) {
            this.hand.push(this.encoreCard);
            console.log(`Encore: ${this.encoreCard.name} returned to hand`);
            this.encoreCard = null;
        }
    }

    updateCardPlayability() {
        const cardElements = this.elements.handCards.querySelectorAll('.game-card');
        cardElements.forEach((cardEl, index) => {
            const card = this.hand[index];
            if (card) {
                if (card.cost <= this.energy.current) {
                    cardEl.classList.remove('unplayable');
                } else {
                    cardEl.classList.add('unplayable');
                }
            }
        });
    }

    // === Combat State Display (Milestone 3) ===

    renderCombatState() {
        this.renderMacGuffinHP();
        this.renderMacGuffinBlock();
        this.renderEnemyHP();
        this.renderEnemyIntent();
    }

    renderMacGuffinHP() {
        const { currentHP, maxHP } = this.combatState.macguffin;
        const percentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));

        if (this.elements.macguffinHPFill) {
            this.elements.macguffinHPFill.style.width = `${percentage}%`;
        }
        if (this.elements.macguffinHPText) {
            this.elements.macguffinHPText.textContent = `${currentHP}/${maxHP}`;
        }
    }

    renderMacGuffinBlock() {
        const { block } = this.combatState.macguffin;

        if (this.elements.macguffinBlock) {
            if (block > 0) {
                this.elements.macguffinBlock.style.display = 'flex';
                this.elements.macguffinBlock.querySelector('.block-value').textContent = block;
            } else {
                this.elements.macguffinBlock.style.display = 'none';
            }
        }
    }

    renderEnemyHP() {
        const { currentHP, maxHP } = this.combatState.enemy;
        const percentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));

        if (this.elements.enemyHPFill) {
            this.elements.enemyHPFill.style.width = `${percentage}%`;
        }
        if (this.elements.enemyHPText) {
            this.elements.enemyHPText.textContent = `${currentHP}/${maxHP}`;
        }
    }

    renderEnemyIntent() {
        const { type, value, hits = 1 } = this.combatState.enemy.intent;

        // Map intent types to SVG icon paths
        const intentIcons = {
            attack: '/static/svg/intent-attack.svg',
            block: '/static/svg/intent-block.svg',
            heal: '/static/svg/intent-heal.svg',
            buff: '/static/svg/intent-buff.svg',
            debuff: '/static/svg/intent-debuff.svg'
        };

        if (this.elements.intentIcon) {
            const iconPath = intentIcons[type] || intentIcons.attack;
            this.elements.intentIcon.src = iconPath;
            this.elements.intentIcon.alt = type.charAt(0).toUpperCase() + type.slice(1);
            this.elements.intentIcon.className = 'intent-icon';
        }
        if (this.elements.intentValue) {
            // Format multi-hit attacks as "damage ×hits"
            if (hits > 1) {
                this.elements.intentValue.textContent = `${value} ×${hits}`;
            } else {
                this.elements.intentValue.textContent = value;
            }
            this.elements.intentValue.className = `intent-value intent-${type}`;
        }
        if (this.elements.enemyIntent) {
            this.elements.enemyIntent.className = `enemy-intent intent-${type}`;
        }
    }

    // === Debug API (Milestone 3) ===

    setMacGuffinHP(current, max) {
        if (typeof max === 'number') {
            this.combatState.macguffin.maxHP = max;
        }
        if (typeof current === 'number') {
            this.combatState.macguffin.currentHP = current;
        }
        this.renderMacGuffinHP();
    }

    setEnemyHP(current, max) {
        if (typeof max === 'number') {
            this.combatState.enemy.maxHP = max;
        }
        if (typeof current === 'number') {
            this.combatState.enemy.currentHP = current;
        }
        this.renderEnemyHP();
    }

    setBlock(value) {
        this.combatState.macguffin.block = Math.max(0, value);
        this.renderMacGuffinBlock();
    }

    setIntent(type, value) {
        const validTypes = ['attack', 'block', 'heal', 'buff', 'debuff'];
        if (validTypes.includes(type)) {
            this.combatState.enemy.intent.type = type;
        }
        if (typeof value === 'number') {
            this.combatState.enemy.intent.value = value;
        }
        this.renderEnemyIntent();
    }

    setEnergy(current, max) {
        if (typeof max === 'number') {
            this.energy.max = max;
        }
        if (typeof current === 'number') {
            this.energy.current = Math.min(current, this.energy.max);
        }
        this.renderEnergy();
    }

    resetEnergy() {
        this.energy.current = this.energy.max;
        this.renderEnergy();
    }

    exposeDebugAPI() {
        window.gameDebug = {
            setMacGuffinHP: (current, max) => this.setMacGuffinHP(current, max),
            setEnemyHP: (current, max) => this.setEnemyHP(current, max),
            setBlock: (value) => this.setBlock(value),
            setIntent: (type, value) => this.setIntent(type, value),
            setEnergy: (current, max) => this.setEnergy(current, max),
            resetEnergy: () => this.resetEnergy(),
            getState: () => ({
                turn: this.turnNumber,
                phase: this.phase,
                combat: { ...this.combatState },
                energy: { ...this.energy },
                hand: this.hand.map(c => c.name),
                deckSize: this.deck.length,
                discardSize: this.discardPile.length
            }),
            restart: () => this.restartCombat(),
            // Card drawing debug tools
            draw: (count = 1) => {
                this.drawCards(count);
                this.renderHand();
                console.log(`Drew ${count} card(s). Hand size: ${this.hand.length}`);
            },
            addCard: (cardId) => {
                const cardDef = CARD_DEFINITIONS[cardId];
                if (!cardDef) {
                    console.log('Available cards:', Object.keys(CARD_DEFINITIONS).join(', '));
                    return;
                }
                const card = { ...cardDef, instanceId: `debug-${Date.now()}` };
                this.hand.push(card);
                this.renderHand();
                console.log(`Added ${card.name}. Hand size: ${this.hand.length}`);
            },
            listCards: () => {
                console.log('Available cards:', Object.keys(CARD_DEFINITIONS).join(', '));
            },
            // Audience debug
            wave: () => this.triggerAudienceWave(),
            audienceReact: (type) => this.triggerAudienceReaction(type)
        };
        console.log('Curtain Call: Debug API available at window.gameDebug');
        console.log('  draw(n) - draw n cards from deck');
        console.log('  addCard(id) - add specific card to hand');
        console.log('  listCards() - show all card IDs');
        console.log('  wave() - trigger audience wave');
    }

    restartCombat() {
        // Reset all combat state
        this.combatState = {
            macguffin: { currentHP: 60, maxHP: 60, block: 0 },
            enemy: {
                id: 'stage-rat',
                name: 'Stage Rat',
                currentHP: 28,
                maxHP: 28,
                block: 0,
                intent: { type: 'attack', value: 7, hits: 1 },
                patternIndex: 0,
                speechBubbles: {
                    attack: 'SQUEAK!',
                    hurt: 'EEK!',
                    defeated: '...squeak.'
                }
            }
        };
        this.energy = { current: 3, max: 3 };
        this.turnNumber = 0;
        this.phase = 'player';
        this.hand = [];
        this.discardPile = [];
        this.selectedCardIndex = null;
        this.isAnimating = false;

        // Reset UI
        this.elements.enemyPuppet.classList.remove('enemy-defeat', 'enemy-hurt');
        this.elements.enemyPuppet.classList.add('enemy-idle');

        // Reinitialize
        this.initializeDeck();
        this.renderCombatState();
        this.startTurn();

        console.log('Combat restarted');
    }
}

// Initialize game
const game = new CurtainCallGame();
