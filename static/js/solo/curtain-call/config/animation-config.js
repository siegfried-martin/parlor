/**
 * Curtain Call — Animation Configuration
 *
 * Web Animations API keyframe arrays + timing for all combat animations.
 * Single source of truth — used by game.playAnimation(element, animDef).
 *
 * Idle animations remain in CSS (infinite loops).
 */

"use strict";

const ANIMATION_CONFIG = {
  // === Attack Animations ===
  attack: {
    aldric: {
      keyframes: [
        { transform: "translateY(0) rotate(0)", offset: 0 },
        { transform: "translateY(-40px) rotate(6deg)", offset: 0.4 },
        { transform: "translateY(0) rotate(0)", offset: 1 },
      ],
      duration: 500,
      easing: "ease-out",
    },
    aldricAlt: {
      // Rise, wind back, swing through, follow-through hold, return
      keyframes: [
        { transform: "translateY(0) rotate(0deg)", offset: 0 },
        { transform: "translateY(-35px) rotate(-6deg)", offset: 0.3 },
        { transform: "translateY(-50px) rotate(14deg)", offset: 0.5 },
        { transform: "translateY(-45px) rotate(10deg)", offset: 0.65 },
        { transform: "translateY(0) rotate(0deg)", offset: 1 },
      ],
      duration: 700,
      easing: "ease-out",
    },
    aldricBigHit: {
      // Cross-body wind-up: lean left, swing right at peak, hold, return
      keyframes: [
        { transform: "translateX(0) translateY(0) rotate(0deg)", offset: 0 },
        { transform: "translateX(-10px) translateY(-30px) rotate(-14deg)", offset: 0.35 },
        { transform: "translateX(12px) translateY(-50px) rotate(14deg)", offset: 0.55 },
        { transform: "translateX(8px) translateY(-45px) rotate(10deg)", offset: 0.65 },
        { transform: "translateX(0) translateY(0) rotate(0deg)", offset: 1 },
      ],
      duration: 800,
      easing: "ease-out",
    },
    pip: {
      keyframes: [
        { transform: "translateY(0) scale(1)", offset: 0 },
        { transform: "translateY(-40px) scale(1.08)", offset: 0.4 },
        { transform: "translateY(0) scale(1)", offset: 1 },
      ],
      duration: 400,
      easing: "ease-out",
    },
    pipAlt: {
      // Feint left, snap right and upward for the real strike
      keyframes: [
        { transform: "translateX(0) translateY(0) scale(1)", offset: 0 },
        { transform: "translateX(-15px) translateY(-5px) scale(1)", offset: 0.2 },
        { transform: "translateX(12px) translateY(-35px) scale(1.1)", offset: 0.5 },
        { transform: "translateX(6px) translateY(-30px) scale(1.05)", offset: 0.6 },
        { transform: "translateX(0) translateY(0) scale(1)", offset: 1 },
      ],
      duration: 500,
      easing: "ease-out",
    },
    pipBigHit: {
      // Crouch, flank right while low, spring up for aerial strike, hold, return
      keyframes: [
        { transform: "translateX(0) translateY(0) scale(1)", offset: 0 },
        { transform: "translateX(0) translateY(15px) scale(0.95)", offset: 0.1 },
        { transform: "translateX(25px) translateY(10px) scale(0.95)", offset: 0.35 },
        { transform: "translateX(20px) translateY(-40px) scale(1.15)", offset: 0.55 },
        { transform: "translateX(12px) translateY(-35px) scale(1.1)", offset: 0.65 },
        { transform: "translateX(0) translateY(0) scale(1)", offset: 1 },
      ],
      duration: 800,
      easing: "ease-out",
    },
    enemy: {
      keyframes: [
        { transform: "translateY(0) rotate(0deg)", offset: 0 },
        { transform: "translateY(35px) rotate(4deg)", offset: 0.4 },
        { transform: "translateY(0) rotate(0deg)", offset: 1 },
      ],
      duration: 500,
      easing: "ease-out",
    },
    enemyAoE: {
      keyframes: [
        { transform: "translateX(0) translateY(0) scale(1)", offset: 0 },
        {
          transform: "translateX(-40px) translateY(8px) scale(1.02)",
          offset: 0.25,
        },
        {
          transform: "translateX(0) translateY(20px) scale(1.05)",
          offset: 0.5,
        },
        {
          transform: "translateX(40px) translateY(8px) scale(1.02)",
          offset: 0.75,
        },
        { transform: "translateX(0) translateY(0) scale(1)", offset: 1 },
      ],
      duration: 500,
      easing: "ease-in-out",
    },
  },

  // === Hurt / Damage Reaction Animations ===
  hurt: {
    aldric: {
      keyframes: [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(-10px)", offset: 0.2 },
        { transform: "translateX(10px)", offset: 0.4 },
        { transform: "translateX(-6px)", offset: 0.6 },
        { transform: "translateX(6px)", offset: 0.8 },
        { transform: "translateX(0)", offset: 1 },
      ],
      duration: 350,
      easing: "ease-out",
    },
    pip: {
      keyframes: [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(-6px)", offset: 0.25 },
        { transform: "translateX(6px)", offset: 0.5 },
        { transform: "translateX(-4px)", offset: 0.75 },
        { transform: "translateX(0)", offset: 1 },
      ],
      duration: 250,
      easing: "ease-out",
    },
    enemy: {
      keyframes: [
        { transform: "translateY(0)", offset: 0 },
        { transform: "translateY(-15px)", offset: 0.3 },
        { transform: "translateY(-10px)", offset: 0.6 },
        { transform: "translateY(0)", offset: 1 },
      ],
      duration: 300,
      easing: "ease-out",
    },
    enemyBigHit: {
      keyframes: [
        { transform: "translateY(0)", opacity: 1, offset: 0 },
        { transform: "translateY(-15px)", opacity: 0.7, offset: 0.3 },
        { transform: "translateY(-10px)", opacity: 1, offset: 0.6 },
        { transform: "translateY(0)", opacity: 1, offset: 1 },
      ],
      duration: 300,
      easing: "ease-out",
    },
    macguffin: {
      keyframes: [
        { transform: "translateX(0) scale(1)", offset: 0 },
        { transform: "translateX(-5px) scale(0.98)", offset: 0.25 },
        { transform: "translateX(5px) scale(0.98)", offset: 0.5 },
        { transform: "translateX(-3px) scale(0.99)", offset: 0.75 },
        { transform: "translateX(0) scale(1)", offset: 1 },
      ],
      duration: 400,
      easing: "ease-out",
    },
  },

  // === Thresholds & Reference Values ===
  hit: {
    bigHitThreshold: 10,
  },

  macguffinLowHp: {
    threshold: 0.3,
  },
};
