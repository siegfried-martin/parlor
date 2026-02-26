/**
 * Curtain Call — Stage Props
 *
 * Permanent run-duration passives collected as boss rewards.
 * Register event bus listeners at combat start, deregister at combat end,
 * re-register each combat.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

// === Stage Prop Definitions ===

const STAGE_PROP_DEFINITIONS = {
    'directors-megaphone': {
        id: 'directors-megaphone',
        name: "Director's Megaphone",
        description: 'At the start of each combat, gain 1 Inspire.',
        icon: '📢',
        rarity: 'common',
        event: 'combatStart',
        effect: 'gainInspire1'
    },
    'tattered-script': {
        id: 'tattered-script',
        name: 'Tattered Script',
        description: 'At the start of each combat, draw 1 additional card.',
        icon: '📜',
        rarity: 'common',
        event: 'playerTurnStart',
        effect: 'extraDrawTurn1'
    },
    'applause-o-meter': {
        id: 'applause-o-meter',
        name: 'Applause-O-Meter',
        description: 'Whenever you gain Ovation, gain 1 additional Ovation.',
        icon: '📊',
        rarity: 'rare',
        event: 'ovationChanged',
        effect: 'bonusOvation'
    },
    'stunt-double': {
        id: 'stunt-double',
        name: 'Stunt Double',
        description: 'Once per combat, when a protagonist would be knocked out, survive with 1 HP.',
        icon: '🎭',
        rarity: 'rare',
        event: 'beforeKnockout',
        effect: 'preventKnockout'
    },
    'trapdoor-lever': {
        id: 'trapdoor-lever',
        name: 'Trapdoor Lever',
        description: 'Once per combat, when MacGuffin drops below 50% HP, gain 10 Block.',
        icon: '🪤',
        rarity: 'uncommon',
        event: 'macguffinDamaged',
        effect: 'emergencyBlock'
    },
    'villains-monologue': {
        id: 'villains-monologue',
        name: "Villain's Monologue",
        description: 'Enemies start each combat with 1 Frustrated and 1 Weak.',
        icon: '🎤',
        rarity: 'uncommon',
        event: 'combatStart',
        effect: 'startingDebuffs'
    },
    'opening-night-jitters': {
        id: 'opening-night-jitters',
        name: 'Opening Night Jitters',
        description: 'Start each combat with 2 Ovation.',
        icon: '🎬',
        rarity: 'common',
        event: 'combatStart',
        effect: 'startingOvation'
    },
    'spotlight-rig': {
        id: 'spotlight-rig',
        name: 'Spotlight Rig',
        description: 'Whenever you play a 0-cost card, gain 1 Ovation.',
        icon: '💡',
        rarity: 'uncommon',
        event: 'cardPlayed',
        effect: 'zeroCostOvation'
    },
    'understudys-mask': {
        id: 'understudys-mask',
        name: "Understudy's Mask",
        description: 'At the start of each combat, gain 1 Ward.',
        icon: '🎭',
        rarity: 'common',
        event: 'combatStart',
        effect: 'startingWard'
    }
};

// Pool for boss reward selection
const STAGE_PROP_POOL = Object.keys(STAGE_PROP_DEFINITIONS);

Object.assign(CurtainCallGame.prototype, {

    /**
     * Register all collected stage prop listeners for the current combat.
     * Called at combat start (from startCombatWithEnemy).
     */
    registerStageProps() {
        if (!this.stageProps || this.stageProps.length === 0) return;

        // Reset per-combat tracking
        this._stagePropState = {};

        for (const propId of this.stageProps) {
            const prop = STAGE_PROP_DEFINITIONS[propId];
            if (!prop) continue;
            this._registerStagePropListener(prop);
        }
    },

    _registerStagePropListener(prop) {
        const owner = 'stage-prop';
        const game = this;

        switch (prop.effect) {
            case 'gainInspire1':
                this.events.on('combatStart', async () => {
                    game.keywords.inspire += 1;
                    game.showSpeechBubble('Inspire +1', 'buff', game.elements.macguffin);
                    game.renderStatusEffects();
                }, { owner });
                break;

            case 'extraDrawTurn1':
                // Only on turn 1
                this.events.on('playerTurnStart', async (data) => {
                    if (data.turn === 1) {
                        await game.drawCards(1);
                    }
                }, { owner });
                break;

            case 'bonusOvation':
                this.events.on('ovationChanged', async (data) => {
                    if (data.delta > 0 && !game._stagePropState._bonusOvationLock) {
                        game._stagePropState._bonusOvationLock = true;
                        game.gainOvation(1);
                        game._stagePropState._bonusOvationLock = false;
                    }
                }, { owner });
                break;

            case 'preventKnockout':
                this.events.on('beforeKnockout', async (ctx) => {
                    if (!game._stagePropState.stuntDoubleUsed) {
                        game._stagePropState.stuntDoubleUsed = true;
                        ctx.prevented = true;
                        game.showSpeechBubble('Stunt Double!', 'buff', game.getTargetElement(ctx.protagonist));
                    }
                }, { owner, priority: 10 });
                break;

            case 'emergencyBlock':
                this.events.on('macguffinDamaged', async (data) => {
                    if (!game._stagePropState.trapdoorUsed) {
                        const ratio = game.combatState.macguffin.currentHP / game.combatState.macguffin.maxHP;
                        if (ratio < 0.5) {
                            game._stagePropState.trapdoorUsed = true;
                            game.combatState.block += 10;
                            game.renderMacGuffinBlock();
                            game.showSpeechBubble('Trapdoor! Block +10', 'buff', game.elements.macguffin);
                        }
                    }
                }, { owner });
                break;

            case 'startingDebuffs':
                this.events.on('combatStart', async () => {
                    game.keywords.enemy.frustration += 1;
                    game.keywords.enemy.weak += 1;
                    game.showSpeechBubble('Frustrated +1, Weak +1', 'debuff', game.elements.enemyPuppet);
                    game.renderStatusEffects();
                }, { owner });
                break;

            case 'startingOvation':
                this.events.on('combatStart', async () => {
                    game.gainOvation(2);
                }, { owner });
                break;

            case 'zeroCostOvation':
                this.events.on('cardPlayed', async (data) => {
                    if (data.card && data.card.cost === 0) {
                        game.gainOvation(1);
                    }
                }, { owner });
                break;

            case 'startingWard':
                this.events.on('combatStart', async () => {
                    game.keywords.ward += 1;
                    game.showSpeechBubble('Ward +1', 'buff', game.elements.macguffin);
                    game.renderStatusEffects();
                }, { owner });
                break;
        }
    },

    /**
     * Deregister all stage prop listeners at combat end.
     */
    clearStageProps() {
        this.events.offByOwner('stage-prop');
        this._stagePropState = {};
    },

    /**
     * Show the stage prop selection screen (boss reward).
     * @param {Function} onComplete - Called after selection is made
     */
    showStagePropSelection(onComplete) {
        // Pick 3 random props the player doesn't have yet
        const available = STAGE_PROP_POOL.filter(id =>
            !this.stageProps.includes(id)
        );

        // Shuffle and take up to 3
        const shuffled = available.sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, Math.min(3, shuffled.length));

        if (choices.length === 0) {
            // No more props available
            if (onComplete) onComplete();
            return;
        }

        this._propChoices = choices;
        this._propOnComplete = onComplete;
        this._selectedPropIndex = null;

        // Render prop choices into the rewards overlay
        this.renderPropChoices(choices);

        if (this.elements.rewardsOverlay) {
            this.elements.rewardsOverlay.style.display = 'flex';
        }
    },

    renderPropChoices(choices) {
        const container = this.elements.rewardsCards;
        if (!container) return;

        container.innerHTML = '';

        // Update title
        const title = this.elements.rewardsOverlay?.querySelector('.rewards-title');
        if (title) title.textContent = 'Choose a Stage Prop';

        // Hide refresh button for prop selection
        if (this.elements.refreshRewardBtn) {
            this.elements.refreshRewardBtn.style.display = 'none';
        }

        // Update confirm button
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.disabled = true;
            this.elements.confirmRewardBtn.textContent = 'Collect Prop';
        }

        // Update skip button
        if (this.elements.skipRewardBtn) {
            this.elements.skipRewardBtn.style.display = 'none';
        }

        choices.forEach((propId, index) => {
            const prop = STAGE_PROP_DEFINITIONS[propId];
            if (!prop) return;

            const propDiv = document.createElement('div');
            propDiv.className = 'stage-prop-choice';
            propDiv.dataset.index = index;

            const iconDiv = document.createElement('div');
            iconDiv.className = 'stage-prop-choice__icon';
            iconDiv.textContent = prop.icon;
            propDiv.appendChild(iconDiv);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'stage-prop-choice__name';
            nameDiv.textContent = prop.name;
            propDiv.appendChild(nameDiv);

            const descDiv = document.createElement('div');
            descDiv.className = 'stage-prop-choice__desc';
            descDiv.textContent = prop.description;
            propDiv.appendChild(descDiv);

            propDiv.addEventListener('click', () => {
                this.selectPropChoice(index);
            });

            container.appendChild(propDiv);
        });
    },

    selectPropChoice(index) {
        this._selectedPropIndex = index;

        // Update visual selection
        const choices = this.elements.rewardsCards?.querySelectorAll('.stage-prop-choice');
        if (choices) {
            choices.forEach((el, i) => {
                el.classList.toggle('selected', i === index);
            });
        }

        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.disabled = false;
        }
    },

    confirmPropSelection() {
        if (this._selectedPropIndex === null || !this._propChoices) return;

        const propId = this._propChoices[this._selectedPropIndex];
        const prop = STAGE_PROP_DEFINITIONS[propId];

        if (prop) {
            this.stageProps.push(propId);
            console.log(`Collected stage prop: ${prop.name}`);
            this.showSpeechBubble(`${prop.icon} ${prop.name}!`, 'buff', this.elements.macguffin);
        }

        // Reset overlay state
        this.hidePropSelection();
    },

    hidePropSelection() {
        if (this.elements.rewardsOverlay) {
            this.elements.rewardsOverlay.style.display = 'none';
        }

        // Restore reward screen defaults
        const title = this.elements.rewardsOverlay?.querySelector('.rewards-title');
        if (title) title.textContent = 'Choose a Card';
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.textContent = 'Add to Deck';
        }
        if (this.elements.skipRewardBtn) {
            this.elements.skipRewardBtn.style.display = '';
        }
        if (this.elements.refreshRewardBtn) {
            this.elements.refreshRewardBtn.style.display = '';
        }

        const onComplete = this._propOnComplete;
        this._propChoices = null;
        this._selectedPropIndex = null;
        this._propOnComplete = null;

        if (onComplete) onComplete();
    },

    /**
     * Render collected stage props into the prop strip display.
     */
    renderStageProps() {
        const strip = this.elements.stagePropStrip;
        if (!strip) return;

        strip.innerHTML = '';

        if (!this.stageProps || this.stageProps.length === 0) {
            return;
        }

        for (const propId of this.stageProps) {
            const prop = STAGE_PROP_DEFINITIONS[propId];
            if (!prop) continue;

            const el = document.createElement('div');
            el.className = 'stage-prop-token';
            el.title = `${prop.name}: ${prop.description}`;

            const icon = document.createElement('span');
            icon.className = 'stage-prop-token__icon';
            icon.textContent = prop.icon;
            el.appendChild(icon);

            // Tap to show zoom detail
            el.addEventListener('click', () => {
                this.showStagePropZoom(prop);
            });

            strip.appendChild(el);
        }
    },

    /**
     * Show a zoomed detail overlay for a stage prop.
     * Same overlay pattern as showEnchantmentZoom / showCardZoom.
     */
    showStagePropZoom(prop) {
        if (this.zoomedCardElement) this.hideCardZoom();

        this._zoomJustOpened = true;
        requestAnimationFrame(() => { this._zoomJustOpened = false; });

        this.zoomedCard = -2; // sentinel for "prop zoom"

        const overlay = document.createElement('div');
        overlay.className = 'card-zoom-overlay';

        const detail = document.createElement('div');
        detail.className = 'prop-zoom-detail';

        const iconEl = document.createElement('div');
        iconEl.className = 'prop-zoom-detail__icon';
        iconEl.textContent = prop.icon;
        detail.appendChild(iconEl);

        const nameEl = document.createElement('div');
        nameEl.className = 'prop-zoom-detail__name';
        nameEl.textContent = prop.name;
        detail.appendChild(nameEl);

        const rule = document.createElement('div');
        rule.className = 'prop-zoom-detail__rule';
        detail.appendChild(rule);

        const descEl = document.createElement('div');
        descEl.className = 'prop-zoom-detail__desc';
        descEl.textContent = prop.description;
        detail.appendChild(descEl);

        const badge = document.createElement('div');
        badge.className = 'prop-zoom-detail__badge';
        badge.textContent = 'Stage Prop';
        detail.appendChild(badge);

        overlay.appendChild(detail);
        document.body.appendChild(overlay);

        this.zoomedCardElement = overlay;

        // Extract keywords and show audience explanations
        const keywords = this._extractPropKeywords(prop);
        if (keywords.length > 0) {
            this.showKeywordExplanations(keywords);
        }
    },

    /**
     * Extract keyword glossary keys mentioned in a prop's description.
     */
    _extractPropKeywords(prop) {
        const desc = prop.description || '';
        const found = [];
        for (const key in KEYWORD_GLOSSARY) {
            const entry = KEYWORD_GLOSSARY[key];
            if (entry.name && desc.includes(entry.name)) {
                found.push(key);
            }
        }
        return found;
    }
});
