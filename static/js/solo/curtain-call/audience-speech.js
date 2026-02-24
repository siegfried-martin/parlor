/**
 * Curtain Call — Speech Priority Engine
 *
 * Speech system initialization and reset, probability/cooldown checks,
 * diminishing returns, line deduplication, core trySpeech dispatcher,
 * enemy/protagonist/crowd speech triggers, ambient dialogue,
 * and backward-compatible legacy wrappers.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // === Speech Priority Engine ===

    initSpeechSystem() {
        this._speechState = {
            lastBubbleTime: 0,
            activeBubblePriority: null,
            activeBubbleTimer: null,
            // Per-combat tracking (reset each fight)
            triggerCounts: {},      // { 'enemy:bigHitReaction': 2, ... }
            usedLines: {},          // { 'enemy:stage-rat:bigHitReaction': ['Oof!'], ... }
            guaranteedFired: {},    // { 'stage-rat:firstAttack': true, ... }
            // Crowd dialogue tracking
            lastCrowdSpeaker: null,
            lastCrowdLine: null
        };
    },

    resetSpeechForCombat() {
        if (!this._speechState) this.initSpeechSystem();
        this._speechState.triggerCounts = {};
        this._speechState.usedLines = {};
        this._speechState.guaranteedFired = {};
        this._speechState.lastCrowdSpeaker = null;
        this._speechState.lastCrowdLine = null;
    },

    _canShowSpeech(priority, guaranteed) {
        if (!this._speechState) this.initSpeechSystem();
        const now = Date.now();
        const ss = this._speechState;

        // Guaranteed lines bypass cooldown
        if (!guaranteed) {
            if (now - ss.lastBubbleTime < SPEECH_CONFIG.cooldown) return false;
        }

        // If a higher-priority bubble is currently active, skip
        if (ss.activeBubblePriority !== null && priority > ss.activeBubblePriority) {
            return false;
        }

        return true;
    },

    _getDiminishedChance(baseChance, triggerKey, source) {
        if (!this._speechState) this.initSpeechSystem();
        const count = this._speechState.triggerCounts[triggerKey] || 0;

        const curve = source === 'enemy'
            ? SPEECH_CONFIG.diminishing.enemy
            : SPEECH_CONFIG.diminishing.protagonist;

        const multiplierIndex = Math.min(count, curve.length - 1);
        const multiplier = curve[multiplierIndex];
        let chance = baseChance * multiplier;

        // Cap protagonist boosted chance
        if (source === 'protagonist' && count === 0) {
            chance = Math.min(chance, SPEECH_CONFIG.diminishing.protagonistCap);
        }

        return chance;
    },

    _pickUnusedLine(lines, poolKey) {
        if (!lines || lines.length === 0) return null;
        if (!this._speechState) this.initSpeechSystem();

        const used = this._speechState.usedLines[poolKey] || [];
        const available = lines.filter(l => !used.includes(l));
        const pool = available.length > 0 ? available : lines;

        const chosen = pool[Math.floor(Math.random() * pool.length)];

        // Track used lines
        if (!this._speechState.usedLines[poolKey]) {
            this._speechState.usedLines[poolKey] = [];
        }
        this._speechState.usedLines[poolKey].push(chosen);

        return chosen;
    },

    _recordSpeech(priority, triggerKey) {
        if (!this._speechState) this.initSpeechSystem();
        this._speechState.lastBubbleTime = Date.now();
        this._speechState.activeBubblePriority = priority;

        // Increment trigger count
        if (triggerKey) {
            this._speechState.triggerCounts[triggerKey] =
                (this._speechState.triggerCounts[triggerKey] || 0) + 1;
        }

        // Clear active priority after display duration
        clearTimeout(this._speechState.activeBubbleTimer);
        this._speechState.activeBubbleTimer = setTimeout(() => {
            this._speechState.activeBubblePriority = null;
        }, SPEECH_CONFIG.displayDuration.max + SPEECH_CONFIG.fadeOut);
    },

    // Core speech method — all speech goes through here
    trySpeech(priority, lines, element, options = {}) {
        const { guaranteed, triggerKey, poolKey, baseChance, source, bubbleType } = options;

        if (!this._canShowSpeech(priority, guaranteed)) return false;

        // Roll probability (guaranteed = always fires)
        if (!guaranteed && baseChance !== undefined) {
            const chance = this._getDiminishedChance(baseChance, triggerKey, source || 'enemy');
            if (Math.random() > chance) return false;
        }

        const pKey = poolKey || triggerKey || 'generic';
        const line = this._pickUnusedLine(lines, pKey);
        if (!line) return false;

        // Display the bubble
        if (bubbleType === 'audience') {
            this.showAudienceBubble(line, element);
            setTimeout(() => this.clearExplanationBubbles(), 4500);
        } else if (bubbleType === 'attack') {
            this.showAttackBubble(line, element);
        } else {
            this.showCharacterBubble(line, element);
        }

        this._recordSpeech(priority, triggerKey);
        return true;
    },

    // --- Enemy Speech ---

    tryEnemySpeech(enemyId, trigger, context = {}) {
        if (!this._speechState) this.initSpeechSystem();

        const enemyData = ENEMY_SPEECH[enemyId] || {};
        const guaranteed = context.guaranteed || false;

        // Check one-shot guaranteed triggers
        if (guaranteed && context.once) {
            const key = `${enemyId}:${trigger}`;
            if (this._speechState.guaranteedFired[key]) return false;
            this._speechState.guaranteedFired[key] = true;
        }

        // Determine lines pool
        let lines;
        if (trigger === 'firstAttack') {
            const line = enemyData.firstAttack;
            lines = line ? [line] : null;
        } else if (trigger === 'firstAoE') {
            const line = enemyData.firstAoE;
            lines = line ? [line] : null;
        } else if (trigger === 'defeat') {
            lines = enemyData.defeat;
        } else if (trigger === 'phaseTransition') {
            lines = enemyData.phaseTransitions;
        } else {
            // Contextual trigger — use enemy-specific lines or shared pool
            lines = enemyData[trigger] || ENEMY_SPEECH.shared[trigger];
        }

        if (!lines || lines.length === 0) return false;

        // Determine priority
        let priority;
        if (trigger === 'defeat') {
            priority = SPEECH_CONFIG.priority.enemyDefeat;
        } else if (trigger === 'phaseTransition') {
            priority = SPEECH_CONFIG.priority.bossPhaseTransition;
        } else if (trigger === 'firstAttack' || trigger === 'firstAoE') {
            priority = SPEECH_CONFIG.priority.enemyFirstEncounter;
        } else {
            priority = SPEECH_CONFIG.priority.protagonistCombat; // same level as protagonist combat
        }

        // Determine base chance for contextual triggers
        let baseChance;
        if (guaranteed) {
            baseChance = undefined; // skip probability check
        } else {
            const chanceConfig = ENEMY_SPEECH_CHANCES[trigger];
            baseChance = chanceConfig ? chanceConfig.baseChance : 0.3;
        }

        return this.trySpeech(priority, lines, this.elements.enemyPuppet, {
            guaranteed,
            triggerKey: `enemy:${trigger}`,
            poolKey: `enemy:${enemyId}:${trigger}`,
            baseChance,
            source: 'enemy',
            bubbleType: (trigger === 'firstAttack' || trigger === 'firstAoE') ? 'attack' : 'character'
        });
    },

    // --- Protagonist Speech ---

    tryProtagonistSpeech(protagonist, trigger, context = {}) {
        if (!this._speechState) this.initSpeechSystem();

        const guaranteed = context.guaranteed || false;
        const otherProt = protagonist === 'aldric' ? 'pip' : 'aldric';

        // Check for partner knockout (guaranteed cross-reaction)
        if (trigger === 'partnerKnockout') {
            const protData = PROTAGONIST_SPEECH[otherProt];
            const lines = protData?.partnerKnockout;
            if (!lines || lines.length === 0) return false;

            const el = this.getTargetElement(otherProt);
            return this.trySpeech(
                SPEECH_CONFIG.priority.protagonistKnockoutReaction,
                lines, el, {
                    guaranteed: true,
                    triggerKey: `protagonist:${otherProt}:partnerKnockout`,
                    poolKey: `protagonist:${otherProt}:partnerKnockout`,
                    source: 'protagonist',
                    bubbleType: 'character'
                }
            );
        }

        // Check for cross-reaction (15% chance, the OTHER protagonist reacts)
        if (!guaranteed && Math.random() < CROSS_REACTION_CHANCE) {
            const otherData = PROTAGONIST_SPEECH[otherProt];
            const crossLines = otherData?.crossReactions?.[trigger];
            if (crossLines && crossLines.length > 0) {
                const el = this.getTargetElement(otherProt);
                return this.trySpeech(
                    SPEECH_CONFIG.priority.crossProtagonist,
                    crossLines, el, {
                        triggerKey: `protagonist:${trigger}`,
                        poolKey: `protagonist:${otherProt}:cross:${trigger}`,
                        baseChance: 1.0, // cross-reaction already passed its 15% check
                        source: 'protagonist',
                        bubbleType: 'character'
                    }
                );
            }
        }

        // Normal self-triggered speech
        const protData = PROTAGONIST_SPEECH[protagonist];
        const lines = protData?.[trigger];
        if (!lines || lines.length === 0) return false;

        const chanceConfig = PROTAGONIST_SPEECH_CHANCES[trigger];
        const baseChance = chanceConfig ? chanceConfig.baseChance : 0.3;

        const el = this.getTargetElement(protagonist);
        return this.trySpeech(
            SPEECH_CONFIG.priority.protagonistCombat,
            lines, el, {
                guaranteed,
                triggerKey: `protagonist:${trigger}`,
                poolKey: `protagonist:${protagonist}:${trigger}`,
                baseChance,
                source: 'protagonist',
                bubbleType: 'character'
            }
        );
    },

    // --- Crowd Reactions ---

    tryCrowdReaction(trigger, context = {}) {
        if (!this._speechState) this.initSpeechSystem();

        const reactionConfig = CROWD_GAME_REACTIONS[trigger];
        if (!reactionConfig) return false;

        const members = this.getRandomAudienceMembers(1);
        if (members.length === 0) return false;

        return this.trySpeech(
            SPEECH_CONFIG.priority.crowdGameEvent,
            reactionConfig.lines, members[0], {
                triggerKey: `crowd:${trigger}`,
                poolKey: `crowd:${trigger}`,
                baseChance: reactionConfig.chance,
                source: 'protagonist', // use protagonist diminishing curve (boosted first time)
                bubbleType: 'audience'
            }
        );
    },

    triggerCrowdAmbientDialogue() {
        if (!this._speechState) this.initSpeechSystem();
        if (!this._canShowSpeech(SPEECH_CONFIG.priority.crowdAmbient, false)) return;

        const members = this.getRandomAudienceMembers(1);
        if (members.length === 0) return;

        const member = members[0];
        const memberType = member.dataset.type;

        // Check for response pair opportunity
        const ss = this._speechState;
        if (ss.lastCrowdSpeaker && ss.lastCrowdLine) {
            const pair = CROWD_RESPONSE_PAIRS.find(p =>
                p.speaker === ss.lastCrowdSpeaker &&
                p.line === ss.lastCrowdLine &&
                p.responder === memberType
            );
            if (pair) {
                this.showAudienceBubble(pair.response, member);
                setTimeout(() => this.clearExplanationBubbles(), 4500);
                ss.lastCrowdSpeaker = memberType;
                ss.lastCrowdLine = pair.response;
                this._recordSpeech(SPEECH_CONFIG.priority.crowdAmbient, 'crowd:ambient');
                return;
            }
        }

        // Normal ambient line from character's personality pool
        const ambientLines = CROWD_AMBIENT[memberType];
        if (!ambientLines || ambientLines.length === 0) return;

        const line = this._pickUnusedLine(ambientLines, `crowd:ambient:${memberType}`);
        if (!line) return;

        this.showAudienceBubble(line, member);
        setTimeout(() => this.clearExplanationBubbles(), 3000);
        ss.lastCrowdSpeaker = memberType;
        ss.lastCrowdLine = line;
        this._recordSpeech(SPEECH_CONFIG.priority.crowdAmbient, 'crowd:ambient');
    },

    // --- Backward-compatible wrappers ---
    // Kept as no-ops / safe fallbacks. All speech triggers now go through
    // tryEnemySpeech, tryProtagonistSpeech, and tryCrowdReaction directly.

    initVoiceLines() {
        this.initSpeechSystem();
    },

    getOvationTier() {
        const ov = this.keywords?.ovation || 0;
        if (ov >= 4) return 'high';
        if (ov >= 2) return 'mid';
        return 'low';
    },

    tryProtagonistLine(protagonist, event) {
        // Legacy no-op — all protagonist speech now uses tryProtagonistSpeech
        // with specific triggers wired directly in combat.js
    },

    tryAudienceReaction(event) {
        // Legacy no-op — all crowd reactions now use tryCrowdReaction
        // with specific triggers wired directly in combat.js
    },

    getEnemyLine(enemyId, event) {
        // Legacy method — returns a line string for direct use
        const expanded = ENEMY_EXPANDED_LINES[enemyId];
        if (expanded && expanded[event]) {
            return this._pickUnusedLine(expanded[event], `legacy:${enemyId}:${event}`) || '';
        }
        const enemy = this.combatState?.enemy;
        const base = enemy?.speechBubbles?.[event];
        return base || '';
    },

    showBossPhaseTransition(enemyId) {
        // Use new system for phase transition speech
        const fired = this.tryEnemySpeech(enemyId, 'phaseTransition', { guaranteed: true });
        if (!fired) {
            // Fallback to legacy
            const line = this.getEnemyLine(enemyId, 'phaseTransition');
            if (line) {
                this.showAttackBubble(line, this.elements.enemyPuppet);
            }
        }
        this.tryCrowdReaction('enemyDefeated');
    }
});
