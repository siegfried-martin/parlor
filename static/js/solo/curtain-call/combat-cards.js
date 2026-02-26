/**
 * Curtain Call — Card Play & Effect Execution
 *
 * Card playability checks, energy cost calculation, card play pipeline,
 * hand re-indexing, debounced reflow, effect queue, and the main
 * executeCardEffects switch.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

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

        console.log('Playing card:', card.name, target ? `\u2192 ${target}` : '');

        // === Immediate state changes (synchronous) ===

        // Deduct energy
        const effectiveCost = this.getEffectiveCardCost(card);
        this.energy.current -= effectiveCost;
        this.renderEnergy();
        if (effectiveCost > 0) {
            this.events.emit('energySpent', { amount: effectiveCost });
        }

        // Remove from hand
        const instanceId = card.instanceId;
        this.hand.splice(index, 1);
        delete card.costReduction;
        delete card.damageBonus;

        // Enchantments go to the active enchantments area, not discard
        if (card.type === 'enchantment') {
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
            this.renderDeckCount();
            this.activateEnchantment(card);
            return;
        }

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
        this.renderDeckCount();

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
        await this.events.emit('cardPlayed', {
            card,
            target,
            cardsPlayedThisTurn: this.keywords.cardsPlayedThisTurn
        });

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
                case 'focus':
                    this.keywords.focus += effect.value;
                    this.showSpeechBubble(`Focus +${effect.value}`, 'buff', this.elements.macguffin);
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

                // Buff other protagonist's attack cards in hand (Cooperative Strike)
                case 'buffOtherProtagonistAttacks': {
                    const otherProt = card.owner === 'aldric' ? 'pip' : 'aldric';
                    let buffed = 0;
                    this.hand.forEach(c => {
                        if (c.owner === otherProt && c.type === 'attack') {
                            c.damageBonus = (c.damageBonus || 0) + effect.value;
                            buffed++;
                        }
                    });
                    if (buffed > 0) {
                        this.showSpeechBubble(`${otherProt === 'aldric' ? 'Aldric' : 'Pip'} attacks +${effect.value}!`, 'buff', this.elements.macguffin);
                        this.renderHand();
                    }
                    await this.wait(200);
                    break;
                }

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

                // Inflict a random debuff on enemy (Quick Jab)
                case 'inflictRandomDebuff': {
                    const debuffPool = ['vulnerable', 'poison', 'burn', 'weak'];
                    const chosen = debuffPool[Math.floor(Math.random() * debuffPool.length)];
                    await this.inflictDebuffOnEnemy(chosen, effect.value, card);
                    break;
                }

                // Damage per enemy debuff count (Quick Jab)
                case 'damagePerDebuff': {
                    const debuffCount = this.getEnemyDebuffCount();
                    const totalDmg = effect.base + (debuffCount * effect.perDebuff);
                    await this.dealDamageToEnemy(totalDmg, card);
                    break;
                }

                // Damage per total debuff stacks on enemy (Twist the Knife)
                case 'damagePerTotalDebuff': {
                    const totalStacks = this.getEnemyTotalDebuffStacks();
                    const totalDmg = totalStacks * effect.perStack;
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

                // === M4 New Effects ===

                // Gain Distract per unique debuff type on enemy (Read the Room)
                case 'distractPerDebuffType': {
                    const count = this.getEnemyDebuffCount();
                    if (count > 0) {
                        await this.gainDistract(count, card);
                    }
                    break;
                }

                // Gain Luck per unique debuff type on enemy (Catalogue of Woes)
                case 'luckPerDebuffType': {
                    const count = this.getEnemyDebuffCount();
                    if (count > 0) {
                        this.keywords.luck += count;
                        this.showSpeechBubble(`Luck +${count}`, 'buff', this.elements.macguffin);
                        this.renderStatusEffects();
                    }
                    await this.wait(200);
                    break;
                }

                // Damage per unique debuff type on enemy (Unraveling)
                case 'damagePerDebuffType': {
                    const count = this.getEnemyDebuffCount();
                    const totalDmg = count * effect.perType;
                    if (totalDmg > 0) {
                        await this.dealDamageToEnemy(totalDmg, card);
                    }
                    break;
                }

                // Gain Shield equal to Luck (Charmed Life)
                case 'shieldFromLuck': {
                    const luck = this.keywords.luck;
                    if (luck > 0) {
                        await this.gainShield(luck, card, target);
                    }
                    break;
                }

                // If 5+ Luck, gain 2 Energy + draw 2, lose 3 Luck (Lucky Break)
                case 'luckyBreak': {
                    if (this.keywords.luck >= 5) {
                        this.keywords.luck -= 3;
                        this.showSpeechBubble('Luck -3', 'debuff', this.elements.macguffin);
                        this.renderStatusEffects();
                        await this.gainEnergy(2);
                        await this.drawCards(2);
                    } else {
                        this.showSpeechBubble('Need 5+ Luck!', 'info', this.elements.macguffin);
                        await this.wait(200);
                    }
                    break;
                }

                // Spend all Luck, deal Luck x multiplier damage (All In)
                case 'allInLuck': {
                    const luck = this.keywords.luck;
                    if (luck > 0) {
                        this.keywords.luck = 0;
                        this.showSpeechBubble(`Luck spent: ${luck}`, 'buff', this.elements.macguffin);
                        this.renderStatusEffects();
                        const totalDmg = luck * effect.multiplier;
                        await this.dealDamageToEnemy(totalDmg, card);
                    } else {
                        this.showSpeechBubble('No Luck to spend!', 'info', this.elements.macguffin);
                        await this.wait(200);
                    }
                    break;
                }

                // Gain 1 Ovation per Taunt stack on card owner (Defiant Roar, Unyielding)
                case 'ovationFromTaunt': {
                    const protagonist = card.owner;
                    const taunt = (protagonist !== 'macguffin' && this.combatState[protagonist])
                        ? this.combatState[protagonist].taunt : 0;
                    if (taunt > 0) {
                        this.gainOvation(taunt);
                        this.showSpeechBubble(`Ovation +${taunt}`, 'buff', this.elements.macguffin);
                    }
                    await this.wait(200);
                    break;
                }

                // Gain Shield equal to Taunt x multiplier (Immovable)
                case 'shieldFromTaunt': {
                    const protagonist = card.owner;
                    const taunt = (protagonist !== 'macguffin' && this.combatState[protagonist])
                        ? this.combatState[protagonist].taunt : 0;
                    const shieldAmt = taunt * (effect.multiplier || 1);
                    if (shieldAmt > 0) {
                        await this.gainShield(shieldAmt, card, target || protagonist);
                    }
                    break;
                }

                // Convert all Block into Ovation (Rousing Recital)
                case 'convertBlockToOvation': {
                    const block = this.combatState.block;
                    if (block > 0) {
                        this.combatState.block = 0;
                        this.renderMacGuffinBlock();
                        const ovGain = Math.min(block, 5 - this.keywords.ovation);
                        if (ovGain > 0) {
                            this.gainOvation(ovGain);
                        }
                        this.showSpeechBubble(`Block → Ovation +${ovGain}`, 'buff', this.elements.macguffin);
                    }
                    await this.wait(200);
                    break;
                }

                // Gain Retaliate equal to Fortify (Sworn Protector)
                case 'retaliateFromFortify': {
                    const fort = this.keywords.fortify;
                    if (fort > 0) {
                        await this.gainRetaliate(fort, card);
                    }
                    break;
                }

                // M7: Gain Ovation directly
                case 'ovation':
                    this.gainOvation(effect.value);
                    await this.wait(200);
                    break;

                // M7: Set Ovation to exact value
                case 'setOvation':
                    this.keywords.ovation = Math.min(5, effect.value);
                    this.renderOvationMeter();
                    this.renderStatusEffects();
                    this.showSpeechBubble(`Ovation = ${this.keywords.ovation}!`, 'buff', this.elements.macguffin);
                    await this.wait(200);
                    break;

                // M7: Self-inflict Curse on MacGuffin
                case 'selfCurse':
                    this.keywords.curse += effect.value;
                    this.showSpeechBubble(`Curse +${effect.value}`, 'debuff', this.elements.macguffin);
                    this.renderStatusEffects();
                    await this.wait(200);
                    break;

                // M7: Heal target protagonist
                case 'heal': {
                    const healTarget = target || card.owner;
                    if (healTarget !== 'macguffin') {
                        const state = this.combatState[healTarget];
                        if (state && !state.knockedOut) {
                            const oldHP = state.currentHP;
                            state.currentHP = Math.min(state.maxHP, state.currentHP + effect.value);
                            const healed = state.currentHP - oldHP;
                            if (healed > 0) {
                                this.showHealBubble(healed, this.getTargetElement(healTarget));
                                this.renderProtagonistHP(healTarget);
                            }
                        }
                    }
                    await this.wait(200);
                    break;
                }
            }
        }
    }
});
