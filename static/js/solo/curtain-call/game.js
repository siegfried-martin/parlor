/**
 * Curtain Call - Shadow Puppet Theater Deck-Building Game
 *
 * Core game class: constructor, initialization, deck management,
 * v2 keyword state model, and debug API.
 *
 * Prototype extensions loaded separately:
 *   combat.js  — turn loop, enemy AI, card play, keyword engine
 *   renderer.js — card rendering, HP bars, speech bubbles, status display
 *   ui.js      — events, menus, scene flow, curtain transitions
 *   audience.js — audience generation and animations
 *
 * Data files loaded before this:
 *   cards.js, enemies.js
 */

'use strict';

class CurtainCallGame {
    constructor() {
        this.initialized = false;
        this.deck = [];
        this.hand = [];
        this.discardPile = [];
        this.isAnimating = false;
        this.bubbleOffset = 0;

        // Turn state
        this.turnNumber = 0;
        this.phase = 'player'; // 'player' | 'enemy' | 'gameover'
        this.handSize = 5;

        // Energy state
        this.energy = {
            current: 3,
            max: 3
        };

        // Starting deck choices (set by character select)
        this.selectedAldricBasic = 'galvanize';
        this.selectedPipBasic = 'quick-jab';

        // === v2 Keyword State ===
        this.keywords = {
            // Player-side positive keywords (global)
            inspire: 0,      // permanent, +1 damage per stack
            fortify: 0,      // decays by 1, +1 block per block gain
            piercing: 0,     // decays by 1, bypass enemy Block/Shield
            focus: 0,        // decays by 1, bypass Taunt/Distract, no Retaliate
            ward: 0,         // permanent, consumed on debuff
            luck: 0,         // decays by 1, 10% per stack for 1.5x
            flourish: 0,     // removed at start of turn
            ovation: 0,      // crowd meter 0-5

            // Player-side debuffs (global)
            weak: 0,         // decays by 1, 50% reduced Block/Shield gain
            confused: 0,     // decays by 1, 50% Taunt/Distract/Retaliate fail
            curse: 0,        // on MacGuffin, consumed end of turn

            // Per-protagonist positive keywords
            aldric: {
                regenerate: 0
            },
            pip: {
                regenerate: 0
            },

            // Per-protagonist debuffs
            debuffs: {
                aldric: {
                    poison: 0, burn: 0,
                    stageFright: 0, heckled: 0, forgetful: 0, vulnerable: 0,
                    fear: 0, frustration: 0
                },
                pip: {
                    poison: 0, burn: 0,
                    stageFright: 0, heckled: 0, forgetful: 0, vulnerable: 0,
                    fear: 0, frustration: 0
                },
                macguffin: {
                    vulnerable: 0
                }
            },

            // Enemy-side keywords
            enemy: {
                block: 0, shield: 0, regenerate: 0, inspire: 0, retaliate: 0,
                poison: 0, burn: 0,
                stageFright: 0, heckled: 0, forgetful: 0, vulnerable: 0,
                weak: 0, confused: 0,
                fear: 0, frustration: 0, curse: 0
            },

            // Turn tracking
            cardsPlayedThisTurn: 0
        };

        // Card zoom / keyword explanation state
        this.zoomedCard = null;
        this.zoomedCardElement = null;
        this.explanationBubbles = [];

        // Combat state (HP, per-turn defenses, enemy)
        this.combatState = {
            macguffin: {
                currentHP: 60,
                maxHP: 60
            },
            aldric: {
                currentHP: 20,
                maxHP: 20,
                knockedOut: false,
                shield: 0,
                taunt: 0
            },
            pip: {
                currentHP: 10,
                maxHP: 10,
                knockedOut: false,
                shield: 0,
                taunt: 0
            },
            // Global defensive pools (reset after enemy turn)
            block: 0,
            distract: 0,
            retaliate: 0,
            enemy: {
                id: 'stage-rat',
                name: 'Stage Rat',
                currentHP: 25,
                maxHP: 25,
                intent: { type: 'attack', value: 5, hits: 1 },
                patternIndex: 0,
                currentPhase: 0,
                speechBubbles: { attack: 'SQUEAK!', hurt: 'EEK!', defeated: '...squeak.' },
                isBoss: false,
                passives: [],
                passiveState: {} // For tracking one-time passive triggers
            }
        };

        // Enemy definitions and act structure (from enemies.js)
        this.enemies = ENEMY_DEFINITIONS;
        this.actStructure = ACT_STRUCTURE;

        // Run progression state
        this.runState = {
            currentAct: 1,
            currentScene: 0,
            phase: 'scene-select'
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
            heroAldric: document.getElementById('hero-aldric'),
            heroPip: document.getElementById('hero-pip'),
            macguffin: document.getElementById('macguffin'),
            handCards: document.getElementById('hand-cards'),
            // Combat state elements
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
            // Protagonist HP bars
            aldricHPFill: document.querySelector('.aldric-hp-bar .hp-fill'),
            aldricHPText: document.querySelector('.aldric-hp-bar .hp-text'),
            pipHPFill: document.querySelector('.pip-hp-bar .hp-fill'),
            pipHPText: document.querySelector('.pip-hp-bar .hp-text'),
            // Energy display
            energyValue: document.querySelector('.energy-value'),
            // Ovation meter
            ovationMeter: document.getElementById('ovation-meter'),
            ovationFill: document.getElementById('ovation-fill'),
            ovationValue: document.getElementById('ovation-value'),
            // Speech bubbles
            speechBubbles: document.getElementById('speech-bubbles'),
            // Rewards screen
            rewardsOverlay: document.getElementById('rewards-overlay'),
            rewardsCards: document.getElementById('rewards-cards'),
            confirmRewardBtn: document.getElementById('confirm-reward-btn'),
            skipRewardBtn: document.getElementById('skip-reward-btn'),
            // Scene selection
            sceneSelectOverlay: document.getElementById('scene-select-overlay'),
            sceneTitle: document.getElementById('scene-title'),
            enemyChoices: document.getElementById('enemy-choices'),
            progressIndicator: document.getElementById('progress-indicator'),
            // Title & Character Select
            titleScreen: document.getElementById('title-screen'),
            characterSelect: document.getElementById('character-select'),
            newPerformanceBtn: document.getElementById('new-performance-btn'),
            raiseCurtainBtn: document.getElementById('raise-curtain-btn'),
            // Deck list & count
            deckListOverlay: document.getElementById('deck-list-overlay'),
            deckListCards: document.getElementById('deck-list-cards'),
            deckListClose: document.getElementById('deck-list-close'),
            deckListTitle: document.getElementById('deck-list-title'),
            deckListFooter: document.getElementById('deck-list-footer'),
            deckCountIndicator: document.getElementById('deck-count-indicator'),
            deckCountDraw: document.getElementById('deck-count-draw'),
            deckCountDiscard: document.getElementById('deck-count-discard'),
            removeCardBtn: document.getElementById('remove-card-btn'),
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

        // Start with curtains closed and title screen
        this.elements.container.classList.add('curtain-closed', 'game-ui-hidden');
        this.showTitleScreen();

        console.log('Curtain Call: Ready');
    }

    // === Deck Management ===

    initializeDeck() {
        const deckIds = buildStartingDeck(this.selectedAldricBasic, this.selectedPipBasic);
        this.deck = deckIds.map((cardId, index) => ({
            ...CARD_DEFINITIONS[cardId],
            instanceId: `${cardId}-${index}`
        }));
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        if (this.deck.length === 0) {
            if (this.discardPile.length === 0) return null;
            this.deck = [...this.discardPile];
            this.discardPile = [];
            this.shuffleDeck();
        }
        return this.deck.pop();
    }

    // === Utility ===

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Play a one-shot Web Animations API animation on an element.
     * Automatically overrides CSS idle animations during playback,
     * then lets them resume when finished.
     */
    async playAnimation(element, animDef) {
        const anim = element.animate(animDef.keyframes, {
            duration: animDef.duration,
            easing: animDef.easing || 'ease-out'
        });
        await anim.finished;
    }

    // === Keyword Helpers ===

    /**
     * Reset all keywords for a new combat encounter.
     * MacGuffin HP is NOT reset (persists across the run).
     */
    resetKeywords() {
        const kw = this.keywords;
        kw.inspire = 0;
        kw.fortify = 0;
        kw.piercing = 0;
        kw.focus = 0;
        kw.ward = 0;
        kw.luck = 0;
        kw.flourish = 0;
        kw.ovation = 0;
        kw.weak = 0;
        kw.confused = 0;
        kw.curse = 0;

        kw.aldric.regenerate = 0;
        kw.pip.regenerate = 0;

        for (const prot of ['aldric', 'pip']) {
            const d = kw.debuffs[prot];
            d.poison = 0; d.burn = 0;
            d.stageFright = 0; d.heckled = 0; d.forgetful = 0; d.vulnerable = 0;
            d.fear = 0; d.frustration = 0;
        }
        kw.debuffs.macguffin.vulnerable = 0;

        const e = kw.enemy;
        e.block = 0; e.shield = 0; e.regenerate = 0; e.inspire = 0; e.retaliate = 0;
        e.poison = 0; e.burn = 0;
        e.stageFright = 0; e.heckled = 0; e.forgetful = 0; e.vulnerable = 0;
        e.weak = 0; e.confused = 0;
        e.fear = 0; e.frustration = 0; e.curse = 0;

        kw.cardsPlayedThisTurn = 0;
    }

    /**
     * Count total debuff stacks on a protagonist (for Tangled Strings passive).
     */
    getProtagonistDebuffCount(protagonist) {
        const d = this.keywords.debuffs[protagonist];
        if (!d) return 0;
        return (d.poison || 0) + (d.burn || 0) + (d.stageFright || 0) +
               (d.heckled || 0) + (d.forgetful || 0) + (d.vulnerable || 0) +
               (d.fear || 0) + (d.frustration || 0);
    }

    /**
     * Count unique debuff types on the enemy (for Quick Jab).
     */
    getEnemyDebuffCount() {
        const e = this.keywords.enemy;
        let count = 0;
        if (e.poison > 0) count++;
        if (e.burn > 0) count++;
        if (e.stageFright > 0) count++;
        if (e.heckled > 0) count++;
        if (e.forgetful > 0) count++;
        if (e.vulnerable > 0) count++;
        if (e.weak > 0) count++;
        if (e.confused > 0) count++;
        if (e.fear > 0) count++;
        if (e.frustration > 0) count++;
        if (e.curse > 0) count++;
        return count;
    }

    /**
     * Check if an enemy has a specific passive ability.
     */
    enemyHasPassive(passiveId) {
        return this.combatState.enemy.passives?.some(p => p.id === passiveId) || false;
    }

    // === Debug API ===

    setMacGuffinHP(current, max) {
        if (typeof max === 'number') this.combatState.macguffin.maxHP = max;
        if (typeof current === 'number') this.combatState.macguffin.currentHP = current;
        this.renderMacGuffinHP();
    }

    setProtagonistHP(protagonist, current, max) {
        const state = this.combatState[protagonist];
        if (!state || !('knockedOut' in state)) {
            console.log('Valid protagonists: aldric, pip');
            return;
        }
        if (typeof max === 'number') state.maxHP = max;
        if (typeof current === 'number') {
            state.currentHP = Math.max(0, current);
            state.knockedOut = state.currentHP <= 0;
        }
        this.renderProtagonistHP(protagonist);
        this.renderKnockoutState(protagonist);
        this.renderHand();
    }

    setEnemyHP(current, max) {
        if (typeof max === 'number') this.combatState.enemy.maxHP = max;
        if (typeof current === 'number') this.combatState.enemy.currentHP = current;
        this.renderEnemyHP();
    }

    setBlock(value) {
        this.combatState.block = Math.max(0, value);
        this.renderMacGuffinBlock();
    }

    setShield(protagonist, value) {
        const state = this.combatState[protagonist];
        if (!state || !('shield' in state)) {
            console.log('Valid protagonists: aldric, pip');
            return;
        }
        state.shield = Math.max(0, value);
        this.renderProtagonistDefenses(protagonist);
    }

    setTaunt(protagonist, value) {
        const state = this.combatState[protagonist];
        if (!state || !('taunt' in state)) {
            console.log('Valid protagonists: aldric, pip');
            return;
        }
        state.taunt = Math.max(0, value);
        this.renderProtagonistDefenses(protagonist);
    }

    setDistract(value) {
        this.combatState.distract = Math.max(0, value);
        this.renderStatusEffects();
    }

    setRetaliate(value) {
        this.combatState.retaliate = Math.max(0, value);
        this.renderStatusEffects();
    }

    setKeyword(keyword, value) {
        if (keyword in this.keywords && typeof this.keywords[keyword] === 'number') {
            this.keywords[keyword] = Math.max(0, value);
            this.renderStatusEffects();
        } else {
            console.log('Valid keywords: inspire, fortify, piercing, focus, ward, luck, flourish, ovation, weak, confused, curse');
        }
    }

    setEnemyKeyword(keyword, value) {
        if (keyword in this.keywords.enemy) {
            this.keywords.enemy[keyword] = Math.max(0, value);
            this.renderStatusEffects();
        } else {
            console.log('Valid enemy keywords:', Object.keys(this.keywords.enemy).join(', '));
        }
    }

    setDebuff(protagonist, keyword, value) {
        const d = this.keywords.debuffs[protagonist];
        if (d && keyword in d) {
            d[keyword] = Math.max(0, value);
            this.renderStatusEffects();
        } else {
            console.log('Valid: setDebuff("aldric"/"pip", "poison"/"burn"/..., value)');
        }
    }

    setIntent(type, value, hits, target) {
        const validTypes = ['attack', 'block', 'heal', 'buff', 'debuff'];
        if (validTypes.includes(type)) this.combatState.enemy.intent.type = type;
        if (typeof value === 'number') this.combatState.enemy.intent.value = value;
        if (typeof hits === 'number') this.combatState.enemy.intent.hits = hits;
        if (target !== undefined) this.combatState.enemy.intent.target = target;
        this.renderEnemyIntent();
    }

    setEnergy(current, max) {
        if (typeof max === 'number') this.energy.max = max;
        if (typeof current === 'number') this.energy.current = Math.min(current, this.energy.max);
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
            setProtagonistHP: (protagonist, current, max) => this.setProtagonistHP(protagonist, current, max),
            knockout: (protagonist) => this.setProtagonistHP(protagonist, 0),
            setBlock: (value) => this.setBlock(value),
            setShield: (protagonist, value) => this.setShield(protagonist, value),
            setTaunt: (protagonist, value) => this.setTaunt(protagonist, value),
            setDistract: (value) => this.setDistract(value),
            setRetaliate: (value) => this.setRetaliate(value),
            setKeyword: (keyword, value) => this.setKeyword(keyword, value),
            setEnemyKeyword: (keyword, value) => this.setEnemyKeyword(keyword, value),
            setDebuff: (protagonist, keyword, value) => this.setDebuff(protagonist, keyword, value),
            setIntent: (type, value, hits, target) => this.setIntent(type, value, hits, target),
            setEnergy: (current, max) => this.setEnergy(current, max),
            resetEnergy: () => this.resetEnergy(),
            getState: () => ({
                turn: this.turnNumber,
                phase: this.phase,
                combat: { ...this.combatState },
                keywords: JSON.parse(JSON.stringify(this.keywords)),
                energy: { ...this.energy },
                hand: this.hand.map(c => c.name),
                deckSize: this.deck.length,
                discardSize: this.discardPile.length
            }),
            restart: () => this.restartCombat(),
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
            listCards: () => console.log('Available cards:', Object.keys(CARD_DEFINITIONS).join(', ')),
            wave: () => this.triggerAudienceWave(),
            audienceReact: (type) => this.triggerAudienceReaction(type)
        };
        console.log('Curtain Call: Debug API available at window.gameDebug');
        console.log('  setKeyword(name, value), setEnemyKeyword(name, value)');
        console.log('  setDebuff(protagonist, keyword, value)');
        console.log('  addCard(id), listCards(), draw(n)');
    }

