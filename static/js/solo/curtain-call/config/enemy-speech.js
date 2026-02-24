/**
 * Curtain Call — Enemy Speech Configuration
 *
 * Per-enemy guaranteed lines (first attack, first AoE, defeat, phase transitions)
 * and contextual lines (probabilistic, with diminishing returns).
 * Falls back to shared pools for contextual triggers if no custom lines exist.
 */

'use strict';

const ENEMY_SPEECH = {
    // Shared default pools for contextual triggers (used when enemy has no custom lines)
    shared: {
        bigHitReaction: ['Oof!', 'That stung!', 'Lucky shot!', 'Not bad...', 'You\'ll pay for that!'],
        heals: ['Feeling better.', 'Still standing.', 'Can\'t stop me.'],
        appliesDebuff: ['Suffer!', 'How\'s that feel?', 'You\'re weakening.'],
        gainsBlock: ['Try harder.', 'Protected.', 'Fortified!']
    },

    // === ACT I ===

    'stage-rat': {
        firstAttack: 'Squeak!',
        firstAoE: 'That means GIVE ME CHEESE!',
        defeat: ['Squeeeak...', '...squeak.'],
    },

    'rusty-knight': {
        firstAttack: 'FOR... SOMETHING!',
        firstAoE: 'CLANK CLANK CLANK!',
        defeat: ['I rust in peace...', 'Need... oil...'],
        gainsBlock: ['CLANK.', 'Still sturdy.'],
    },

    'moth-swarm': {
        firstAttack: 'bzz bzz bzz',
        firstAoE: 'SCATTER AND STRIKE!',
        defeat: ['poof', '...flutter...'],
        bigHitReaction: ['SCATTER!', 'Too bright!'],
    },

    'stagehand': {
        firstAttack: 'Nothing personal.',
        firstAoE: 'EVERYONE OFF STAGE!',
        defeat: ['I quit.', 'Union break...'],
        heals: ['Setting the stage...', 'Back to work.'],
    },

    'the-critic': {
        firstAttack: 'Let me see what we\'re working with.',
        firstAoE: 'A performance for EVERYONE to suffer through.',
        defeat: ['Fine. Two stars.', '...Not recommended.'],
        phaseTransitions: ['Intermission is over.'],
        bigHitReaction: ['I\'ve received worse reviews.', 'Noted.'],
        heals: ['The show must go on.'],
        appliesDebuff: ['Scathing review!', 'Below average.'],
    },

    // === ACT II ===

    'phantom-understudy': {
        firstAttack: 'My turn now.',
        firstAoE: 'THE SPOTLIGHT IS EVERYWHERE!',
        defeat: ['...understudy down.', 'My performance... ends.'],
        heals: ['I endure.', 'Not yet!'],
        bigHitReaction: ['That wasn\'t in rehearsal!'],
    },

    'prop-master': {
        firstAttack: 'Places, everyone.',
        firstAoE: 'PROPS EVERYWHERE!',
        defeat: ['Props down.', 'Strike the set...'],
        gainsBlock: ['Barricaded.', 'Built to last.'],
        bigHitReaction: ['Careful with the props!'],
    },

    'shadow-mimic': {
        firstAttack: 'Mirror mirror...',
        firstAoE: 'REFLECTIONS MULTIPLY!',
        defeat: ['...reflected.', 'Shattered...'],
        bigHitReaction: ['Shatter!', 'Cracking...'],
    },

    'spotlight-phantom': {
        firstAttack: 'BLINDING!',
        firstAoE: 'LIGHTS ON EVERYONE!',
        defeat: ['Lights out.', '...dimming...'],
        appliesDebuff: ['Feel the light.', 'Blinded!'],
        bigHitReaction: ['Dimming...', 'A flicker!'],
    },

    'the-director': {
        firstAttack: 'From the top!',
        firstAoE: 'THIS SCENE INVOLVES EVERYONE!',
        defeat: ['...that\'s a wrap.', '...cut.'],
        phaseTransitions: ['Plot twist!', 'Act two begins!'],
        appliesDebuff: ['Recast!', 'You\'re all fired!'],
        bigHitReaction: ['Cut!', 'That wasn\'t in the script!'],
        heals: ['Improvisation!', 'Take two!'],
    },

    // === ACT III ===

    'prima-donna': {
        firstAttack: 'The spotlight is MINE!',
        firstAoE: 'EVERYONE MUST WITNESS!',
        defeat: ['...encore?', 'The diva... falls.'],
        gainsBlock: ['Adore me!', 'Untouchable!'],
        bigHitReaction: ['How DARE you!', 'My costume!'],
    },

    'comedy-tragedy-mask': {
        firstAttack: 'HA HA HA!',
        firstAoE: 'LAUGH AND CRY!',
        defeat: ['...the end.', '...fin.'],
        bigHitReaction: ['SOB...', 'That\'s not funny!'],
    },

    'puppeteers-hand': {
        firstAttack: 'Dance, puppet!',
        firstAoE: 'ALL STRINGS ATTACHED!',
        defeat: ['...unstrung.', 'Cut the strings...'],
        appliesDebuff: ['Tangled!', 'Dance for me!'],
        bigHitReaction: ['Strings cut!', 'Ouch!'],
    },

    'fallen-curtain': {
        firstAttack: 'Crushing weight!',
        firstAoE: 'THE CURTAIN FALLS ON ALL!',
        defeat: ['...curtain falls.', '...final bow.'],
        gainsBlock: ['Impenetrable.', 'Behind the curtain.'],
        appliesDebuff: ['Cursed!', 'Smothered.'],
        bigHitReaction: ['Cracking...', 'A tear!'],
    },

    'the-playwright': {
        firstAttack: 'The story demands it!',
        firstAoE: 'ALL CHARACTERS SUFFER!',
        defeat: ['...fin.', '...the end.'],
        phaseTransitions: ['Chapter two!', 'The twist!', 'The final page turns!'],
        bigHitReaction: ['Improv!', 'An unexpected chapter!'],
        heals: ['Rewrite!', 'Plot armor!'],
        appliesDebuff: ['Plot twist!', 'A tragic turn!'],
    }
};

// Base chances for contextual (non-guaranteed) enemy speech triggers
const ENEMY_SPEECH_CHANCES = {
    bigHitReaction: { threshold: 10, baseChance: 0.4 },
    heals:          { baseChance: 0.3 },
    appliesDebuff:  { baseChance: 0.25 },
    gainsBlock:     { baseChance: 0.2 }
};
