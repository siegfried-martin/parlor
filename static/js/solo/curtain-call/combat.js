/**
 * Curtain Call — v2 Combat System
 *
 * Turn management, enemy AI, card play, damage resolution,
 * keyword engine, boss phases, and enemy passives.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 *
 * Keyword state lives in this.keywords (see game.js).
 * Per-turn defenses (block, shield, taunt, distract, retaliate)
 * live in this.combatState.
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // =========================================================================
    // === Turn Management =====================================================
    // =========================================================================

    startTurn() {
        if (this.phase === 'gameover') return;

        this.turnNumber++;
        this.phase = 'player';
        console.log(`Turn ${this.turnNumber} started`);

        // Reset energy
        this.energy.current = this.energy.max;
        this.renderEnergy();

        // Process start-of-turn keywords (DoTs, decay, enemy passives)
        this.processStartOfTurnKeywords();

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

            // Stoic Resistance: gain Block equal to Ovation on draw
            if (card.blockOnDraw && this.keywords.ovation > 0) {
                let bonus = this.keywords.ovation;
                if (this.keywords.weak > 0) bonus = Math.floor(bonus * 0.5);
                if (this.keywords.fortify > 0) bonus += this.keywords.fortify;
                this.combatState.block += bonus;
                this.showSpeechBubble(`+${bonus} Block`, 'block', this.elements.macguffin);
                this.renderMacGuffinBlock();
            }
        }
        this.renderHand();
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

        // Discard remaining hand (clear temp cost reductions)
        while (this.hand.length > 0) {
            const card = this.hand.pop();
            delete card.costReduction;
            this.discardPile.push(card);
        }
        this.renderHand();

        // Decay player debuffs at end of turn (so they persist the full player turn)
        this._decayPlayerDebuffs();

        // Resolve Curse damage on MacGuffin before enemy acts
        await this.processEndOfTurnCurse();

        await this.wait(300);

        // Reset enemy per-turn defenses before their new turn
        if (this.enemyHasPassive('stage-fortress')) {
            this.keywords.enemy.block = Math.floor(this.keywords.enemy.block / 2);
        } else {
            this.keywords.enemy.block = 0;
        }
        this.keywords.enemy.shield = 0;
        if (!this.enemyHasPassive('dramatic-ego')) {
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

        // Enemy passive start-of-turn triggers
        this.processEnemyTurnStartPassives();

        this.renderCombatState();

        // Enemy executes their intent
        await this.executeEnemyTurn();

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
        this.startTurn();
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
        if (kw.accuracy > 0) kw.accuracy--;

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
    // === Enemy AI =============================================================
    // =========================================================================

    getCurrentPattern() {
        const enemy = this.combatState.enemy;
        const enemyDef = this.enemies[enemy.id];
        if (enemyDef.phases) {
            return enemyDef.phases[enemy.currentPhase].pattern;
        }
        return enemyDef.pattern;
    },

    getCurrentPatternEntry() {
        const pattern = this.getCurrentPattern();
        return pattern[this.combatState.enemy.patternIndex];
    },

    async executeEnemyTurn() {
        const enemy = this.combatState.enemy;
        const entry = this.getCurrentPatternEntry();
        const ek = this.keywords.enemy;

        console.log(`Enemy executes: ${entry.type} ${entry.value || ''}${(entry.hits || 1) > 1 ? ` x${entry.hits}` : ''}`);

        // Check enemy Stage Fright / Heckled restrictions
        const canAttack = ek.stageFright <= 0;
        const canNonAttack = ek.heckled <= 0;

        // Spotlight Phantom: all attacks have Accuracy
        const hasAccuracy = this.enemyHasPassive('blinding-light');

        // Comedy/Tragedy Mask: track state
        if (entry.state) {
            this.combatState.enemy.passiveState.currentState = entry.state;
        }

        // Determine actions to execute
        const actions = entry.actions
            ? entry.actions
            : [{ type: entry.type, value: entry.value, hits: entry.hits, target: entry.target }];

        for (const action of actions) {
            // Skip if enemy is defeated mid-turn
            if (enemy.currentHP <= 0) break;

            switch (action.type) {
                case 'attack': {
                    if (!canAttack) {
                        this.showSpeechBubble('Stage Fright!', 'debuff', this.elements.enemyPuppet);
                        break;
                    }
                    const target = action.target || entry.target;
                    if (target === 'all') {
                        await this.enemyAttackAoE(action.value, action.hits || 1, { hasAccuracy });
                    } else {
                        await this.enemyAttack(action.value, action.hits || 1, { hasAccuracy });
                    }
                    break;
                }
                case 'block':
                    if (!canNonAttack) break;
                    await this.enemyBlock(action.value);
                    break;
                case 'heal':
                    if (!canNonAttack) break;
                    await this.enemyHeal(action.value);
                    break;
                case 'inflict':
                    if (!canNonAttack) break;
                    await this.applyDebuffFromEnemy(action.keyword, action.value, action.target);
                    break;
                case 'gain':
                    if (!canNonAttack) break;
                    await this.enemyGainKeyword(action.keyword, action.value);
                    break;
                case 'attackEqualBlock': {
                    if (!canAttack) break;
                    const blockDmg = ek.block;
                    if (blockDmg > 0) {
                        await this.enemyAttack(blockDmg, 1, { hasAccuracy });
                    }
                    break;
                }
            }
        }

        // Narrative Control passive (Playwright: 25% chance to clear a debuff)
        if (this.enemyHasPassive('narrative-control')) {
            if (Math.random() < 0.25) {
                const debuffKeys = ['poison', 'burn', 'stageFright', 'heckled', 'forgetful',
                    'vulnerable', 'weak', 'confused'];
                const active = debuffKeys.filter(k => ek[k] > 0);
                if (active.length > 0) {
                    const toClear = active[Math.floor(Math.random() * active.length)];
                    ek[toClear] = 0;
                    this.showSpeechBubble('Narrative Control!', 'buff', this.elements.enemyPuppet);
                    this.renderStatusEffects();
                    await this.wait(300);
                }
            }
        }

        // Check boss phase transition (player damage may have triggered it)
        this.checkBossPhaseTransition();

        // Set next intent from (potentially new) phase
        this.setNextEnemyIntent();
    },

    setNextEnemyIntent() {
        const enemy = this.combatState.enemy;
        const pattern = this.getCurrentPattern();

        enemy.patternIndex = (enemy.patternIndex + 1) % pattern.length;
        const nextEntry = pattern[enemy.patternIndex];

        // Store display-only fields in intent
        enemy.intent = {
            type: nextEntry.type,
            value: nextEntry.value,
            hits: nextEntry.hits || 1,
            target: nextEntry.target
        };

        this.renderEnemyIntent();
    },

    checkBossPhaseTransition() {
        const enemy = this.combatState.enemy;
        const enemyDef = this.enemies[enemy.id];
        if (!enemyDef.phases) return;

        const hpRatio = enemy.currentHP / enemy.maxHP;
        let targetPhase = 0;

        for (let i = 1; i < enemyDef.phases.length; i++) {
            if (hpRatio <= enemyDef.phases[i].hpThreshold) {
                targetPhase = i;
            }
        }

        if (targetPhase <= enemy.currentPhase) return;

        console.log(`Boss phase transition: ${enemy.currentPhase} -> ${targetPhase}`);

        // Apply transition effects
        const phase = enemyDef.phases[targetPhase];
        if (phase.transition) {
            const t = phase.transition;
            if (t.block) {
                this.keywords.enemy.block += t.block;
                this.showSpeechBubble(`+${t.block} Block`, 'block', this.elements.enemyPuppet);
            }
            if (t.retaliate) {
                this.keywords.enemy.retaliate += t.retaliate;
            }
            if (t.inspire) {
                this.keywords.enemy.inspire += t.inspire;
            }
            if (t.clearDebuffs) {
                const ek = this.keywords.enemy;
                ek.poison = 0; ek.burn = 0;
                ek.stageFright = 0; ek.heckled = 0; ek.forgetful = 0; ek.vulnerable = 0;
                ek.weak = 0; ek.confused = 0;
                ek.fear = 0; ek.frustration = 0;
                this.showSpeechBubble('Debuffs Cleared!', 'buff', this.elements.enemyPuppet);
            }
            if (t.loseRetaliate) {
                this.keywords.enemy.retaliate = 0;
            }
        }

        // Casting Call passive (random debuff on all allies on phase entry)
        if (this.enemyHasPassive('casting-call')) {
            const options = ['burn', 'poison', 'vulnerable'];
            const chosen = options[Math.floor(Math.random() * options.length)];
            this.applyDebuffFromEnemy(chosen, 1, 'allAllies');
            this.showSpeechBubble('Casting Call!', 'debuff', this.elements.enemyPuppet);
        }

        enemy.currentPhase = targetPhase;
        // Reset pattern index so setNextEnemyIntent starts at 0 of new phase
        enemy.patternIndex = -1;

        this.renderStatusEffects();
    },

    // =========================================================================
    // === Enemy Actions ========================================================
    // =========================================================================

    async enemyAttack(damage, hits, options) {
        if (hits === undefined) hits = 1;
        if (!options) options = {};
        const enemy = this.combatState.enemy;
        const attackBubble = enemy.speechBubbles?.attack || 'ATTACK!';

        // Calculate base damage with enemy modifiers
        let baseDamage = damage + (this.keywords.enemy.inspire || 0);

        // Tangled Strings: +3 if any protagonist has 3+ debuff stacks
        if (this.enemyHasPassive('tangled-strings')) {
            for (const prot of ['aldric', 'pip']) {
                if (this.getProtagonistDebuffCount(prot) >= 3) {
                    baseDamage += 3;
                    break;
                }
            }
        }

        // Enemy Forgetful: 50% damage
        if (this.keywords.enemy.forgetful > 0) {
            baseDamage = Math.floor(baseDamage * 0.5);
        }

        const hasAccuracy = options.hasAccuracy || false;
        let shownBubble = false;

        for (let hit = 0; hit < hits; hit++) {
            if (this.combatState.macguffin.currentHP <= 0) break;

            // Distract check — negate this hit
            if (!hasAccuracy && this.combatState.distract > 0) {
                if (this.keywords.confused > 0 && Math.random() < 0.5) {
                    this.showSpeechBubble('Confused!', 'debuff', this.elements.macguffin);
                    await this.wait(200);
                } else {
                    this.combatState.distract--;
                    this.showSpeechBubble('Distracted!', 'buff', this.elements.macguffin);
                    this.renderStatusEffects();
                    console.log('Distract: hit negated');
                    await this.wait(300);
                    if (hit < hits - 1) await this.wait(200);
                    continue;
                }
            }

            // Attack animation
            this.elements.enemyPuppet.classList.remove('enemy-idle');
            this.elements.enemyPuppet.classList.add('enemy-attack');

            if (!shownBubble) {
                this.showAttackBubble(attackBubble, this.elements.enemyPuppet);
                shownBubble = true;
            }

            await this.wait(350);

            this.elements.enemyPuppet.classList.remove('enemy-attack');
            this.elements.enemyPuppet.classList.add('enemy-idle');

            // Resolve through damage pipeline
            await this.resolveDamageHit('macguffin', baseDamage, { hasAccuracy });

            if (hit < hits - 1) await this.wait(200);
        }
    },

    async enemyAttackAoE(damage, hits, options) {
        if (hits === undefined) hits = 1;
        if (!options) options = {};
        const enemy = this.combatState.enemy;
        const attackBubble = enemy.speechBubbles?.attack || 'ATTACK!';

        let baseDamage = damage + (this.keywords.enemy.inspire || 0);

        if (this.enemyHasPassive('tangled-strings')) {
            for (const prot of ['aldric', 'pip']) {
                if (this.getProtagonistDebuffCount(prot) >= 3) {
                    baseDamage += 3;
                    break;
                }
            }
        }

        if (this.keywords.enemy.forgetful > 0) {
            baseDamage = Math.floor(baseDamage * 0.5);
        }

        const hasAccuracy = options.hasAccuracy || false;
        let shownBubble = false;

        for (let hit = 0; hit < hits; hit++) {
            if (this.combatState.macguffin.currentHP <= 0) break;

            // Distract check — negate entire AoE wave (all targets)
            if (!hasAccuracy && this.combatState.distract > 0) {
                if (this.keywords.confused > 0 && Math.random() < 0.5) {
                    this.showSpeechBubble('Confused!', 'debuff', this.elements.macguffin);
                    await this.wait(200);
                } else {
                    this.combatState.distract--;
                    this.showSpeechBubble('Distracted!', 'buff', this.elements.macguffin);
                    this.renderStatusEffects();
                    console.log('Distract: AoE wave negated');
                    await this.wait(300);
                    if (hit < hits - 1) await this.wait(200);
                    continue;
                }
            }

            this.elements.enemyPuppet.classList.remove('enemy-idle');
            this.elements.enemyPuppet.classList.add('enemy-attack');

            if (!shownBubble) {
                this.showAttackBubble(attackBubble, this.elements.enemyPuppet);
                shownBubble = true;
            }

            await this.wait(350);

            this.elements.enemyPuppet.classList.remove('enemy-attack');
            this.elements.enemyPuppet.classList.add('enemy-idle');

            // AoE: resolve independently against each target
            await this.resolveDamageHit('macguffin', baseDamage, { hasAccuracy });
            if (!this.combatState.aldric.knockedOut) {
                await this.resolveDamageHit('aldric', baseDamage, { hasAccuracy });
            }
            if (!this.combatState.pip.knockedOut) {
                await this.resolveDamageHit('pip', baseDamage, { hasAccuracy });
            }

            if (hit < hits - 1) await this.wait(200);
        }
    },

    async enemyBlock(amount) {
        let blockGain = amount;

        // Enemy Weak: 50% reduced Block gain
        if (this.keywords.enemy.weak > 0) {
            blockGain = Math.floor(blockGain * 0.5);
        }

        this.keywords.enemy.block += blockGain;
        console.log(`Enemy gains ${blockGain} Block (total: ${this.keywords.enemy.block})`);

        const bubble = this.combatState.enemy.speechBubbles?.block || 'DEFENSE!';
        this.showCharacterBubble(bubble, this.elements.enemyPuppet);
        this.showSpeechBubble(`+${blockGain} Block`, 'block', this.elements.enemyPuppet);
        this.renderStatusEffects();
        await this.wait(500);
    },

    async enemyHeal(amount) {
        let healAmt = amount;

        // Poison suppresses healing
        if (this.keywords.enemy.poison > 0) {
            healAmt = Math.max(0, healAmt - this.keywords.enemy.poison);
        }

        if (healAmt <= 0) {
            this.showSpeechBubble('Heal suppressed!', 'debuff', this.elements.enemyPuppet);
            await this.wait(300);
            return;
        }

        const oldHP = this.combatState.enemy.currentHP;
        this.combatState.enemy.currentHP = Math.min(
            this.combatState.enemy.maxHP,
            oldHP + healAmt
        );
        const healed = this.combatState.enemy.currentHP - oldHP;

        if (healed > 0) {
            this.showHealBubble(healed, this.elements.enemyPuppet);
            this.renderEnemyHP();
        }
        await this.wait(500);
    },

    async enemyGainKeyword(keyword, value) {
        const ek = this.keywords.enemy;
        if (keyword in ek) {
            // Apply Weak to Block/Shield gains
            if ((keyword === 'block' || keyword === 'shield') && ek.weak > 0) {
                value = Math.floor(value * 0.5);
            }
            ek[keyword] += value;
            console.log(`Enemy gains ${keyword} ${value} (total: ${ek[keyword]})`);

            const bubble = this.combatState.enemy.speechBubbles?.buff || 'POWER UP!';
            this.showSpeechBubble(`${keyword} +${value}`, 'buff', this.elements.enemyPuppet);
            this.renderStatusEffects();
        }
        await this.wait(300);
    },

    // =========================================================================
    // === Damage Resolution (Enemy -> Player) =================================
    // =========================================================================

    /**
     * Resolve a single hit against a player-side target through the v2 pipeline.
     * @param {string} target - 'macguffin', 'aldric', or 'pip'
     * @param {number} rawDamage - Incoming damage before mitigation
     * @param {Object} options - { hasAccuracy: boolean }
     */
    async resolveDamageHit(target, rawDamage, options) {
        if (!options) options = {};
        let currentTarget = target;
        let currentDamage = rawDamage;
        const hasAccuracy = options.hasAccuracy || false;

        // Step 1: TAUNT — redirect MacGuffin hits to taunting protagonist
        if (currentTarget === 'macguffin' && !hasAccuracy) {
            for (const prot of ['aldric', 'pip']) {
                if (this.combatState[prot].taunt > 0 && !this.combatState[prot].knockedOut) {
                    // Confused check: 50% chance Taunt fails
                    if (this.keywords.confused > 0 && Math.random() < 0.5) {
                        this.showSpeechBubble('Confused!', 'debuff', this.getTargetElement(prot));
                        await this.wait(200);
                        break;
                    }

                    this.combatState[prot].taunt--;
                    currentTarget = prot;
                    this.showSpeechBubble('Redirected!', 'buff', this.getTargetElement(prot));
                    this.renderProtagonistDefenses(prot);
                    console.log(`Taunt: hit redirected to ${prot}`);
                    await this.wait(200);
                    break;
                }
            }
        }

        // Step 2: Apply Vulnerable on target (+50% damage)
        if (currentTarget === 'macguffin') {
            if (this.keywords.debuffs.macguffin.vulnerable > 0 && currentDamage > 0) {
                currentDamage = Math.floor(currentDamage * 1.5);
            }
        } else {
            const debuffs = this.keywords.debuffs[currentTarget];
            if (debuffs && debuffs.vulnerable > 0 && currentDamage > 0) {
                currentDamage = Math.floor(currentDamage * 1.5);
            }
        }

        // Step 3: DISTRACT — handled at the attack level (enemyAttack / enemyAttackAoE)
        // so that one Distract stack negates a full AoE wave, not just one target.

        // Step 4: SHIELD — protagonist-specific damage reduction
        if (currentTarget !== 'macguffin' && currentDamage > 0) {
            const protState = this.combatState[currentTarget];
            if (protState.shield > 0) {
                const absorbed = Math.min(currentDamage, protState.shield);
                currentDamage -= absorbed;
                protState.shield -= absorbed;
                this.showSpeechBubble(`Shield -${absorbed}`, 'block', this.getTargetElement(currentTarget));
                this.renderProtagonistDefenses(currentTarget);
                console.log(`Shield absorbed ${absorbed} on ${currentTarget}`);
            }
        }

        // Step 5: BLOCK — MacGuffin-only damage reduction
        if (currentTarget === 'macguffin' && this.combatState.block > 0 && currentDamage > 0) {
            const blocked = Math.min(currentDamage, this.combatState.block);
            currentDamage -= blocked;
            this.combatState.block -= blocked;
            this.renderMacGuffinBlock();
            this.showSpeechBubble(`Blocked ${blocked}`, 'block', this.getTargetElement(currentTarget));
            console.log(`Block absorbed ${blocked}`);
        }

        // Step 6: Apply remaining damage to target HP
        if (currentDamage > 0) {
            const targetEl = this.getTargetElement(currentTarget);

            if (currentTarget === 'macguffin') {
                this.elements.macguffin.classList.remove('macguffin-idle');
                this.elements.macguffin.classList.add('macguffin-hurt');

                this.showDamageBubble(currentDamage, targetEl);
                this.combatState.macguffin.currentHP = Math.max(0, this.combatState.macguffin.currentHP - currentDamage);
                this.renderMacGuffinHP();

                // Ovation loss on unblocked MacGuffin damage
                this.loseOvation(1);

                await this.wait(400);

                this.elements.macguffin.classList.remove('macguffin-hurt');
                this.elements.macguffin.classList.add('macguffin-idle');
            } else {
                const protState = this.combatState[currentTarget];
                const heroEl = currentTarget === 'aldric' ? this.elements.heroAldric : this.elements.heroPip;
                const idleClass = `${currentTarget}-idle`;

                heroEl.classList.remove(idleClass);
                heroEl.classList.add(`${currentTarget}-hurt`);

                this.showDamageBubble(currentDamage, targetEl);
                protState.currentHP = Math.max(0, protState.currentHP - currentDamage);
                this.renderProtagonistHP(currentTarget);

                if (protState.currentHP <= 0) {
                    protState.knockedOut = true;
                    this.renderKnockoutState(currentTarget);
                    this.showSpeechBubble('KO!', 'damage', targetEl);
                    console.log(`${currentTarget} knocked out!`);
                }

                await this.wait(400);

                heroEl.classList.remove(`${currentTarget}-hurt`);
                if (!protState.knockedOut) {
                    heroEl.classList.add(idleClass);
                }
            }
        }

        // Step 7: RETALIATE — deal damage back to enemy
        if (!hasAccuracy && this.combatState.retaliate > 0) {
            // Confused check: 50% chance Retaliate fails
            if (this.keywords.confused > 0 && Math.random() < 0.5) {
                this.showSpeechBubble('Confused!', 'debuff', this.elements.macguffin);
                await this.wait(200);
            } else {
                const retDamage = this.combatState.retaliate;
                this.showSpeechBubble(`Retaliate ${retDamage}!`, 'damage', this.elements.enemyPuppet);

                this.elements.enemyPuppet.classList.remove('enemy-idle');
                this.elements.enemyPuppet.classList.add('enemy-hurt');

                this.combatState.enemy.currentHP = Math.max(0, this.combatState.enemy.currentHP - retDamage);
                this.renderEnemyHP();
                console.log(`Retaliate dealt ${retDamage} to enemy`);

                await this.wait(300);

                this.elements.enemyPuppet.classList.remove('enemy-hurt');
                this.elements.enemyPuppet.classList.add('enemy-idle');

                if (this.combatState.enemy.currentHP <= 0) {
                    this.onEnemyDefeated();
                }
            }
        }
    },

    getTargetElement(target) {
        switch (target) {
            case 'macguffin': return this.elements.macguffin;
            case 'aldric': return this.elements.heroAldric;
            case 'pip': return this.elements.heroPip;
            default: return this.elements.macguffin;
        }
    },

    // =========================================================================
    // === Card Play ============================================================
    // =========================================================================

    canPlayCard(card) {
        if (this.phase !== 'player') return false;

        // Check knockout (protagonist cards only)
        if (card.owner !== 'macguffin') {
            const protagonistState = this.combatState[card.owner];
            if (protagonistState && protagonistState.knockedOut) return false;

            // Stage Fright: cannot play Attack cards from this protagonist
            const debuffs = this.keywords.debuffs[card.owner];
            if (debuffs) {
                if (debuffs.stageFright > 0 && card.type === 'attack') return false;
                if (debuffs.heckled > 0 && card.type !== 'attack') return false;
            }
        }

        return this.getEffectiveCardCost(card) <= this.energy.current;
    },

    getEffectiveCardCost(card) {
        let cost = card.cost - (card.costReduction || 0);
        return Math.max(0, cost);
    },

    playCard(index, target) {
        const card = this.hand[index];
        if (!this.canPlayCard(card)) return;

        console.log('Playing card:', card.name, target ? `→ ${target}` : '');

        // === Immediate state changes (synchronous) ===

        // Deduct energy
        const effectiveCost = this.getEffectiveCardCost(card);
        this.energy.current -= effectiveCost;
        this.renderEnergy();

        // Remove from hand, add to discard
        const instanceId = card.instanceId;
        this.hand.splice(index, 1);
        delete card.costReduction;
        this.discardPile.push(card);

        // Hide played card in DOM and re-index siblings
        const liveCardEl = this.elements.handCards.querySelector(
            `.game-card[data-instance-id="${instanceId}"]`
        );
        if (liveCardEl) {
            liveCardEl.style.visibility = 'hidden';
            liveCardEl.style.pointerEvents = 'none';
        }
        this._reindexHandCards();
        this._debouncedReflow();

        // === Queue effects for background processing ===
        this._queueCardEffects(card, target);
    },

    _reindexHandCards() {
        const cards = this.elements.handCards.querySelectorAll('.game-card');
        let dataIndex = 0;
        cards.forEach(el => {
            if (el.style.visibility === 'hidden') return;
            el.dataset.index = dataIndex;
            // Update playability styling
            const card = this.hand[dataIndex];
            if (card) {
                const playable = this.canPlayCard(card);
                el.classList.toggle('unplayable', !playable && !el.classList.contains('ko-unplayable'));
            }
            dataIndex++;
        });
    },

    _debouncedReflow() {
        if (this._reflowTimer) clearTimeout(this._reflowTimer);
        this._reflowTimer = setTimeout(() => {
            this._reflowTimer = null;
            this.renderHand();
        }, 600);
    },

    _queueCardEffects(card, target) {
        if (!this._effectQueue) this._effectQueue = [];
        this._effectQueue.push({ card, target });

        // If not already processing, start the queue
        if (!this._processingEffects) {
            this._processEffectQueue();
        }
    },

    async _processEffectQueue() {
        this._processingEffects = true;

        while (this._effectQueue && this._effectQueue.length > 0) {
            const { card, target } = this._effectQueue.shift();
            await this.executeCardEffects(card, target);
        }

        this._processingEffects = false;
    },

    async _waitForEffectQueue() {
        while (this._processingEffects) {
            await this.wait(50);
        }
    },

    async executeCardEffects(card, target) {
        this.keywords.cardsPlayedThisTurn++;

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
                case 'energy':
                    await this.gainEnergy(effect.value);
                    break;

                // Defensive keywords
                case 'shield':
                    await this.gainShield(effect.value, card, target);
                    break;
                case 'taunt':
                    await this.gainTaunt(effect.value, card);
                    break;
                case 'distract':
                    await this.gainDistract(effect.value, card);
                    break;
                case 'retaliate':
                    await this.gainRetaliate(effect.value, card);
                    break;

                // Positive keywords
                case 'inspire':
                    await this.gainInspire(effect.value, card);
                    break;
                case 'piercing':
                    this.keywords.piercing += effect.value;
                    this.showSpeechBubble(`Piercing +${effect.value}`, 'buff', this.elements.macguffin);
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;
                case 'accuracy':
                    this.keywords.accuracy += effect.value;
                    this.showSpeechBubble(`Accuracy +${effect.value}`, 'buff', this.elements.macguffin);
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;
                case 'luck':
                    this.keywords.luck += effect.value;
                    this.showSpeechBubble(`Luck +${effect.value}`, 'buff', this.elements.macguffin);
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;
                case 'ward':
                    this.keywords.ward += effect.value;
                    this.showSpeechBubble(`Ward +${effect.value}`, 'buff', this.elements.macguffin);
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;
                case 'fortify':
                    this.keywords.fortify += effect.value;
                    this.showSpeechBubble(`Fortify +${effect.value}`, 'buff', this.elements.macguffin);
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;
                case 'flourish':
                    this.keywords.flourish += effect.value;
                    this.showSpeechBubble(`Flourish!`, 'buff', this.elements.macguffin);
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;
                case 'regenerate':
                    if (card.owner !== 'macguffin') {
                        this.keywords[card.owner].regenerate += effect.value;
                        const heroEl = this.getTargetElement(card.owner);
                        this.showSpeechBubble(`Regen +${effect.value}`, 'heal', heroEl);
                    }
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;

                // Inflict debuff on enemy
                case 'inflict':
                    await this.inflictDebuffOnEnemy(effect.keyword, effect.value, card);
                    break;

                // Self-inflict debuff on card owner protagonist
                case 'selfInflict':
                    if (card.owner !== 'macguffin') {
                        this.applyDebuffToProtagonist(card.owner, effect.keyword, effect.value);
                        const heroEl = this.getTargetElement(card.owner);
                        this.showSpeechBubble(`${effect.keyword} +${effect.value}`, 'debuff', heroEl);
                        this.renderStatusEffects();
                    }
                    await this.wait(200);
                    break;

                // Heal protagonists (Galvanize)
                case 'healProtagonists':
                    await this.healProtagonists(effect.value, card);
                    break;

                // Reduce cost of card type in hand (Bulwark)
                case 'reduceCostType':
                    this.hand.forEach(c => {
                        if (c.type === effect.cardType && c !== card) {
                            c.costReduction = (c.costReduction || 0) + effect.amount;
                        }
                    });
                    this.showSpeechBubble(`${effect.cardType} -${effect.amount} cost`, 'buff', this.elements.macguffin);
                    this.renderHand();
                    await this.wait(200);
                    break;

                // Reduce cost of random card in hand (Create Opportunity)
                case 'reduceCostRandom': {
                    const eligible = this.hand.filter(c =>
                        c !== card && this.getEffectiveCardCost(c) > 0
                    );
                    if (eligible.length > 0) {
                        const target = eligible[Math.floor(Math.random() * eligible.length)];
                        target.costReduction = (target.costReduction || 0) + effect.amount;
                        this.showSpeechBubble(`${target.name} -${effect.amount}`, 'buff', this.elements.macguffin);
                        this.renderHand();
                    }
                    await this.wait(200);
                    break;
                }

                // Gain keyword equal to Ovation (Protective Stance)
                case 'fromOvation': {
                    const ov = this.keywords.ovation;
                    if (ov > 0) {
                        if (effect.keyword === 'taunt') {
                            await this.gainTaunt(ov, card);
                        } else if (effect.keyword === 'shield') {
                            await this.gainShield(ov, card);
                        } else if (effect.keyword === 'luck') {
                            this.keywords.luck += ov;
                            this.showSpeechBubble(`Luck +${ov}`, 'buff', this.elements.macguffin);
                            this.renderStatusEffects();
                            await this.wait(200);
                        }
                    }
                    break;
                }

                // Convert Ovation to keyword (Inspirational Shout, Good Fortune)
                case 'convertOvation': {
                    const ov = this.keywords.ovation;
                    if (ov > 0) {
                        if (effect.to === 'inspire') {
                            this.keywords.inspire += ov;
                            this.showSpeechBubble(`Inspire +${ov}`, 'buff', this.elements.macguffin);
                        } else if (effect.to === 'luck') {
                            this.keywords.luck += ov;
                            this.showSpeechBubble(`Luck +${ov}`, 'buff', this.elements.macguffin);
                        }
                        this.keywords.ovation = 0;
                        this.renderStatusEffects();
                        this.renderOvationMeter();
                    }
                    await this.wait(200);
                    break;
                }

                // Damage from Ovation (Coup de Grace)
                case 'damageFromOvation': {
                    const totalDmg = effect.base + (this.keywords.ovation * effect.multiplier);
                    await this.dealDamageToEnemy(totalDmg, card);
                    break;
                }

                // Damage per enemy debuff count (Quick Jab)
                case 'damagePerDebuff': {
                    const debuffCount = this.getEnemyDebuffCount();
                    const totalDmg = effect.base + (debuffCount * effect.perDebuff);
                    await this.dealDamageToEnemy(totalDmg, card);
                    break;
                }

                // Inflict debuff equal to Ovation (Ultimate Jeer)
                case 'inflictFromOvation': {
                    const ov = this.keywords.ovation;
                    if (ov > 0) {
                        await this.inflictDebuffOnEnemy(effect.keyword, ov, card);
                    }
                    break;
                }

                // Lose all Ovation (Stylish Dance)
                case 'loseAllOvation':
                    this.keywords.ovation = 0;
                    this.renderStatusEffects();
                    this.renderOvationMeter();
                    await this.wait(100);
                    break;

                // Cleanse Burn and Poison from a specific ally or all protagonists
                case 'cleanseBurnPoison': {
                    const targets = target ? [target] : ['aldric', 'pip'];
                    for (const prot of targets) {
                        if (prot === 'macguffin') {
                            // MacGuffin doesn't have debuffs in the current system
                            this.showSpeechBubble('Cleansed!', 'heal', this.getTargetElement(prot));
                            continue;
                        }
                        const d = this.keywords.debuffs[prot];
                        if (d && (d.burn > 0 || d.poison > 0)) {
                            d.burn = 0;
                            d.poison = 0;
                            this.showSpeechBubble('Cleansed!', 'heal', this.getTargetElement(prot));
                        }
                    }
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;
                }
            }
        }
    },

    // =========================================================================
    // === Player -> Enemy Damage ==============================================
    // =========================================================================

    async dealDamageToEnemy(baseDamage, card) {
        let finalDamage = baseDamage;

        // Inspire bonus
        finalDamage += this.keywords.inspire;

        // Ovation damage bonus
        finalDamage += this.getOvationDamageBonus();

        // Protagonist Forgetful: 50% damage reduction
        if (card.owner !== 'macguffin') {
            const debuffs = this.keywords.debuffs[card.owner];
            if (debuffs && debuffs.forgetful > 0) {
                finalDamage = Math.floor(finalDamage * 0.5);
            }
        }

        // Luck: 10% per stack for 1.5x
        if (this.keywords.luck > 0) {
            const luckChance = this.keywords.luck * 0.1;
            if (Math.random() < luckChance) {
                finalDamage = Math.floor(finalDamage * 1.5);
                this.showSpeechBubble('Lucky!', 'buff', this.elements.macguffin);
                console.log('Luck proc!');
            }
        }

        // Enemy Vulnerable: +50% damage taken
        if (this.keywords.enemy.vulnerable > 0) {
            finalDamage = Math.floor(finalDamage * 1.5);
        }

        // Two Faces (Comedy): 50% reduced damage in comedy state
        if (this.enemyHasPassive('two-faces')) {
            const state = this.combatState.enemy.passiveState.currentState;
            if (state === 'comedy') {
                finalDamage = Math.floor(finalDamage * 0.5);
            }
        }

        // Ensure non-negative
        finalDamage = Math.max(0, finalDamage);

        // Piercing: bypass enemy Block and Shield
        const hasPiercing = this.keywords.piercing > 0;

        if (!hasPiercing) {
            // Enemy Shield absorbs first
            if (this.keywords.enemy.shield > 0 && finalDamage > 0) {
                const absorbed = Math.min(finalDamage, this.keywords.enemy.shield);
                finalDamage -= absorbed;
                this.keywords.enemy.shield -= absorbed;
                this.showSpeechBubble(`Shield -${absorbed}`, 'block', this.elements.enemyPuppet);
            }

            // Enemy Block absorbs next
            if (this.keywords.enemy.block > 0 && finalDamage > 0) {
                const absorbed = Math.min(finalDamage, this.keywords.enemy.block);
                finalDamage -= absorbed;
                this.keywords.enemy.block -= absorbed;
                this.showSpeechBubble(`Block -${absorbed}`, 'block', this.elements.enemyPuppet);
            }
        }

        console.log(`Dealing ${finalDamage} damage to enemy`);

        // Trigger hero attack animation
        const heroEl = card.owner === 'aldric' ? this.elements.heroAldric
            : card.owner === 'pip' ? this.elements.heroPip
            : null;

        if (heroEl) {
            const idleClass = `${card.owner}-idle`;
            const attackClass = `${card.owner}-attack`;
            heroEl.classList.remove(idleClass);
            heroEl.classList.add(attackClass);

            if (card.speechBubble) {
                this.showAttackBubble(card.speechBubble, heroEl);
            }

            await this.wait(350);

            heroEl.classList.remove(attackClass);
            heroEl.classList.add(idleClass);
        }

        // Enemy hurt animation + damage
        this.elements.enemyPuppet.classList.remove('enemy-idle');
        this.elements.enemyPuppet.classList.add('enemy-hurt');

        if (finalDamage > 0) {
            this.showDamageBubble(finalDamage, this.elements.enemyPuppet);
        }

        this.combatState.enemy.currentHP = Math.max(0, this.combatState.enemy.currentHP - finalDamage);
        this.renderEnemyHP();

        await this.wait(300);

        this.elements.enemyPuppet.classList.remove('enemy-hurt');
        this.elements.enemyPuppet.classList.add('enemy-idle');

        // Gain Ovation: +1 per hit dealt
        if (finalDamage > 0) {
            this.gainOvation(1);
        }

        // Captivating: +1 Ovation per damage dealt (in addition to base +1)
        if (card.captivating && finalDamage > 0) {
            // The base +1 already happened above; captivating adds per-point
            // Total = 1 (base) + finalDamage (captivating) - 1 (avoid double counting base)
            this.gainOvation(finalDamage - 1);
        }

        // Mirror Spite passive: inflicts 1 Burn on attacking protagonist
        if (this.enemyHasPassive('mirror-spite') && card.owner !== 'macguffin') {
            this.applyDebuffToProtagonist(card.owner, 'burn', 1);
            this.showSpeechBubble('Mirror Spite!', 'debuff', this.getTargetElement(card.owner));
            this.renderStatusEffects();
        }

        // Scathing Pen passive: heal 3 when enemy attacks deal damage? No — "heals 3 when inflicting a debuff"
        // (Handled in applyDebuffFromEnemy)

        // Enemy Retaliate: deal damage back to attacker
        if (this.keywords.enemy.retaliate > 0 && this.keywords.accuracy <= 0) {
            const retDmg = this.keywords.enemy.retaliate;

            // Enemy Confused: 50% chance Retaliate fails
            if (this.keywords.enemy.confused > 0 && Math.random() < 0.5) {
                this.showSpeechBubble('Confused!', 'debuff', this.elements.enemyPuppet);
            } else if (card.owner !== 'macguffin') {
                const protState = this.combatState[card.owner];
                if (!protState.knockedOut) {
                    protState.currentHP = Math.max(0, protState.currentHP - retDmg);
                    this.showDamageBubble(retDmg, this.getTargetElement(card.owner));
                    this.renderProtagonistHP(card.owner);
                    this.showSpeechBubble(`Retaliate ${retDmg}!`, 'damage', this.elements.enemyPuppet);
                    if (protState.currentHP <= 0) {
                        protState.knockedOut = true;
                        this.renderKnockoutState(card.owner);
                    }
                }
            }
        }

        // Understudy's Resilience: gains Regenerate 2 on first drop below 50%
        if (this.enemyHasPassive('understudys-resilience') &&
            !this.combatState.enemy.passiveState.resilienceTriggered) {
            const enemy = this.combatState.enemy;
            if (enemy.currentHP / enemy.maxHP <= 0.5) {
                this.keywords.enemy.regenerate += 2;
                this.combatState.enemy.passiveState.resilienceTriggered = true;
                this.showSpeechBubble('Regenerate!', 'buff', this.elements.enemyPuppet);
                this.renderStatusEffects();
            }
        }

        // Check defeat
        if (this.combatState.enemy.currentHP <= 0) {
            this.onEnemyDefeated();
        }

        this.renderStatusEffects();
    },

    // =========================================================================
    // === Keyword Gain Methods ================================================
    // =========================================================================

    async gainBlock(amount, sourceCard) {
        let finalBlock = amount;

        // Fortify bonus
        if (this.keywords.fortify > 0) {
            finalBlock += this.keywords.fortify;
        }

        // Weak: 50% reduced Block gain
        if (this.keywords.weak > 0) {
            finalBlock = Math.floor(finalBlock * 0.5);
        }

        finalBlock = Math.max(0, finalBlock);
        console.log(`Gaining ${finalBlock} Block`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        this.showBlockBubble(finalBlock, this.elements.macguffin);
        this.combatState.block += finalBlock;
        this.renderMacGuffinBlock();

        await this.wait(200);
    },

    async gainShield(amount, sourceCard, target) {
        const protagonist = target || sourceCard?.owner;
        if (!protagonist || !this.combatState[protagonist] || protagonist === 'macguffin') return;

        let finalShield = amount;

        // Weak: 50% reduced Shield gain
        if (this.keywords.weak > 0) {
            finalShield = Math.floor(finalShield * 0.5);
        }

        finalShield = Math.max(0, finalShield);
        console.log(`${protagonist} gaining ${finalShield} Shield`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.getTargetElement(protagonist));
        }

        this.combatState[protagonist].shield += finalShield;
        this.showSpeechBubble(`Shield +${finalShield}`, 'block', this.getTargetElement(protagonist));
        this.renderProtagonistDefenses(protagonist);

        await this.wait(200);
    },

    async gainTaunt(amount, sourceCard) {
        const protagonist = sourceCard?.owner;
        if (!protagonist || !this.combatState[protagonist] || protagonist === 'macguffin') return;

        console.log(`${protagonist} gaining ${amount} Taunt`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.getTargetElement(protagonist));
        }

        this.combatState[protagonist].taunt += amount;
        this.showSpeechBubble(`Taunt +${amount}`, 'buff', this.getTargetElement(protagonist));
        this.renderProtagonistDefenses(protagonist);

        await this.wait(200);
    },

    async gainDistract(amount, sourceCard) {
        console.log(`Gaining ${amount} Distract`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        this.combatState.distract += amount;
        this.showSpeechBubble(`Distract +${amount}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();

        await this.wait(200);
    },

    async gainRetaliate(amount, sourceCard) {
        console.log(`Gaining ${amount} Retaliate`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        this.combatState.retaliate += amount;
        this.showSpeechBubble(`Retaliate +${amount}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();

        await this.wait(200);
    },

    async gainInspire(amount, sourceCard) {
        console.log(`Gaining ${amount} Inspire`);

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        this.keywords.inspire += amount;
        this.showSpeechBubble(`Inspire +${amount}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();

        await this.wait(200);
    },

    async gainEnergy(amount) {
        this.energy.current = Math.min(this.energy.max + amount, this.energy.current + amount);
        this.renderEnergy();
        await this.wait(100);
    },

    async drawCards(count) {
        console.log(`Drawing ${count} card(s)`);
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            if (card) {
                this.hand.push(card);

                // Stoic Resistance: blockOnDraw
                if (card.blockOnDraw && this.keywords.ovation > 0) {
                    let bonus = this.keywords.ovation;
                    if (this.keywords.weak > 0) bonus = Math.floor(bonus * 0.5);
                    if (this.keywords.fortify > 0) bonus += this.keywords.fortify;
                    this.combatState.block += bonus;
                    this.showSpeechBubble(`+${bonus} Block`, 'block', this.elements.macguffin);
                    this.renderMacGuffinBlock();
                }
            }
        }
        this.renderHand();
        await this.wait(200);
    },

    async healProtagonists(amount, sourceCard) {
        for (const prot of ['aldric', 'pip']) {
            const state = this.combatState[prot];
            if (state.knockedOut) continue;

            let healAmt = amount;

            // Poison suppresses healing
            const poison = this.keywords.debuffs[prot].poison;
            if (poison > 0) {
                healAmt = Math.max(0, healAmt - poison);
            }

            if (healAmt <= 0) continue;

            const oldHP = state.currentHP;
            state.currentHP = Math.min(state.maxHP, state.currentHP + healAmt);
            const healed = state.currentHP - oldHP;

            if (healed > 0) {
                this.showHealBubble(healed, this.getTargetElement(prot));
                this.renderProtagonistHP(prot);
            }
        }

        if (sourceCard?.speechBubble) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }
        await this.wait(200);
    },

    // =========================================================================
    // === Debuff Application ==================================================
    // =========================================================================

    /**
     * Apply a debuff to a protagonist. Checks Ward first.
     */
    applyDebuffToProtagonist(protagonist, keyword, value) {
        // Ward negates one debuff application
        if (this.keywords.ward > 0) {
            this.keywords.ward--;
            this.showSpeechBubble('Ward!', 'buff', this.getTargetElement(protagonist));
            this.renderStatusEffects();
            return;
        }

        if (protagonist === 'macguffin') {
            if (keyword === 'vulnerable') {
                this.keywords.debuffs.macguffin.vulnerable += value;
            } else if (keyword === 'curse') {
                this.keywords.curse += value;
            }
            return;
        }

        const debuffs = this.keywords.debuffs[protagonist];
        if (!debuffs || !(keyword in debuffs)) return;

        debuffs[keyword] += value;

        // Check Fear/Frustration conversion
        if (keyword === 'fear' || keyword === 'frustration') {
            this.checkFearFrustration(protagonist);
        }
    },

    /**
     * Enemy inflicts a debuff on player side.
     * Resolves target, applies Ward, handles Scathing Pen.
     */
    async applyDebuffFromEnemy(keyword, value, target) {
        // Global debuffs (weak, confused, curse) don't have per-protagonist targets
        if (keyword === 'weak' || keyword === 'confused') {
            if (this.keywords.ward > 0) {
                this.keywords.ward--;
                this.showSpeechBubble('Ward!', 'buff', this.elements.macguffin);
                this.renderStatusEffects();
                return;
            }
            this.keywords[keyword] += value;
            this.showSpeechBubble(`${keyword} +${value}`, 'debuff', this.elements.macguffin);
            this.renderStatusEffects();

            // Scathing Pen: heal 3 HP when inflicting a debuff
            if (this.enemyHasPassive('scathing-pen')) {
                await this.enemyHeal(3);
            }
            await this.wait(300);
            return;
        }

        if (keyword === 'curse') {
            if (this.keywords.ward > 0) {
                this.keywords.ward--;
                this.showSpeechBubble('Ward!', 'buff', this.elements.macguffin);
                this.renderStatusEffects();
                return;
            }
            this.keywords.curse += value;
            this.showSpeechBubble(`Curse ${value}!`, 'debuff', this.elements.macguffin);
            this.renderStatusEffects();

            if (this.enemyHasPassive('scathing-pen')) {
                await this.enemyHeal(3);
            }
            await this.wait(300);
            return;
        }

        // Per-protagonist debuffs
        const targets = this.resolveInflictTarget(target);
        let debuffApplied = false;

        for (const prot of targets) {
            this.applyDebuffToProtagonist(prot, keyword, value);
            const el = this.getTargetElement(prot);
            this.showSpeechBubble(`${keyword} +${value}`, 'debuff', el);
            debuffApplied = true;
        }

        this.renderStatusEffects();
        this.renderHand(); // Update card playability

        // Scathing Pen: heal 3 HP when inflicting a debuff
        if (debuffApplied && this.enemyHasPassive('scathing-pen')) {
            await this.enemyHeal(3);
        }

        await this.wait(300);
    },

    /**
     * Player inflicts a debuff on the enemy.
     */
    async inflictDebuffOnEnemy(keyword, value, sourceCard) {
        const ek = this.keywords.enemy;

        // Two Faces (Tragedy): immune to debuffs
        if (this.enemyHasPassive('two-faces')) {
            const state = this.combatState.enemy.passiveState.currentState;
            if (state === 'tragedy') {
                this.showSpeechBubble('Immune!', 'buff', this.elements.enemyPuppet);
                await this.wait(300);
                return;
            }
        }

        // Iron Curtain: immune to Forgetful and Vulnerable
        if (this.enemyHasPassive('iron-curtain')) {
            if (keyword === 'forgetful' || keyword === 'vulnerable') {
                this.showSpeechBubble('Immune!', 'buff', this.elements.enemyPuppet);
                await this.wait(300);
                return;
            }
        }

        // Erratic: immune to Fear and Frustration
        if (this.enemyHasPassive('erratic')) {
            if (keyword === 'fear' || keyword === 'frustration') {
                this.showSpeechBubble('Immune!', 'buff', this.elements.enemyPuppet);
                await this.wait(300);
                return;
            }
        }

        if (keyword in ek) {
            ek[keyword] += value;
            console.log(`Inflicted ${keyword} ${value} on enemy (total: ${ek[keyword]})`);

            const heroEl = sourceCard?.owner ? this.getTargetElement(sourceCard.owner) : this.elements.macguffin;
            if (sourceCard?.speechBubble) {
                this.showAttackBubble(sourceCard.speechBubble, heroEl);
            }
            this.showSpeechBubble(`${keyword} +${value}`, 'debuff', this.elements.enemyPuppet);

            // Check Fear/Frustration conversion on enemy
            if (keyword === 'fear' || keyword === 'frustration') {
                this.checkEnemyFearFrustration();
            }
        }

        this.renderStatusEffects();
        await this.wait(200);
    },

    /**
     * Check if protagonist Fear >= 5 or Frustration >= 5 and convert.
     */
    checkFearFrustration(protagonist) {
        const debuffs = this.keywords.debuffs[protagonist];
        if (!debuffs) return;

        if (debuffs.fear >= 5) {
            debuffs.fear = 0;
            debuffs.stageFright += 1;
            this.showSpeechBubble('Stage Fright!', 'debuff', this.getTargetElement(protagonist));
            console.log(`${protagonist} Fear -> Stage Fright`);
        }

        if (debuffs.frustration >= 5) {
            debuffs.frustration = 0;
            debuffs.heckled += 1;
            this.showSpeechBubble('Heckled!', 'debuff', this.getTargetElement(protagonist));
            console.log(`${protagonist} Frustration -> Heckled`);
        }
    },

    /**
     * Check enemy Fear/Frustration conversion.
     */
    checkEnemyFearFrustration() {
        const ek = this.keywords.enemy;

        if (ek.fear >= 5) {
            ek.fear = 0;
            ek.stageFright += 1;
            this.showSpeechBubble('Stage Fright!', 'debuff', this.elements.enemyPuppet);
            console.log('Enemy Fear -> Stage Fright');
        }

        if (ek.frustration >= 5) {
            ek.frustration = 0;
            ek.heckled += 1;
            this.showSpeechBubble('Heckled!', 'debuff', this.elements.enemyPuppet);
            console.log('Enemy Frustration -> Heckled');
        }
    },

    /**
     * Resolve an inflict target string to an array of protagonist names.
     */
    resolveInflictTarget(target) {
        switch (target) {
            case 'randomProtagonist': {
                const alive = [];
                if (!this.combatState.aldric.knockedOut) alive.push('aldric');
                if (!this.combatState.pip.knockedOut) alive.push('pip');
                if (alive.length === 0) return [];
                return [alive[Math.floor(Math.random() * alive.length)]];
            }
            case 'allAllies':
            case 'bothProtagonists': {
                const targets = [];
                if (!this.combatState.aldric.knockedOut) targets.push('aldric');
                if (!this.combatState.pip.knockedOut) targets.push('pip');
                return targets;
            }
            case 'protagonistA':
                return ['aldric'];
            case 'protagonistB':
                return ['pip'];
            case 'macguffin':
                return ['macguffin'];
            default:
                // If no target specified, random protagonist
                return this.resolveInflictTarget('randomProtagonist');
        }
    },

    // =========================================================================
    // === Ovation =============================================================
    // =========================================================================

    gainOvation(amount) {
        if (this.keywords.flourish > 0) amount *= 2;
        this.keywords.ovation = Math.min(5, this.keywords.ovation + amount);
        this.renderStatusEffects();
        this.renderOvationMeter();
    },

    loseOvation(amount) {
        if (this.keywords.flourish > 0) amount *= 2;
        this.keywords.ovation = Math.max(0, this.keywords.ovation - amount);
        this.renderStatusEffects();
        this.renderOvationMeter();
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
    // === Enemy Passive Processing ============================================
    // =========================================================================

    processEnemyTurnStartPassives() {
        // Curtain Rigging (Stagehand): +1 Inspire each turn
        if (this.enemyHasPassive('curtain-rigging')) {
            this.keywords.enemy.inspire += 1;
            this.showSpeechBubble('Inspire +1', 'buff', this.elements.enemyPuppet);
        }

        // Dramatic Ego (Prima Donna): +1 Inspire each turn (Retaliate 2 is permanent, set on combat start)
        if (this.enemyHasPassive('dramatic-ego')) {
            this.keywords.enemy.inspire += 1;
            this.showSpeechBubble('Inspire +1', 'buff', this.elements.enemyPuppet);
        }
    },

    // =========================================================================
    // === Victory / Defeat ====================================================
    // =========================================================================

    onEnemyDefeated() {
        this.phase = 'reward';
        const enemy = this.combatState.enemy;
        console.log(`${enemy.name} defeated!`);

        this.elements.enemyPuppet.classList.remove('enemy-idle', 'enemy-hurt');
        this.elements.enemyPuppet.classList.add('enemy-defeat');

        if (enemy.speechBubbles?.defeated) {
            this.showCharacterBubble(enemy.speechBubbles.defeated, this.elements.enemyPuppet);
        }

        setTimeout(() => {
            this.showCharacterBubble('WE DID IT!', this.elements.heroAldric);
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

        this.showCharacterBubble('NOOO!', this.elements.macguffin);

        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = 'Defeated';
        }
    }
});
