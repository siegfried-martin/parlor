/**
 * Curtain Call — Speech System Configuration
 *
 * Global settings for the speech bubble priority engine:
 * cooldowns, display durations, priority levels, and
 * diminishing probability curves.
 */

'use strict';

const SPEECH_CONFIG = {
    // Minimum ms between any two speech bubbles (across all sources)
    cooldown: 2500,

    // Display duration range (scaled by word count)
    displayDuration: {
        min: 1500,
        max: 2500,
        perWordOver3: 100   // +100ms per word beyond 3
    },

    // ms pause after animation before speech bubble appears
    speechDelay: 100,

    // Fade in/out durations (ms)
    fadeIn: 200,
    fadeOut: 200,

    // Priority levels — lower number = higher priority
    // When multiple triggers fire simultaneously, only the highest priority displays
    priority: {
        protagonistKnockoutReaction: 1,
        enemyDefeat: 2,
        bossPhaseTransition: 3,
        enemyFirstEncounter: 4,
        protagonistCombat: 5,
        crossProtagonist: 6,
        crowdGameEvent: 7,
        crowdAmbient: 8
    },

    // Diminishing probability multipliers per occurrence count (0-indexed)
    // e.g. enemy[0] = 1st time, enemy[1] = 2nd time, etc.
    diminishing: {
        enemy: [1.0, 0.5, 0.25, 0.125],
        // Protagonist: first occurrence is boosted (2x base), then normal, then halved
        protagonist: [2.0, 1.0, 0.5, 0.25],
        // Cap for protagonist boosted chance (2x base capped at this)
        protagonistCap: 0.6
    }
};
