/**
 * Curtain Call — Scene Selection & Act Progression
 *
 * NODE_SEQUENCE routing, scene selection overlay, enemy selection,
 * combat setup, boss combat start, scene advancement, act completion,
 * and progress indicator rendering.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // === Node Routing ===

    /**
     * Route to the appropriate handler based on node type.
     */
    routeToNode(nodeType) {
        switch (nodeType) {
            case 'combat-0':
            case 'combat-1':
                this.showSceneSelection();
                break;
            case 'event':
                this.showNarrativeEvent();
                break;
            case 'merchant':
                this.showMerchant();
                break;
            case 'boss':
                this.startBossCombat();
                break;
        }
    },

    // === Scene Selection System ===

    showSceneSelection() {
        // Save run at scene selection (all state is finalized here)
        this.saveRun();

        // Show gold during between-combat phases
        this.showGoldDisplay(true);
        this.renderGoldDisplay();

        const act = this.actStructure[this.runState.currentAct];
        if (!act) return;

        // Derive combat index from node type: 'combat-0' → 0, 'combat-1' → 1
        const nodeType = NODE_SEQUENCE[this.runState.currentScene];
        const combatIndex = nodeType === 'combat-1' ? 1 : 0;

        if (combatIndex < act.scenes.length) {
            const sceneNumber = combatIndex + 1;
            const enemyIds = act.scenes[combatIndex].enemies;

            if (this.elements.sceneTitle) {
                this.elements.sceneTitle.textContent = `Act ${this.runState.currentAct}: ${act.name} \u2014 Scene ${sceneNumber}`;
            }

            this.runState.phase = 'scene-select';
            this.renderEnemyChoices(enemyIds);

            if (this.elements.sceneSelectOverlay) {
                this.elements.sceneSelectOverlay.style.display = 'flex';
            }
        } else {
            // Fallback: shouldn't happen with NODE_SEQUENCE but just in case
            this.startBossCombat();
        }
    },

    selectEnemy(enemyId) {
        const enemy = this.enemies[enemyId];
        if (!enemy) return;
        if (this.isAnimating) return;

        console.log(`Selected enemy: ${enemy.name}`);

        // Hide scene selection overlay
        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'none';
        }

        // Hide gold during combat
        this.showGoldDisplay(false);

        // Set up combat behind closed curtains
        this.startCombatWithEnemy(enemyId);

        // Open curtains to reveal combat
        this.curtainOpen();
    },

    startCombatWithEnemy(enemyId) {
        const enemy = this.enemies[enemyId];
        if (!enemy) return;

        // Determine initial intent from pattern or phase 0 pattern
        let initialIntent;
        if (enemy.phases) {
            initialIntent = { ...enemy.phases[0].pattern[0] };
        } else {
            initialIntent = { ...enemy.pattern[0] };
        }
        // Sanitize intent to display-only fields
        initialIntent = {
            type: initialIntent.type,
            value: initialIntent.value,
            hits: initialIntent.hits || 1,
            target: initialIntent.target
        };

        // Set up enemy state
        this.combatState.enemy = {
            id: enemy.id,
            name: enemy.name,
            currentHP: enemy.hp,
            maxHP: enemy.hp,
            intent: initialIntent,
            patternIndex: 0,
            currentPhase: 0,
            speechBubbles: enemy.speechBubbles,
            isBoss: enemy.isBoss || false,
            passives: enemy.passives || [],
            passiveState: {}
        };

        // Reset all v2 keywords
        this.resetKeywords();

        // Reset global defensive pools
        this.combatState.block = 0;
        this.combatState.distract = 0;
        this.combatState.retaliate = 0;

        // Reset protagonist HP and defenses for new combat
        this.combatState.aldric = { currentHP: 20, maxHP: 20, knockedOut: false, shield: 0, taunt: 0 };
        this.combatState.pip = { currentHP: 10, maxHP: 10, knockedOut: false, shield: 0, taunt: 0 };
        this.elements.heroAldric.classList.remove('knocked-out');
        this.elements.heroPip.classList.remove('knocked-out');
        // Remove any lingering KO badges
        const aldricBadge = this.elements.heroAldric.querySelector('.ko-badge');
        if (aldricBadge) aldricBadge.remove();
        const pipBadge = this.elements.heroPip.querySelector('.ko-badge');
        if (pipBadge) pipBadge.remove();

        // M7: Apply difficulty modifiers to enemy
        this._applyDifficultyModifiers();

        // Register enemy passive listeners on event bus
        this.registerEnemyPassives(enemy);

        // Register stage prop listeners for this combat
        this.registerStageProps();

        // M7: Register MacGuffin passive if applicable
        this._registerMacGuffinPassive();

        // Apply next-combat modifiers (from narrative events)
        this._applyNextCombatModifiers();

        this.renderCombatState();
        this.renderStageProps();
        this.renderEnemyPassive();

        // Update enemy SVG
        const enemySvg = this.elements.enemyPuppet.querySelector('.enemy-svg');
        if (enemySvg && enemy.svg) {
            enemySvg.src = enemy.svg;
            enemySvg.alt = enemy.name;
        }

        // Update UI
        this.elements.enemyPuppet.classList.remove('enemy-defeat');
        this.elements.enemyPuppet.classList.add('enemy-idle');

        // Update progress indicator
        this.updateProgressIndicator();

        // Reset speech system for new combat
        this.resetSpeechForCombat();

        // Start the turn
        this.runState.phase = 'combat';
        this.events.emit('combatStart', { enemyId: enemy.id, isBoss: enemy.isBoss || false });
        this.startTurn();
    },

    /**
     * M7: Apply difficulty modifiers to the current enemy.
     */
    _applyDifficultyModifiers() {
        const diffDef = DIFFICULTY_DEFINITIONS[this.difficulty] || DIFFICULTY_DEFINITIONS[0];
        if (diffDef.level === 0) return;

        // Scale enemy HP
        if (diffDef.hpMultiplier > 1) {
            const enemy = this.combatState.enemy;
            enemy.maxHP = Math.round(enemy.maxHP * diffDef.hpMultiplier);
            enemy.currentHP = enemy.maxHP;
        }

        // Enemy starting Inspire
        if (diffDef.enemyInspire > 0) {
            this.keywords.enemy.inspire += diffDef.enemyInspire;
        }
    },

    /**
     * M7: Register MacGuffin passive effect on the event bus.
     */
    _registerMacGuffinPassive() {
        const variant = MACGUFFIN_VARIANTS[this.selectedMacGuffin];
        if (!variant || !variant.passive) return;

        const game = this;
        const owner = 'macguffin-passive';

        switch (variant.passive) {
            case 'tome-velocity':
                // After playing 5 cards in a turn, draw 1
                this.events.on('cardPlayed', async () => {
                    if (game.keywords.cardsPlayedThisTurn === 5) {
                        await game.drawCards(1);
                        game.showSpeechBubble('Tome: Draw!', 'buff', game.elements.macguffin);
                    }
                }, { owner });
                break;

            case 'royal-presence':
                // Ovation cannot decay below 2
                this.events.on('playerTurnStart', async () => {
                    if (game.keywords.ovation < 2 && game.keywords.ovation > 0) {
                        game.keywords.ovation = 2;
                        game.renderOvationMeter();
                        game.renderStatusEffects();
                    }
                }, { owner, priority: 5 });
                break;
        }
    },

    /**
     * M7: Clean up MacGuffin passive listeners at combat end.
     */
    _clearMacGuffinPassive() {
        this.events.offByOwner('macguffin-passive');
    },

    /**
     * Apply modifiers from narrative event choices, then clear them.
     */
    _applyNextCombatModifiers() {
        const mods = this.nextCombatModifiers;
        if (!mods || Object.keys(mods).length === 0) return;

        if (mods.playerBlock) {
            this.combatState.block += mods.playerBlock;
        }
        if (mods.playerInspire) {
            this.keywords.inspire += mods.playerInspire;
        }
        if (mods.playerLuck) {
            this.keywords.luck += mods.playerLuck;
        }
        if (mods.playerWard) {
            this.keywords.ward += mods.playerWard;
        }
        if (mods.enemyInspire) {
            this.keywords.enemy.inspire += mods.enemyInspire;
        }
        if (mods.enemyWeak) {
            this.keywords.enemy.weak += mods.enemyWeak;
        }
        if (mods.enemyVulnerable) {
            this.keywords.enemy.vulnerable += mods.enemyVulnerable;
        }
        if (mods.playerBurn) {
            // Apply burn to both protagonists
            this.keywords.debuffs.aldric.burn += mods.playerBurn;
            this.keywords.debuffs.pip.burn += mods.playerBurn;
        }

        console.log('Applied next-combat modifiers:', mods);
        this.nextCombatModifiers = {};
    },

    startBossCombat() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act || !act.boss) return;

        // Hide scene selection
        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'none';
        }

        // Hide gold during combat
        this.showGoldDisplay(false);

        if (this.elements.sceneTitle) {
            this.elements.sceneTitle.textContent = `Act ${this.runState.currentAct}: ${act.name} \u2014 BOSS`;
        }

        // currentScene is already at index 4 (boss) via NODE_SEQUENCE routing
        // Set up boss behind closed curtains, then open
        this.startCombatWithEnemy(act.boss);
        this.curtainOpen();
    },

    advanceScene() {
        this.runState.currentScene++;

        if (this.runState.currentScene >= NODE_SEQUENCE.length) {
            // All nodes in this act complete
            this.onActComplete();
            return;
        }

        this.curtainClose(() => {
            this.routeToNode(NODE_SEQUENCE[this.runState.currentScene]);
        });
    },

    onActComplete() {
        console.log(`Act ${this.runState.currentAct} complete!`);

        // Track act completion for meta-progression
        this.runStats.actsCompleted = this.runState.currentAct;

        const nextAct = this.runState.currentAct + 1;
        if (this.actStructure[nextAct]) {
            // Advance to next act
            this.runState.currentAct = nextAct;
            this.runState.currentScene = 0;
            // Reset merchant purchases for new act
            this.merchantPurchases = [];
            console.log(`Advancing to Act ${nextAct}`);

            // Close curtains, then show scene selection for new act
            this.curtainClose(() => {
                this.updateProgressIndicator();
                this.routeToNode(NODE_SEQUENCE[this.runState.currentScene]);
            });
        } else {
            // All acts complete — game won!
            this.phase = 'gameover';
            this.runState.phase = 'victory';

            if (this.elements.endTurnBtn) {
                this.elements.endTurnBtn.textContent = 'Victory! Performance Complete!';
            }

            console.log('All acts complete! Victory!');

            // Clean up saved run
            this.deleteCompletedRun();

            // Show end-of-run summary
            setTimeout(() => this.showEndOfRunSummary('victory'), 2000);
        }
    },

    updateProgressIndicator() {
        const indicator = this.elements.progressIndicator;
        if (!indicator) return;

        indicator.innerHTML = '';

        for (let act = 1; act <= 3; act++) {
            const actData = this.actStructure[act];
            if (!actData) continue;

            // Add act label
            const actLabel = document.createElement('span');
            actLabel.className = 'progress-act-label';
            actLabel.textContent = act;
            indicator.appendChild(actLabel);

            // One dot per NODE_SEQUENCE entry
            for (let n = 0; n < NODE_SEQUENCE.length; n++) {
                const nodeType = NODE_SEQUENCE[n];
                const dot = document.createElement('span');
                dot.className = 'progress-dot';
                dot.dataset.act = act;
                dot.dataset.node = n;

                // Style variants by node type
                if (nodeType === 'event') {
                    dot.classList.add('event');
                } else if (nodeType === 'merchant') {
                    dot.classList.add('merchant');
                } else if (nodeType === 'boss') {
                    dot.classList.add('boss');
                }

                // Active/complete coloring
                if (act < this.runState.currentAct) {
                    dot.classList.add('complete');
                } else if (act === this.runState.currentAct) {
                    if (n < this.runState.currentScene) {
                        dot.classList.add('complete');
                    } else if (n === this.runState.currentScene) {
                        dot.classList.add('active');
                    }
                }

                indicator.appendChild(dot);
            }
        }
    }
});
