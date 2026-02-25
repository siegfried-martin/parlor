/**
 * Curtain Call — Enchantment System
 *
 * Activation, event listener registration, rendering, and cleanup
 * for enchantment cards. Enchantments are persistent effects that
 * last for the duration of a combat, registering as event bus listeners.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    /**
     * Activate an enchantment card: add to active list, register listeners, render.
     * Called from playCard() when card.type === 'enchantment'.
     */
    activateEnchantment(card) {
        this.activeEnchantments.push(card);
        this.registerEnchantmentListeners(card);
        this.renderEnchantments();

        // Speech bubble
        const heroEl = card.owner === 'aldric' ? this.elements.heroAldric
            : card.owner === 'pip' ? this.elements.heroPip
            : this.elements.macguffin;
        this.showSpeechBubble(`${card.name}!`, 'buff', heroEl);

        // Emit for event bus listeners
        this.events.emit('enchantmentPlayed', { card });
    },

    /**
     * Register event bus listeners for a specific enchantment card.
     * Each listener uses owner = `enchantment-{instanceId}` for targeted cleanup,
     * plus the general 'enchantment' owner for bulk combat-end cleanup.
     */
    registerEnchantmentListeners(card) {
        const owner = `enchantment-${card.instanceId}`;
        const game = this;

        switch (card.id) {
            // --- Aldric Enchantments ---

            case 'dramatic-lighting':
                // At end of turn, double your Retaliate stacks
                this.events.on('playerTurnEnd', async () => {
                    if (game.combatState.retaliate > 0) {
                        const prev = game.combatState.retaliate;
                        game.combatState.retaliate *= 2;
                        game.showSpeechBubble(`Retaliate ${prev}→${game.combatState.retaliate}!`, 'buff', game.elements.macguffin);
                        game.renderStatusEffects();
                    }
                }, { owner });
                break;

            case 'fortress-scene':
                // At end of turn, gain Shield equal to Aldric's Taunt stacks
                this.events.on('playerTurnEnd', async () => {
                    const taunt = game.combatState.aldric.taunt;
                    if (taunt > 0) {
                        game.combatState.aldric.shield += taunt;
                        game.showSpeechBubble(`Shield +${taunt}`, 'block', game.elements.heroAldric);
                        game.renderProtagonistDefenses('aldric');
                    }
                }, { owner });
                break;

            case 'curtain-of-iron':
                // Whenever you gain Block, gain 1 Ovation
                this.events.on('blockGained', async (data) => {
                    if (data.amount > 0) {
                        game.gainOvation(1);
                    }
                }, { owner });
                break;

            case 'war-drums':
                // At the start of your turn, gain 1 Fortify and 1 Retaliate
                this.events.on('playerTurnStart', async () => {
                    game.keywords.fortify += 1;
                    game.combatState.retaliate += 1;
                    game.showSpeechBubble('Fortify +1, Retaliate +1', 'buff', game.elements.macguffin);
                    game.renderStatusEffects();
                }, { owner });
                break;

            // --- Pip Enchantments ---

            case 'comic-relief':
                // Whenever you inflict a debuff on the enemy, gain 1 Luck
                this.events.on('debuffInflictedOnEnemy', async () => {
                    game.keywords.luck += 1;
                    game.showSpeechBubble('Luck +1', 'buff', game.elements.heroPip);
                    game.renderStatusEffects();
                }, { owner });
                break;

            case 'plot-twist':
                // At the end of the enemy's turn, deal damage equal to their Frustrated stacks
                this.events.on('enemyTurnEnd', async () => {
                    const frustrated = game.keywords.enemy.frustration || 0;
                    if (frustrated > 0) {
                        game.showSpeechBubble(`Plot Twist! ${frustrated} dmg`, 'damage', game.elements.enemyPuppet);
                        game.combatState.enemy.currentHP = Math.max(0, game.combatState.enemy.currentHP - frustrated);
                        game.renderEnemyHP();
                        if (game.combatState.enemy.currentHP <= 0) {
                            game.onEnemyDefeated();
                        }
                    }
                }, { owner });
                break;

            case 'encore':
                // Whenever you play your 3rd card in a turn, gain 1 Ovation and draw 1 card
                this.events.on('cardPlayed', async (data) => {
                    if (data.cardsPlayedThisTurn === 3) {
                        game.gainOvation(1);
                        await game.drawCards(1);
                        game.showSpeechBubble('Encore!', 'buff', game.elements.heroPip);
                    }
                }, { owner });
                break;

            case 'smoke-and-mirrors':
                // At the end of your turn, gain Distract equal to unique debuff types on the enemy
                this.events.on('playerTurnEnd', async () => {
                    const ek = game.keywords.enemy;
                    let uniqueDebuffs = 0;
                    const debuffKeys = ['poison', 'burn', 'vulnerable', 'weak', 'confused',
                                       'fear', 'frustration', 'stageFright', 'heckled', 'forgetful'];
                    for (const key of debuffKeys) {
                        if (ek[key] > 0) uniqueDebuffs++;
                    }
                    if (uniqueDebuffs > 0) {
                        game.combatState.distract += uniqueDebuffs;
                        game.showSpeechBubble(`Distract +${uniqueDebuffs}`, 'buff', game.elements.macguffin);
                        game.renderStatusEffects();
                    }
                }, { owner });
                break;
        }
    },

    /**
     * Remove all enchantment listeners and clear the active enchantments list.
     * Called at combat end (victory or defeat).
     */
    clearEnchantments() {
        for (const card of this.activeEnchantments) {
            this.events.offByOwner(`enchantment-${card.instanceId}`);
            // Return enchantment cards to the discard pile for next combat
            this.discardPile.push(card);
        }
        this.activeEnchantments = [];
        this.renderEnchantments();
    },

    /**
     * Show a zoomed card overlay for an active enchantment.
     */
    showEnchantmentZoom(card) {
        // Reuse the same card zoom overlay pattern
        if (this.zoomedCardElement) this.hideCardZoom();

        this.zoomedCard = -1; // sentinel for "enchantment zoom"

        const overlay = document.createElement('div');
        overlay.className = 'card-zoom-overlay';

        const zoomedCardDiv = this.createZoomedCardElement(card);
        overlay.appendChild(zoomedCardDiv);
        document.body.appendChild(overlay);

        this.zoomedCardElement = overlay;

        // Extract keywords mentioned in the card description
        const keywords = ['enchantment'];
        const desc = card.description || '';
        for (const key in KEYWORD_GLOSSARY) {
            const entry = KEYWORD_GLOSSARY[key];
            if (key === 'enchantment') continue;
            if (entry.name && desc.includes(entry.name)) {
                keywords.push(key);
            }
        }
        this.showKeywordExplanations(keywords);
    },

    /**
     * Render active enchantments into the enchantment strip.
     */
    renderEnchantments() {
        const strip = this.elements.enchantmentStrip;
        if (!strip) return;

        strip.innerHTML = '';

        if (this.activeEnchantments.length === 0) {
            strip.style.display = 'none';
            return;
        }

        strip.style.display = 'flex';

        for (const card of this.activeEnchantments) {
            const el = document.createElement('div');
            el.className = `enchantment-token card-${card.owner}`;
            el.dataset.instanceId = card.instanceId;

            const icon = document.createElement('span');
            icon.className = 'enchantment-token__icon';
            icon.textContent = '\u2727';
            el.appendChild(icon);

            const name = document.createElement('span');
            name.className = 'enchantment-token__name';
            name.textContent = card.name;
            el.appendChild(name);

            // Tap to show card zoom
            el.addEventListener('click', () => {
                this.showEnchantmentZoom(card);
            });

            strip.appendChild(el);
        }
    }
});
