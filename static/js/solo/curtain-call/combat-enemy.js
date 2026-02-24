/**
 * Curtain Call — Enemy AI & Damage Pipeline
 *
 * Enemy pattern resolution, turn execution, boss phase transitions,
 * enemy actions (attack, AoE, block, heal, gain keyword),
 * damage resolution (enemy -> player), and combat-start passives.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

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

        // Track first attack / first AoE for guaranteed enemy speech
        if (!this.combatState.enemy._firstAttackFired) {
            this.combatState.enemy._firstAttackFired = false;
        }
        if (!this.combatState.enemy._firstAoEFired) {
            this.combatState.enemy._firstAoEFired = false;
        }

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

        // Boss phase transition voice line
        this.showBossPhaseTransition(enemy.id);

        this.renderStatusEffects();
    },

    // =========================================================================
    // === Enemy Actions ========================================================
    // =========================================================================

    async enemyAttack(damage, hits, options) {
        if (hits === undefined) hits = 1;
        if (!options) options = {};
        const enemy = this.combatState.enemy;

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
                    // Protagonist speech for distract negation
                    this.tryProtagonistSpeech('pip', 'distractNegates');
                    this.renderStatusEffects();
                    console.log('Distract: hit negated');
                    await this.wait(300);
                    if (hit < hits - 1) await this.wait(200);
                    continue;
                }
            }

            // First-attack guaranteed enemy speech (fires once per fight)
            if (!shownBubble) {
                if (!enemy._firstAttackFired) {
                    enemy._firstAttackFired = true;
                    this.tryEnemySpeech(enemy.id, 'firstAttack', { guaranteed: true, once: true });
                } else {
                    // Fallback to legacy attack bubble
                    const attackBubble = this.getEnemyLine(enemy.id, 'attack') || enemy.speechBubbles?.attack || 'ATTACK!';
                    this.showAttackBubble(attackBubble, this.elements.enemyPuppet);
                }
                shownBubble = true;
            }

            // Attack animation
            await this.playAnimation(this.elements.enemyPuppet, ANIMATION_CONFIG.attack.enemy);

            // Resolve through damage pipeline
            await this.resolveDamageHit('macguffin', baseDamage, { hasAccuracy });

            if (hit < hits - 1) await this.wait(200);
        }
    },

    async enemyAttackAoE(damage, hits, options) {
        if (hits === undefined) hits = 1;
        if (!options) options = {};
        const enemy = this.combatState.enemy;

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
                    // Protagonist speech for distract negation
                    this.tryProtagonistSpeech('pip', 'distractNegates');
                    this.renderStatusEffects();
                    console.log('Distract: AoE wave negated');
                    await this.wait(300);
                    if (hit < hits - 1) await this.wait(200);
                    continue;
                }
            }

            // First-AoE guaranteed enemy speech (fires once per fight)
            if (!shownBubble) {
                if (!enemy._firstAoEFired) {
                    enemy._firstAoEFired = true;
                    this.tryEnemySpeech(enemy.id, 'firstAoE', { guaranteed: true, once: true });
                } else {
                    const attackBubble = this.getEnemyLine(enemy.id, 'attack') || enemy.speechBubbles?.attack || 'ATTACK!';
                    this.showAttackBubble(attackBubble, this.elements.enemyPuppet);
                }
                shownBubble = true;
            }

            // AoE sweep animation
            await this.playAnimation(this.elements.enemyPuppet, ANIMATION_CONFIG.attack.enemyAoE);

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

        // Try contextual enemy speech for gaining Block
        if (!this.tryEnemySpeech(this.combatState.enemy.id, 'gainsBlock')) {
            const bubble = this.combatState.enemy.speechBubbles?.block || 'DEFENSE!';
            this.showCharacterBubble(bubble, this.elements.enemyPuppet);
        }
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
            // Try contextual enemy speech for healing
            this.tryEnemySpeech(this.combatState.enemy.id, 'heals');
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
                this.triggerAbsorbAnimation(this.getTargetElement(currentTarget), 'shield');
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
            this.triggerAbsorbAnimation(this.elements.macguffin, 'block');
            this.renderMacGuffinBlock();
            this.showSpeechBubble(`Blocked ${blocked}`, 'block', this.getTargetElement(currentTarget));

            // Full block: protagonist speech + crowd reaction
            if (currentDamage === 0) {
                const blocker = !this.combatState.aldric.knockedOut ? 'aldric' : 'pip';
                this.tryProtagonistSpeech(blocker, 'fullyBlocks');
                this.tryCrowdReaction('fullBlock');
            } else {
                this.tryCrowdReaction('fullBlock');
            }
            console.log(`Block absorbed ${blocked}`);
        }

        // Step 6: Apply remaining damage to target HP
        if (currentDamage > 0) {
            const targetEl = this.getTargetElement(currentTarget);

            if (currentTarget === 'macguffin') {
                this.showDamageBubble(currentDamage, targetEl);
                this.combatState.macguffin.currentHP = Math.max(0, this.combatState.macguffin.currentHP - currentDamage);
                this.renderMacGuffinHP();

                // Ovation loss on unblocked MacGuffin damage
                this.loseOvation(1);

                // MacGuffin big damage crowd reaction
                if (currentDamage >= (ANIMATION_CONFIG?.hit?.bigHitThreshold || 8)) {
                    this.tryCrowdReaction('macguffinBigDamage');
                }

                await this.playAnimation(this.elements.macguffin, ANIMATION_CONFIG.hurt.macguffin);

                // Toggle low-HP wobble animation
                const hpRatio = this.combatState.macguffin.currentHP / this.combatState.macguffin.maxHP;
                if (hpRatio <= (ANIMATION_CONFIG?.macguffinLowHp?.threshold || 0.3) && hpRatio > 0) {
                    this.elements.macguffin.classList.add('macguffin-low-hp');
                } else {
                    this.elements.macguffin.classList.remove('macguffin-low-hp');
                }
            } else {
                const protState = this.combatState[currentTarget];
                const heroEl = currentTarget === 'aldric' ? this.elements.heroAldric : this.elements.heroPip;
                const prevHP = protState.currentHP;

                this.showDamageBubble(currentDamage, targetEl);
                protState.currentHP = Math.max(0, protState.currentHP - currentDamage);
                this.renderProtagonistHP(currentTarget);

                if (protState.currentHP <= 0) {
                    protState.knockedOut = true;
                    this.renderKnockoutState(currentTarget);
                    // Guaranteed cross-reaction: partner reacts to knockout
                    this.tryProtagonistSpeech(currentTarget, 'partnerKnockout');
                    this.tryCrowdReaction('protagonistKO');
                    console.log(`${currentTarget} knocked out!`);
                } else {
                    // Check if dropped below 50% HP this hit
                    const halfHP = protState.maxHP * 0.5;
                    if (prevHP > halfHP && protState.currentHP <= halfHP) {
                        this.tryProtagonistSpeech(currentTarget, 'dropsBelowHalf');
                    }
                }

                await this.playAnimation(heroEl, ANIMATION_CONFIG.hurt[currentTarget]);
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

                this.combatState.enemy.currentHP = Math.max(0, this.combatState.enemy.currentHP - retDamage);
                this.renderEnemyHP();
                console.log(`Retaliate dealt ${retDamage} to enemy`);

                await this.playAnimation(this.elements.enemyPuppet, ANIMATION_CONFIG.hurt.enemy);

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

    /**
     * Trigger a brief absorb flash animation on an element.
     * @param {HTMLElement} el - Target element
     * @param {'block'|'shield'} type - Which absorb animation
     */
    triggerAbsorbAnimation(el, type) {
        if (!el) return;
        const cls = type === 'shield' ? 'shield-absorb' : 'block-absorb';
        el.classList.remove(cls);
        // Force reflow to restart animation
        void el.offsetWidth;
        el.classList.add(cls);
        setTimeout(() => el.classList.remove(cls), 350);
    },

    // =========================================================================
    // === Combat Start Passives ===============================================
    // =========================================================================

    applyCombatStartPassives(enemy) {
        if (!enemy.passives) return;

        for (const passive of enemy.passives) {
            switch (passive.id) {
                case 'rusty-armor':
                    // Rusty Knight: starts with 3 Block
                    this.keywords.enemy.block = 3;
                    break;
                case 'dramatic-ego':
                    // Prima Donna: permanent Retaliate 2
                    this.keywords.enemy.retaliate = 2;
                    break;
                // Other passives are triggered during combat, not at start
            }
        }
    }
});
