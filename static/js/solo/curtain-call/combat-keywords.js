/**
 * Curtain Call — Keywords, Debuffs & Player->Enemy Damage
 *
 * Player damage pipeline (dealDamageToEnemy), keyword gain methods
 * (block, shield, taunt, distract, retaliate, inspire, energy, draw, heal),
 * debuff application (protagonist and enemy), Fear/Frustration conversion,
 * and inflict target resolution.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // =========================================================================
    // === Player -> Enemy Damage ==============================================
    // =========================================================================

    async dealDamageToEnemy(baseDamage, card) {
        let finalDamage = baseDamage;

        // Card-specific damage bonus (e.g. from Cooperative Strike)
        if (card.damageBonus) finalDamage += card.damageBonus;

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

        // Allow passives to modify damage (e.g. two-faces comedy state)
        const damageCtx = { damage: finalDamage, card };
        await this.events.emit('beforeDamageDealt', damageCtx);
        finalDamage = damageCtx.damage;

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
                this.triggerAbsorbAnimation(this.elements.enemyPuppet, 'shield');
                this.showSpeechBubble(`Shield -${absorbed}`, 'block', this.elements.enemyPuppet);
            }

            // Enemy Block absorbs next
            if (this.keywords.enemy.block > 0 && finalDamage > 0) {
                const absorbed = Math.min(finalDamage, this.keywords.enemy.block);
                finalDamage -= absorbed;
                this.keywords.enemy.block -= absorbed;
                this.triggerAbsorbAnimation(this.elements.enemyPuppet, 'block');
                this.showSpeechBubble(`Block -${absorbed}`, 'block', this.elements.enemyPuppet);
            }
        }

        console.log(`Dealing ${finalDamage} damage to enemy`);

        // Trigger hero attack animation
        const heroEl = card.owner === 'aldric' ? this.elements.heroAldric
            : card.owner === 'pip' ? this.elements.heroPip
            : null;

        if (heroEl) {
            if (card.speechBubble && Math.random() < 0.3) {
                this.showAttackBubble(card.speechBubble, heroEl);
            } else if (finalDamage >= 10) {
                this.tryProtagonistSpeech(card.owner, 'dealBigDamage');
            }

            // Pick attack animation variant: big hit > 40% alt > default
            const attacks = ANIMATION_CONFIG.attack;
            const owner = card.owner;
            let attackAnim;
            if (finalDamage >= ANIMATION_CONFIG.hit.bigHitThreshold) {
                attackAnim = attacks[owner + 'BigHit'] || attacks[owner];
            } else if (Math.random() < 0.4 && attacks[owner + 'Alt']) {
                attackAnim = attacks[owner + 'Alt'];
            } else {
                attackAnim = attacks[owner];
            }
            await this.playAnimation(heroEl, attackAnim);
        }

        // Enemy hurt animation
        if (finalDamage > 0) {
            this.showDamageBubble(finalDamage, this.elements.enemyPuppet);
        }

        // Big hit reactions (10+ damage)
        if (finalDamage >= 10) {
            this.tryEnemySpeech(this.combatState.enemy.id, 'bigHitReaction');
            this.tryCrowdReaction('enemyDefeated'); // crowd cheers big hits
        } else if (finalDamage >= 6) {
            this.tryCrowdReaction('enemyDefeated');
        }

        this.combatState.enemy.currentHP = Math.max(0, this.combatState.enemy.currentHP - finalDamage);
        this.renderEnemyHP();

        const hurtAnim = finalDamage >= ANIMATION_CONFIG.hit.bigHitThreshold
            ? ANIMATION_CONFIG.hurt.enemyBigHit
            : ANIMATION_CONFIG.hurt.enemy;
        await this.playAnimation(this.elements.enemyPuppet, hurtAnim);

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

        // Emit damageDealtToEnemy for passive listeners (mirror-spite, understudys-resilience, etc.)
        if (finalDamage > 0) {
            await this.events.emit('damageDealtToEnemy', {
                amount: finalDamage,
                card,
                enemyHPRatio: this.combatState.enemy.currentHP / this.combatState.enemy.maxHP
            });
        }

        // Enemy Retaliate: deal damage back to attacker
        if (this.keywords.enemy.retaliate > 0 && this.keywords.focus <= 0) {
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

        if (sourceCard?.speechBubble && Math.random() < 0.3) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        this.showBlockBubble(finalBlock, this.elements.macguffin);
        this.combatState.block += finalBlock;
        this.renderMacGuffinBlock();
        this.events.emit('blockGained', { amount: finalBlock });

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

        if (sourceCard?.speechBubble && Math.random() < 0.3) {
            this.showCharacterBubble(sourceCard.speechBubble, this.getTargetElement(protagonist));
        }

        this.combatState[protagonist].shield += finalShield;
        this.showSpeechBubble(`Shield +${finalShield}`, 'block', this.getTargetElement(protagonist));
        this.renderProtagonistDefenses(protagonist);
        this.events.emit('keywordGained', { keyword: 'shield', amount: finalShield, target: protagonist });

        await this.wait(200);
    },

    async gainTaunt(amount, sourceCard) {
        const protagonist = sourceCard?.owner;
        if (!protagonist || !this.combatState[protagonist] || protagonist === 'macguffin') return;

        console.log(`${protagonist} gaining ${amount} Taunt`);

        if (sourceCard?.speechBubble && Math.random() < 0.3) {
            this.showCharacterBubble(sourceCard.speechBubble, this.getTargetElement(protagonist));
        }

        this.combatState[protagonist].taunt += amount;
        this.showSpeechBubble(`Taunt +${amount}`, 'buff', this.getTargetElement(protagonist));
        this.renderProtagonistDefenses(protagonist);
        this.events.emit('keywordGained', { keyword: 'taunt', amount, target: protagonist });

        await this.wait(200);
    },

    async gainDistract(amount, sourceCard) {
        console.log(`Gaining ${amount} Distract`);

        if (sourceCard?.speechBubble && Math.random() < 0.3) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        this.combatState.distract += amount;
        this.showSpeechBubble(`Distract +${amount}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();
        this.events.emit('keywordGained', { keyword: 'distract', amount, target: 'global' });

        await this.wait(200);
    },

    async gainRetaliate(amount, sourceCard) {
        console.log(`Gaining ${amount} Retaliate`);

        if (sourceCard?.speechBubble && Math.random() < 0.3) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        this.combatState.retaliate += amount;
        this.showSpeechBubble(`Retaliate +${amount}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();
        this.events.emit('keywordGained', { keyword: 'retaliate', amount, target: 'global' });

        await this.wait(200);
    },

    async gainInspire(amount, sourceCard) {
        console.log(`Gaining ${amount} Inspire`);

        if (sourceCard?.speechBubble && Math.random() < 0.3) {
            this.showCharacterBubble(sourceCard.speechBubble, this.elements.macguffin);
        }

        this.keywords.inspire += amount;
        this.showSpeechBubble(`Inspire +${amount}`, 'buff', this.elements.macguffin);
        this.renderStatusEffects();
        this.events.emit('keywordGained', { keyword: 'inspire', amount, target: 'global' });

        await this.wait(200);
    },

    async gainEnergy(amount) {
        this.energy.current = Math.min(this.energy.max + amount, this.energy.current + amount);
        this.renderEnergy();
        this.events.emit('energyGained', { amount });
        await this.wait(100);
    },

    async drawCards(count) {
        console.log(`Drawing ${count} card(s)`);
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            if (card) {
                this.hand.push(card);
                this.events.emit('cardDrawn', { card });
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

        if (sourceCard?.speechBubble && Math.random() < 0.3) {
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

            await this.events.emit('debuffInflictedOnPlayer', { keyword, value, target: 'global' });
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

            await this.events.emit('debuffInflictedOnPlayer', { keyword, value, target: 'macguffin' });
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

        // Try contextual enemy speech for applying debuffs
        if (debuffApplied) {
            this.tryEnemySpeech(this.combatState.enemy.id, 'appliesDebuff');
        }

        if (debuffApplied) {
            await this.events.emit('debuffInflictedOnPlayer', { keyword, value, targets });
        }

        await this.wait(300);
    },

    /**
     * Player inflicts a debuff on the enemy.
     */
    async inflictDebuffOnEnemy(keyword, value, sourceCard) {
        const ek = this.keywords.enemy;

        // Allow passives to block debuff application (two-faces, iron-curtain, erratic)
        const debuffCtx = { keyword, value, card: sourceCard, blocked: false };
        await this.events.emit('beforeDebuffOnEnemy', debuffCtx);
        if (debuffCtx.blocked) {
            this.showSpeechBubble('Immune!', 'buff', this.elements.enemyPuppet);
            await this.wait(300);
            return;
        }

        if (keyword in ek) {
            ek[keyword] += value;
            console.log(`Inflicted ${keyword} ${value} on enemy (total: ${ek[keyword]})`);

            const heroEl = sourceCard?.owner ? this.getTargetElement(sourceCard.owner) : this.elements.macguffin;
            if (sourceCard?.speechBubble && Math.random() < 0.3) {
                this.showAttackBubble(sourceCard.speechBubble, heroEl);
            }
            this.showSpeechBubble(`${keyword} +${value}`, 'debuff', this.elements.enemyPuppet);

            // Protagonist speech for applying debuffs (Pip-weighted)
            if (sourceCard?.owner) {
                this.tryProtagonistSpeech(sourceCard.owner, 'debuffApplied');
            }

            // Check Fear/Frustration conversion on enemy
            if (keyword === 'fear' || keyword === 'frustration') {
                this.checkEnemyFearFrustration();
            }
        }

        // Emit for enchantment listeners (e.g. Comic Relief)
        await this.events.emit('debuffInflictedOnEnemy', { keyword, value, card: sourceCard });

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
    }
});
