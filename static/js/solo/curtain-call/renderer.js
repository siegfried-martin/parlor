/**
 * Curtain Call — Combat State Display & Speech Bubbles
 *
 * Full combat state rendering (HP bars, defenses, intent, energy,
 * deck counts), status effect icons (player, protagonist, enemy),
 * and speech bubble display system.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // === Combat State Display ===

    renderCombatState() {
        this.renderMacGuffinHP();
        this.renderMacGuffinBlock();
        this.renderProtagonistHP('aldric');
        this.renderProtagonistHP('pip');
        this.renderKnockoutState('aldric');
        this.renderKnockoutState('pip');
        this.renderProtagonistDefenses('aldric');
        this.renderProtagonistDefenses('pip');
        this.renderEnemyHP();
        this.renderEnemyIntent();
        this.renderOvationMeter();
        this.renderStatusEffects();
        this.renderDeckCount();
    },

    renderProtagonistHP(protagonist) {
        const state = this.combatState[protagonist];
        if (!state) return;

        const fillEl = protagonist === 'aldric' ? this.elements.aldricHPFill : this.elements.pipHPFill;
        const textEl = protagonist === 'aldric' ? this.elements.aldricHPText : this.elements.pipHPText;

        const percentage = Math.max(0, Math.min(100, (state.currentHP / state.maxHP) * 100));

        if (fillEl) {
            fillEl.style.width = `${percentage}%`;
        }
        if (textEl) {
            textEl.textContent = `${state.currentHP}/${state.maxHP}`;
        }
    },

    renderKnockoutState(protagonist) {
        const state = this.combatState[protagonist];
        if (!state) return;

        const puppetEl = protagonist === 'aldric' ? this.elements.heroAldric : this.elements.heroPip;
        if (!puppetEl) return;

        if (state.knockedOut) {
            puppetEl.classList.add('knocked-out');
            // Add KO badge if not already present
            if (!puppetEl.querySelector('.ko-badge')) {
                const badge = document.createElement('div');
                badge.className = 'ko-badge';
                badge.textContent = 'KO';
                puppetEl.appendChild(badge);
            }
        } else {
            puppetEl.classList.remove('knocked-out');
            const badge = puppetEl.querySelector('.ko-badge');
            if (badge) badge.remove();
        }
    },

    renderProtagonistDefenses(protagonist) {
        const state = this.combatState[protagonist];
        if (!state) return;

        const puppetEl = protagonist === 'aldric' ? this.elements.heroAldric : this.elements.heroPip;
        if (!puppetEl) return;

        // Shield indicator
        let shieldEl = puppetEl.querySelector('.hero-shield');
        if (state.shield > 0) {
            if (!shieldEl) {
                shieldEl = document.createElement('div');
                shieldEl.className = 'hero-shield status-icon';
                shieldEl.setAttribute('title', 'Shield');
                shieldEl.innerHTML = '<span class="shield-icon">&#x1F6E1;</span><span class="shield-value"></span>';
                puppetEl.appendChild(shieldEl);
            }
            shieldEl.querySelector('.shield-value').textContent = state.shield;
            shieldEl.style.display = 'flex';
        } else if (shieldEl) {
            shieldEl.style.display = 'none';
        }

        // Taunt indicator
        let tauntEl = puppetEl.querySelector('.hero-taunt');
        if (state.taunt > 0) {
            if (!tauntEl) {
                tauntEl = document.createElement('div');
                tauntEl.className = 'hero-taunt status-icon';
                tauntEl.setAttribute('title', 'Taunt');
                tauntEl.innerHTML = '<span class="taunt-icon">&#x1F3AF;</span><span class="taunt-value"></span>';
                puppetEl.appendChild(tauntEl);
            }
            tauntEl.querySelector('.taunt-value').textContent = state.taunt;
            tauntEl.style.display = 'flex';
        } else if (tauntEl) {
            tauntEl.style.display = 'none';
        }
    },

    renderMacGuffinHP() {
        const { currentHP, maxHP } = this.combatState.macguffin;
        const percentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));

        if (this.elements.macguffinHPFill) {
            this.elements.macguffinHPFill.style.width = `${percentage}%`;
        }
        if (this.elements.macguffinHPText) {
            this.elements.macguffinHPText.textContent = `${currentHP}/${maxHP}`;
        }
    },

    renderMacGuffinBlock() {
        const block = this.combatState.block;

        if (this.elements.macguffinBlock) {
            if (block > 0) {
                this.elements.macguffinBlock.style.display = 'flex';
                this.elements.macguffinBlock.querySelector('.block-value').textContent = block;
            } else {
                this.elements.macguffinBlock.style.display = 'none';
            }
        }
    },

    renderEnemyHP() {
        const { currentHP, maxHP } = this.combatState.enemy;
        const percentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));

        if (this.elements.enemyHPFill) {
            this.elements.enemyHPFill.style.width = `${percentage}%`;
        }
        if (this.elements.enemyHPText) {
            this.elements.enemyHPText.textContent = `${currentHP}/${maxHP}`;
        }
    },

    renderEnemyIntent() {
        const { type, value, hits = 1, target } = this.combatState.enemy.intent;

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
            // Format display: AoE prefix, multi-hit suffix
            let displayText = `${value}`;
            if (hits > 1) {
                displayText = `${value} \u00d7${hits}`;
            }
            if (target === 'all') {
                displayText += ' AoE';
            }
            this.elements.intentValue.textContent = displayText;
            this.elements.intentValue.className = `intent-value intent-${type}`;
        }
        if (this.elements.enemyIntent) {
            this.elements.enemyIntent.className = `enemy-intent intent-${type}`;
        }
    },

    // === Energy Display ===

    renderEnergy() {
        if (this.elements.energyValue) {
            this.elements.energyValue.textContent = this.energy.current;
        }
        // Update card playability when energy changes
        this.updateCardPlayability();
    },

    // === Deck Count Display ===

    renderDeckCount() {
        if (this.elements.deckCountDraw) {
            this.elements.deckCountDraw.textContent = this.deck.length;
        }
        if (this.elements.deckCountDiscard) {
            this.elements.deckCountDiscard.textContent = this.discardPile.length;
        }
    },

    // === v2 Status Effects Display ===

    renderStatusEffects() {
        const kw = this.keywords;

        // --- Player global status (below MacGuffin) ---
        let container = document.getElementById('status-effects');
        if (!container) {
            container = document.createElement('div');
            container.id = 'status-effects';
            container.className = 'status-effects';
            this.elements.macguffin?.parentNode?.insertBefore(container, this.elements.macguffin.nextSibling);
        }

        const effects = [];

        // Global defensive pools (from combatState)
        if (this.combatState.distract > 0) {
            effects.push(this._statusIcon('buff', 'Distract', '\uD83C\uDF00', this.combatState.distract));
        }
        if (this.combatState.retaliate > 0) {
            effects.push(this._statusIcon('buff', 'Retaliate', '\u26A1', this.combatState.retaliate));
        }

        // Positive keywords
        if (kw.inspire > 0) {
            effects.push(this._statusIcon('buff', 'Inspire', '\u2728', kw.inspire));
        }
        if (kw.fortify > 0) {
            effects.push(this._statusIcon('buff', 'Fortify', '\uD83C\uDFF0', kw.fortify));
        }
        if (kw.piercing > 0) {
            effects.push(this._statusIcon('buff', 'Piercing', '\uD83D\uDDE1\uFE0F', kw.piercing));
        }
        if (kw.focus > 0) {
            effects.push(this._statusIcon('buff', 'Focus', '\uD83C\uDFAF', kw.focus));
        }
        if (kw.ward > 0) {
            effects.push(this._statusIcon('buff', 'Ward', '\uD83D\uDD2E', kw.ward));
        }
        if (kw.luck > 0) {
            effects.push(this._statusIcon('buff', 'Luck', '\uD83C\uDF40', kw.luck));
        }
        if (kw.flourish > 0) {
            effects.push(this._statusIcon('buff', 'Flourish', '\uD83C\uDF1F', kw.flourish));
        }

        // Global debuffs
        if (kw.weak > 0) {
            effects.push(this._statusIcon('debuff', 'Weak', '\uD83D\uDCAA', kw.weak));
        }
        if (kw.confused > 0) {
            effects.push(this._statusIcon('debuff', 'Confused', '\u2753', kw.confused));
        }
        if (kw.curse > 0) {
            effects.push(this._statusIcon('debuff', 'Curse', '\uD83D\uDC80', kw.curse));
        }

        container.innerHTML = effects.join('');

        // --- Per-protagonist debuffs ---
        this.renderProtagonistDebuffs('aldric');
        this.renderProtagonistDebuffs('pip');

        // --- MacGuffin Vulnerable ---
        this.renderMacGuffinDebuffs();

        // --- Enemy keywords ---
        this.renderEnemyKeywords();
    },

    _statusIcon(type, title, icon, value) {
        return `<span class="status-icon ${type}" title="${title}"><span class="status-emoji">${icon}</span><span class="status-value">${value}</span></span>`;
    },

    renderProtagonistDebuffs(protagonist) {
        const puppetEl = protagonist === 'aldric' ? this.elements.heroAldric : this.elements.heroPip;
        if (!puppetEl) return;

        let container = puppetEl.querySelector('.protagonist-debuffs');
        if (!container) {
            container = document.createElement('div');
            container.className = 'protagonist-debuffs status-effects';
            puppetEl.appendChild(container);
        }

        const debuffs = this.keywords.debuffs[protagonist];
        const protKw = this.keywords[protagonist];
        const effects = [];

        // Positive: Regenerate
        if (protKw && protKw.regenerate > 0) {
            effects.push(this._statusIcon('buff', 'Regenerate', '\uD83D\uDC9A', protKw.regenerate));
        }

        // Debuffs
        if (debuffs.poison > 0) {
            effects.push(this._statusIcon('debuff', 'Poison', '\u2620\uFE0F', debuffs.poison));
        }
        if (debuffs.burn > 0) {
            effects.push(this._statusIcon('debuff', 'Burn', '\uD83D\uDD25', debuffs.burn));
        }
        if (debuffs.stageFright > 0) {
            effects.push(this._statusIcon('debuff', 'Stage Fright', '\uD83D\uDE30', debuffs.stageFright));
        }
        if (debuffs.heckled > 0) {
            effects.push(this._statusIcon('debuff', 'Heckled', '\uD83D\uDDE3\uFE0F', debuffs.heckled));
        }
        if (debuffs.forgetful > 0) {
            effects.push(this._statusIcon('debuff', 'Forgetful', '\uD83D\uDCAB', debuffs.forgetful));
        }
        if (debuffs.vulnerable > 0) {
            effects.push(this._statusIcon('debuff', 'Vulnerable', '\uD83D\uDC94', debuffs.vulnerable));
        }
        if (debuffs.fear > 0) {
            effects.push(this._statusIcon('debuff', 'Fear', '\uD83D\uDE31', debuffs.fear));
        }
        if (debuffs.frustration > 0) {
            effects.push(this._statusIcon('debuff', 'Frustration', '\uD83D\uDE24', debuffs.frustration));
        }

        container.innerHTML = effects.join('');
    },

    renderMacGuffinDebuffs() {
        const macEl = this.elements.macguffin;
        if (!macEl) return;

        let container = macEl.querySelector('.macguffin-debuffs');
        if (!container) {
            container = document.createElement('div');
            container.className = 'macguffin-debuffs status-effects';
            macEl.appendChild(container);
        }

        const effects = [];
        if (this.keywords.debuffs.macguffin.vulnerable > 0) {
            effects.push(this._statusIcon('debuff', 'Vulnerable', '\uD83D\uDC94', this.keywords.debuffs.macguffin.vulnerable));
        }

        container.innerHTML = effects.join('');
    },

    renderEnemyKeywords() {
        let container = document.getElementById('enemy-status-effects');
        if (!container) {
            container = document.createElement('div');
            container.id = 'enemy-status-effects';
            container.className = 'status-effects enemy-status';
            const sidebar = document.getElementById('enemy-modifiers');
            if (sidebar) {
                sidebar.appendChild(container);
            } else {
                this.elements.enemyPuppet?.appendChild(container);
            }
        }

        const ek = this.keywords.enemy;
        const effects = [];

        // Enemy buffs
        if (ek.block > 0) {
            effects.push(this._statusIcon('buff', 'Block', '\uD83D\uDEE1\uFE0F', ek.block));
        }
        if (ek.shield > 0) {
            effects.push(this._statusIcon('buff', 'Shield', '\uD83D\uDEE1', ek.shield));
        }
        if (ek.regenerate > 0) {
            effects.push(this._statusIcon('buff', 'Regenerate', '\uD83D\uDC9A', ek.regenerate));
        }
        if (ek.inspire > 0) {
            effects.push(this._statusIcon('buff', 'Inspire', '\u2728', ek.inspire));
        }
        if (ek.retaliate > 0) {
            effects.push(this._statusIcon('buff', 'Retaliate', '\u26A1', ek.retaliate));
        }

        // Enemy debuffs
        if (ek.poison > 0) {
            effects.push(this._statusIcon('debuff', 'Poison', '\u2620\uFE0F', ek.poison));
        }
        if (ek.burn > 0) {
            effects.push(this._statusIcon('debuff', 'Burn', '\uD83D\uDD25', ek.burn));
        }
        if (ek.stageFright > 0) {
            effects.push(this._statusIcon('debuff', 'Stage Fright', '\uD83D\uDE30', ek.stageFright));
        }
        if (ek.heckled > 0) {
            effects.push(this._statusIcon('debuff', 'Heckled', '\uD83D\uDDE3\uFE0F', ek.heckled));
        }
        if (ek.forgetful > 0) {
            effects.push(this._statusIcon('debuff', 'Forgetful', '\uD83D\uDCAB', ek.forgetful));
        }
        if (ek.vulnerable > 0) {
            effects.push(this._statusIcon('debuff', 'Vulnerable', '\uD83D\uDC94', ek.vulnerable));
        }
        if (ek.weak > 0) {
            effects.push(this._statusIcon('debuff', 'Weak', '\uD83D\uDCAA', ek.weak));
        }
        if (ek.confused > 0) {
            effects.push(this._statusIcon('debuff', 'Confused', '\u2753', ek.confused));
        }
        if (ek.fear > 0) {
            effects.push(this._statusIcon('debuff', 'Fear', '\uD83D\uDE31', ek.fear));
        }
        if (ek.frustration > 0) {
            effects.push(this._statusIcon('debuff', 'Frustration', '\uD83D\uDE24', ek.frustration));
        }

        container.innerHTML = effects.join('');
    },

    renderEnemyPassive() {
        // Removed — passive label was redundant. Passives communicate through gameplay.
        // Cleanup any leftover DOM element
        const el = document.getElementById('enemy-passive');
        if (el) el.remove();
    },

    // === Speech Bubbles ===

    /**
     * Show a speech bubble near a target element
     * @param {string} text - The text to display
     * @param {string} type - 'damage' | 'block' | 'heal' | 'buff' | 'debuff' | 'attack-burst' | 'character'
     * @param {HTMLElement} targetElement - Element to position the bubble near
     * @param {Object} options - Additional options
     */
    showSpeechBubble(text, type, targetElement, options) {
        if (options === undefined) options = {};
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
        const top = Math.max(0, targetRect.top - containerRect.top + offsetY);

        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
        bubble.style.transform = 'translateX(-50%)';

        this.elements.speechBubbles.appendChild(bubble);

        // Variable display duration based on text length
        const wordCount = text.split(/\s+/).length;
        const baseDuration = typeof SPEECH_CONFIG !== 'undefined'
            ? SPEECH_CONFIG.displayDuration.min
            : 1500;
        const perWord = typeof SPEECH_CONFIG !== 'undefined'
            ? SPEECH_CONFIG.displayDuration.perWordOver3
            : 100;
        const maxDuration = typeof SPEECH_CONFIG !== 'undefined'
            ? SPEECH_CONFIG.displayDuration.max
            : 2500;
        const duration = Math.min(maxDuration, baseDuration + Math.max(0, wordCount - 3) * perWord);

        // Remove bubble after display duration
        setTimeout(() => {
            bubble.remove();
            this.bubbleOffset = Math.max(0, this.bubbleOffset - 1);
        }, duration);
    },

    showDamageBubble(amount, targetElement) {
        this.showSpeechBubble(`-${amount}`, 'damage', targetElement);
    },

    showBlockBubble(amount, targetElement) {
        this.showSpeechBubble(`+${amount} Block`, 'block', targetElement);
    },

    showHealBubble(amount, targetElement) {
        this.showSpeechBubble(`+${amount}`, 'heal', targetElement);
    },

    showAttackBubble(text, targetElement) {
        this.showSpeechBubble(text, 'attack-burst', targetElement, { offsetY: -20 });
    },

    showCharacterBubble(text, targetElement) {
        this.showSpeechBubble(text, 'character', targetElement, { offsetY: -30 });
    },

    onPuppetTap(puppet) {
        const id = puppet.id;
        console.log('Puppet tapped:', id);
        // Future: show stats popup
    }
});
