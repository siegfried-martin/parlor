/**
 * Curtain Call — Scene Selection & Act Progression
 *
 * Scene selection overlay, enemy selection, combat setup,
 * boss combat start, scene advancement, act completion,
 * and progress indicator rendering.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // === Scene Selection System ===

    showSceneSelection() {
        // Save run at scene selection (all state is finalized here)
        this.saveRun();

        const act = this.actStructure[this.runState.currentAct];
        if (!act) return;

        // Determine which enemies to show
        let enemyIds;
        let sceneNumber;

        if (this.runState.currentScene < act.scenes.length) {
            // Regular scene
            sceneNumber = this.runState.currentScene + 1;
            enemyIds = act.scenes[this.runState.currentScene].enemies;

            if (this.elements.sceneTitle) {
                this.elements.sceneTitle.textContent = `Act ${this.runState.currentAct}: ${act.name} \u2014 Scene ${sceneNumber}`;
            }
        } else {
            // Boss scene
            this.startBossCombat();
            return;
        }

        this.runState.phase = 'scene-select';
        this.renderEnemyChoices(enemyIds);

        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'flex';
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

        // Register enemy passive listeners on event bus
        this.registerEnemyPassives(enemy);

        this.renderCombatState();
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

    startBossCombat() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act || !act.boss) return;

        // Hide scene selection
        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'none';
        }

        if (this.elements.sceneTitle) {
            this.elements.sceneTitle.textContent = `Act ${this.runState.currentAct}: ${act.name} \u2014 BOSS`;
        }

        this.runState.currentScene = 'boss';
        // Set up boss behind closed curtains, then open
        this.startCombatWithEnemy(act.boss);
        this.curtainOpen();
    },

    advanceScene() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act) return;

        if (typeof this.runState.currentScene === 'number') {
            this.runState.currentScene++;

            // Close curtains, then show scene selection on top
            // Player picks enemy -> selectEnemy() handles opening
            this.curtainClose(() => {
                this.showSceneSelection();
            });
        } else if (this.runState.currentScene === 'boss') {
            // Boss defeated, check if there's another act
            this.onActComplete();
        }
    },

    onActComplete() {
        console.log(`Act ${this.runState.currentAct} complete!`);

        const nextAct = this.runState.currentAct + 1;
        if (this.actStructure[nextAct]) {
            // Advance to next act
            this.runState.currentAct = nextAct;
            this.runState.currentScene = 0;
            console.log(`Advancing to Act ${nextAct}`);

            // Close curtains, then show scene selection for new act
            this.curtainClose(() => {
                this.updateProgressIndicator();
                this.showSceneSelection();
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
        }
    },

    updateProgressIndicator() {
        const indicator = this.elements.progressIndicator;
        if (!indicator) return;

        // Rebuild progress dots for current act structure (all 3 acts)
        indicator.innerHTML = '';

        for (let act = 1; act <= 3; act++) {
            const actData = this.actStructure[act];
            if (!actData) continue;

            // Add act label
            const actLabel = document.createElement('span');
            actLabel.className = 'progress-act-label';
            actLabel.textContent = act;
            indicator.appendChild(actLabel);

            // Scene dots
            for (let s = 0; s < actData.scenes.length; s++) {
                const dot = document.createElement('span');
                dot.className = 'progress-dot';
                dot.dataset.act = act;
                dot.dataset.scene = s + 1;

                if (act < this.runState.currentAct) {
                    dot.classList.add('complete');
                } else if (act === this.runState.currentAct) {
                    if (typeof this.runState.currentScene === 'number') {
                        if (s < this.runState.currentScene) {
                            dot.classList.add('complete');
                        } else if (s === this.runState.currentScene) {
                            dot.classList.add('active');
                        }
                    } else {
                        // boss — all scenes complete
                        dot.classList.add('complete');
                    }
                }

                indicator.appendChild(dot);
            }

            // Boss dot
            const bossDot = document.createElement('span');
            bossDot.className = 'progress-dot boss';
            bossDot.dataset.act = act;
            bossDot.dataset.scene = 'boss';

            if (act < this.runState.currentAct) {
                bossDot.classList.add('complete');
            } else if (act === this.runState.currentAct && this.runState.currentScene === 'boss') {
                bossDot.classList.add('active');
            }

            indicator.appendChild(bossDot);
        }
    }
});
