/**
 * Curtain Call — Turn Lifecycle & Ovation
 *
 * Turn management (start/end), start-of-turn keyword processing,
 * debuff decay, curse resolution, enemy passive triggers,
 * ovation meter, and victory/defeat handlers.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // =========================================================================
    // === Turn Management =====================================================
    // =========================================================================

    async startTurn() {
        if (this.phase === 'gameover') return;

        this.turnNumber++;
        this.phase = 'player';
        console.log(`Turn ${this.turnNumber} started`);

        // Reset energy
        this.energy.current = this.energy.max;
        this.renderEnergy();

        // Process start-of-turn keywords (DoTs, decay)
        this.processStartOfTurnKeywords();

        // Emit playerTurnStart for event bus listeners
        await this.events.emit('playerTurnStart', { turn: this.turnNumber });

        // Draw cards up to hand size
        this.drawToHandSize();

        // Render full state
        this.renderStatusEffects();
        this.renderCombatState();

        // Enable End Turn button
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = false;
            this.elements.endTurnBtn.textContent = 'End Turn';
        }
    },

    drawToHandSize() {
        while (this.hand.length < this.handSize) {
            const card = this.drawCard();
            if (!card) break;
            this.hand.push(card);
        }
        this.renderHand();
        this.renderDeckCount();
    },

    async endTurn() {
        if (this.phase !== 'player' || this.isAnimating) return;

        this.isAnimating = true;
        this.phase = 'enemy';
        console.log(`Turn ${this.turnNumber} - Player phase ended`);

        // Wait for any queued card effects to finish
        await this._waitForEffectQueue();

        // Disable End Turn button
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = 'Enemy Turn...';
        }

        // Discard remaining hand (clear temp buffs)
        while (this.hand.length > 0) {
            const card = this.hand.pop();
            delete card.costReduction;
            delete card.damageBonus;
            this.discardPile.push(card);
        }
        this.renderHand();

        // Decay player debuffs at end of turn (so they persist the full player turn)
        this._decayPlayerDebuffs();

        // Resolve Curse damage on MacGuffin before enemy acts
        await this.processEndOfTurnCurse();

        // Emit playerTurnEnd for event bus listeners
        await this.events.emit('playerTurnEnd', { turn: this.turnNumber });

        await this.wait(300);

        // Reset enemy per-turn defenses (passives can modify via beforeEnemyDefenseReset)
        const defenseCtx = { halfBlock: false, keepRetaliate: false };
        await this.events.emit('beforeEnemyDefenseReset', defenseCtx);

        if (defenseCtx.halfBlock) {
            this.keywords.enemy.block = Math.floor(this.keywords.enemy.block / 2);
        } else {
            this.keywords.enemy.block = 0;
        }
        this.keywords.enemy.shield = 0;
        if (!defenseCtx.keepRetaliate) {
            this.keywords.enemy.retaliate = 0;
        }

        // Enemy Regenerate (enemy self-buff, processes on enemy turn)
        const ek = this.keywords.enemy;
        if (ek.regenerate > 0) {
            let healAmt = ek.regenerate;
            if (ek.poison > 0) healAmt = Math.max(0, healAmt - ek.poison);
            if (healAmt > 0) {
                const enemy = this.combatState.enemy;
                const oldHP = enemy.currentHP;
                enemy.currentHP = Math.min(enemy.maxHP, enemy.currentHP + healAmt);
                const healed = enemy.currentHP - oldHP;
                if (healed > 0) {
                    this.showHealBubble(healed, this.elements.enemyPuppet);
                    this.renderEnemyHP();
                }
            }
            ek.regenerate--;
        }

        // Emit enemyTurnStart for event bus listeners (replaces processEnemyTurnStartPassives)
        await this.events.emit('enemyTurnStart', { turn: this.turnNumber });

        this.renderCombatState();

        // Enemy executes their intent
        await this.executeEnemyTurn();

        // Emit enemyTurnEnd for event bus listeners (e.g. narrative-control)
        await this.events.emit('enemyTurnEnd', { turn: this.turnNumber });

        // Reset player per-turn defenses
        this.combatState.block = 0;
        this.combatState.distract = 0;
        this.combatState.retaliate = 0;
        this.combatState.aldric.shield = 0;
        this.combatState.aldric.taunt = 0;
        this.combatState.pip.shield = 0;
        this.combatState.pip.taunt = 0;
        this.renderMacGuffinBlock();
        this.renderProtagonistDefenses('aldric');
        this.renderProtagonistDefenses('pip');

        this.renderStatusEffects();
        this.isAnimating = false;

        // Check defeat
        if (this.combatState.macguffin.currentHP <= 0) {
            this.onDefeat();
            return;
        }
        if (this.combatState.enemy.currentHP <= 0) {
            return; // Already handled in onEnemyDefeated
        }

        // Start next turn
        await this.startTurn();
    },

    // =========================================================================
    // === Start-of-Turn Keyword Processing ====================================
    // =========================================================================

    processStartOfTurnKeywords() {
        const kw = this.keywords;

        // --- Ovation decay ---
        if (kw.ovation > 0) {
            const decay = kw.flourish > 0 ? 2 : 1;
            kw.ovation = Math.max(0, kw.ovation - decay);
        }

        // Remove Flourish
        kw.flourish = 0;

        // --- Protagonist DoTs and keyword decay ---
        for (const prot of ['aldric', 'pip']) {
            const state = this.combatState[prot];
            if (state.knockedOut) continue;

            const protKw = kw[prot];
            const debuffs = kw.debuffs[prot];

            // Regenerate: heal, reduced by Poison, then decay
            if (protKw.regenerate > 0) {
                let healAmt = protKw.regenerate;
                if (debuffs.poison > 0) {
                    healAmt = Math.max(0, healAmt - debuffs.poison);
                }
                if (healAmt > 0) {
                    const oldHP = state.currentHP;
                    state.currentHP = Math.min(state.maxHP, state.currentHP + healAmt);
                    const healed = state.currentHP - oldHP;
                    if (healed > 0) {
                        this.showHealBubble(healed, this.getTargetElement(prot));
                        this.renderProtagonistHP(prot);
                    }
                }
                protKw.regenerate--;
            }

            // Poison: damage, then decay
            if (debuffs.poison > 0) {
                const poisonDmg = debuffs.poison;
                state.currentHP = Math.max(0, state.currentHP - poisonDmg);
                this.showDamageBubble(poisonDmg, this.getTargetElement(prot));
                this.renderProtagonistHP(prot);
                debuffs.poison--;
                if (state.currentHP <= 0) {
                    state.knockedOut = true;
                    this.renderKnockoutState(prot);
                    this.showSpeechBubble('KO!', 'damage', this.getTargetElement(prot));
                }
            }

            // Burn: damage, then decay
            if (debuffs.burn > 0 && !state.knockedOut) {
                const burnDmg = debuffs.burn;
                state.currentHP = Math.max(0, state.currentHP - burnDmg);
                this.showDamageBubble(burnDmg, this.getTargetElement(prot));
                this.renderProtagonistHP(prot);
                debuffs.burn--;
                if (state.currentHP <= 0) {
                    state.knockedOut = true;
                    this.renderKnockoutState(prot);
                    this.showSpeechBubble('KO!', 'damage', this.getTargetElement(prot));
                }
            }

            // Fear/Frustration conversion
            this.checkFearFrustration(prot);
        }

        // Global player keyword decay
        if (kw.fortify > 0) kw.fortify--;
        if (kw.piercing > 0) kw.piercing--;
        if (kw.focus > 0) kw.focus--;

        // --- Player-inflicted enemy DoTs (process on player turn) ---
        const ek = kw.enemy;

        // Enemy Poison (player-inflicted)
        if (ek.poison > 0) {
            const poisonDmg = ek.poison;
            this.combatState.enemy.currentHP = Math.max(0, this.combatState.enemy.currentHP - poisonDmg);
            this.showDamageBubble(poisonDmg, this.elements.enemyPuppet);
            this.renderEnemyHP();
            ek.poison--;
            if (this.combatState.enemy.currentHP <= 0) {
                this.onEnemyDefeated();
                return;
            }
        }

        // Enemy Burn (player-inflicted)
        if (ek.burn > 0) {
            const burnDmg = ek.burn;
            this.combatState.enemy.currentHP = Math.max(0, this.combatState.enemy.currentHP - burnDmg);
            this.showDamageBubble(burnDmg, this.elements.enemyPuppet);
            this.renderEnemyHP();
            ek.burn--;
            if (this.combatState.enemy.currentHP <= 0) {
                this.onEnemyDefeated();
                return;
            }
        }

        // Player-inflicted enemy debuff decay
        if (ek.stageFright > 0) ek.stageFright--;
        if (ek.heckled > 0) ek.heckled--;
        if (ek.forgetful > 0) ek.forgetful--;
        if (ek.vulnerable > 0) ek.vulnerable--;
        if (ek.weak > 0) ek.weak--;
        if (ek.confused > 0) ek.confused--;

        // Enemy Fear/Frustration conversion
        this.checkEnemyFearFrustration();

        // Reset turn tracking
        kw.cardsPlayedThisTurn = 0;
    },

    _decayPlayerDebuffs() {
        const kw = this.keywords;

        // Protagonist debuff decay
        for (const prot of ['aldric', 'pip']) {
            const debuffs = kw.debuffs[prot];
            if (debuffs.stageFright > 0) debuffs.stageFright--;
            if (debuffs.heckled > 0) debuffs.heckled--;
            if (debuffs.forgetful > 0) debuffs.forgetful--;
            if (debuffs.vulnerable > 0) debuffs.vulnerable--;
        }

        // MacGuffin debuff decay
        if (kw.debuffs.macguffin.vulnerable > 0) kw.debuffs.macguffin.vulnerable--;

        // Global player debuff decay
        if (kw.weak > 0) kw.weak--;
        if (kw.confused > 0) kw.confused--;

        this.renderStatusEffects();
    },

    async processEndOfTurnCurse() {
        const curse = this.keywords.curse;
        if (curse <= 0) return;

        // Curse deals damage to MacGuffin, reduced by Block
        let damage = curse;

        if (this.combatState.block > 0 && damage > 0) {
            const blocked = Math.min(damage, this.combatState.block);
            damage -= blocked;
            this.combatState.block -= blocked;
            this.renderMacGuffinBlock();
            if (blocked > 0) {
                this.showSpeechBubble(`Blocked ${blocked}`, 'block', this.elements.macguffin);
            }
        }

        if (damage > 0) {
            this.combatState.macguffin.currentHP = Math.max(0, this.combatState.macguffin.currentHP - damage);
            this.showDamageBubble(damage, this.elements.macguffin);
            this.renderMacGuffinHP();

            // Ovation loss on unblocked MacGuffin damage
            this.loseOvation(1);
        }

        this.keywords.curse = 0; // Consumed
        this.showSpeechBubble('Curse!', 'debuff', this.elements.macguffin);
        this.renderStatusEffects();
        await this.wait(400);
    },

    // =========================================================================
    // === Ovation =============================================================
    // =========================================================================

    gainOvation(amount) {
        if (this.keywords.flourish > 0) amount *= 2;
        const prevOvation = this.keywords.ovation;
        this.keywords.ovation = Math.min(5, this.keywords.ovation + amount);
        this.renderStatusEffects();
        this.renderOvationMeter();

        const delta = this.keywords.ovation - prevOvation;
        if (delta !== 0) {
            this.events.emit('ovationChanged', { ovation: this.keywords.ovation, delta });
        }

        // Protagonist speech when ovation reaches max (5)
        if (prevOvation < 5 && this.keywords.ovation >= 5) {
            const speaker = Math.random() < 0.5 ? 'aldric' : 'pip';
            this.tryProtagonistSpeech(speaker, 'ovationMax');
            this.tryCrowdReaction('ovationMax');
        }
    },

    loseOvation(amount) {
        if (this.keywords.flourish > 0) amount *= 2;
        const prev = this.keywords.ovation;
        this.keywords.ovation = Math.max(0, this.keywords.ovation - amount);
        this.renderStatusEffects();
        this.renderOvationMeter();

        const delta = this.keywords.ovation - prev;
        if (delta !== 0) {
            this.events.emit('ovationChanged', { ovation: this.keywords.ovation, delta });
        }
    },

    getOvationDamageBonus() {
        const ov = this.keywords.ovation;
        if (ov >= 5) return 2;
        if (ov >= 2) return 1;
        return 0;
    },

    renderOvationMeter() {
        const ov = this.keywords.ovation;
        if (this.elements.ovationFill) {
            this.elements.ovationFill.style.width = `${(ov / 5) * 100}%`;
        }
        if (this.elements.ovationValue) {
            this.elements.ovationValue.textContent = ov;
        }
        if (this.elements.ovationMeter) {
            this.elements.ovationMeter.classList.toggle('ovation-active', ov >= 2);
            this.elements.ovationMeter.classList.toggle('ovation-max', ov >= 5);
        }
    },

    // =========================================================================
    // === Victory / Defeat ====================================================
    // =========================================================================

    onEnemyDefeated() {
        this.phase = 'reward';
        const enemy = this.combatState.enemy;
        console.log(`${enemy.name} defeated!`);

        // Clean up enemy passive listeners
        this.events.offByOwner('enemy-passive');
        this.events.emit('enemyDefeated', { enemyId: enemy.id, isBoss: enemy.isBoss });
        this.events.emit('combatEnd', { result: 'victory', enemyId: enemy.id });

        this.elements.enemyPuppet.classList.remove('enemy-idle');
        this.elements.enemyPuppet.classList.add('enemy-defeat');

        // Guaranteed enemy defeat speech
        this.tryEnemySpeech(enemy.id, 'defeat', { guaranteed: true });

        setTimeout(() => {
            // Protagonist celebration (uses new speech system)
            const celebrator = Math.random() < 0.5 ? 'aldric' : 'pip';
            this.tryProtagonistSpeech(celebrator, 'enemyDefeated');
            this.tryCrowdReaction('enemyDefeated');
            this.triggerAudienceReaction('excited');
        }, 500);

        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = enemy.isBoss ? 'Boss Defeated!' : 'Victory!';
        }

        this.updateProgressIndicator();

        if (enemy.isBoss) {
            setTimeout(() => this.showRewardsScreen('boss'), 2000);
        } else {
            setTimeout(() => this.showRewardsScreen('normal'), 1500);
        }
    },

    onDefeat() {
        this.phase = 'gameover';
        console.log('MacGuffin destroyed - Defeat!');

        // Clean up enemy passive listeners
        this.events.offByOwner('enemy-passive');
        this.events.emit('combatEnd', { result: 'defeat' });

        this.showCharacterBubble('NOOO!', this.elements.macguffin);

        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = 'Defeated';
        }

        // Clean up saved run
        this.deleteCompletedRun();
    }
});