    restartCombat() {
        this.combatState = {
            macguffin: { currentHP: 60, maxHP: 60 },
            aldric: { currentHP: 20, maxHP: 20, knockedOut: false, shield: 0, taunt: 0 },
            pip: { currentHP: 10, maxHP: 10, knockedOut: false, shield: 0, taunt: 0 },
            block: 0, distract: 0, retaliate: 0,
            enemy: {
                id: 'stage-rat', name: 'Stage Rat',
                currentHP: 22, maxHP: 22,
                intent: { type: 'attack', value: 5, hits: 1 },
                patternIndex: 0, currentPhase: 0,
                speechBubbles: { attack: 'SQUEAK!', hurt: 'EEK!', defeated: '...squeak.' },
                isBoss: false, passives: [], passiveState: {}
            }
        };
        this.resetKeywords();
        this.energy = { current: 3, max: 3 };
        this.turnNumber = 0;
        this.phase = 'player';
        this.hand = [];
        this.discardPile = [];
        this.isAnimating = false;

        this.elements.enemyPuppet.classList.remove('enemy-defeat');
        this.elements.enemyPuppet.classList.add('enemy-idle');
        this.elements.heroAldric.classList.remove('knocked-out');
        this.elements.heroPip.classList.remove('knocked-out');

        this.initializeDeck();
        this.resetSpeechForCombat();
        this.renderCombatState();
        this.startTurn();

        console.log('Combat restarted');
    }
}
