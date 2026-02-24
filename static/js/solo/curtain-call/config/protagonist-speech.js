/**
 * Curtain Call — Protagonist Speech Configuration
 *
 * Per-protagonist speech lines organized by trigger type.
 * Includes cross-protagonist reactions and guaranteed knockout reactions.
 *
 * Tone:
 *   Aldric — Noble, earnest, formal. Short declarations.
 *   Pip    — Cheeky, irreverent, playful. Quips and taunts.
 */

'use strict';

const PROTAGONIST_SPEECH = {
    aldric: {
        // Self-triggered lines (protagonist's own actions)
        dealBigDamage: [
            'Well struck!',
            'The line holds!',
            'For the treasure!',
            'Hold fast!',
            'A worthy blow!'
        ],
        fullyBlocks: [
            'None shall pass!',
            'I will protect you!',
            'Brace!',
            'Stand firm!'
        ],
        distractNegates: [
            'Stay focused.',
            'Eyes on the prize.',
            'Not today.'
        ],
        ovationMax: [
            'The crowd roars!',
            'For honor!',
            'We stand tall!'
        ],
        dropsBelowHalf: [
            'I can take it...',
            'Still standing.',
            'Not yet...',
            'A scratch, nothing more.'
        ],
        enemyDefeated: [
            'Victory!',
            'The day is ours!',
            'Well fought!',
            'Honor prevails!'
        ],
        debuffApplied: [
            'Weakened them.',
            'Their guard falters.'
        ],

        // Cross-reactions (when Pip triggers an event, Aldric may react)
        crossReactions: {
            dealBigDamage: ['Well done, Pip!', 'Impressive strike!'],
            fullyBlocks: ['Pip, careful!', 'Stay safe!'],
            dropsBelowHalf: ['Pip, hold on!', 'I\'m coming!', 'Stay with me!'],
            enemyDefeated: ['Together we prevail!', 'Fine work!']
        },

        // Guaranteed reaction when Pip is knocked out (100% chance, highest priority)
        partnerKnockout: [
            'PIP! ...I\'ll finish this.',
            'No... I will not let this stand.',
            'For Pip... I fight on.'
        ]
    },

    pip: {
        // Self-triggered lines
        dealBigDamage: [
            'Too easy!',
            'Did that hurt?',
            'Gotcha!',
            'Boom!',
            'Oops, did I do that?'
        ],
        fullyBlocks: [
            'Can\'t touch this!',
            'Missed me!',
            'Nope!',
            'Nice try!'
        ],
        distractNegates: [
            'Over here!',
            'Ha! Fooled ya!',
            'Too slow!'
        ],
        ovationMax: [
            'They love us!',
            'Encore! Encore!',
            'What a show!'
        ],
        dropsBelowHalf: [
            'Ow ow ow!',
            'Hey, watch it!',
            'That stings!',
            'Okay, ow.'
        ],
        enemyDefeated: [
            'And stay down!',
            'Easy peasy!',
            'Next!',
            'Who\'s next?'
        ],
        debuffApplied: [
            'Oops, my bad.',
            'Feeling woozy?',
            'Surprise!'
        ],

        // Cross-reactions (when Aldric triggers an event, Pip may react)
        crossReactions: {
            dealBigDamage: ['Nice one, big guy!', 'Aldric smash!'],
            fullyBlocks: ['Phew, thanks Aldric!', 'That was close!'],
            dropsBelowHalf: ['Aldric, you okay?!', 'Hang in there!', 'Don\'t you dare!'],
            enemyDefeated: ['We make a great team!', 'High five!']
        },

        // Guaranteed reaction when Aldric is knocked out
        partnerKnockout: [
            'Aldric?! OK... OK I can do this.',
            'Hey! Big guy! ...Fine, my turn.',
            'No no no... I\'ve got this.'
        ]
    }
};

// Base chances for protagonist speech triggers
const PROTAGONIST_SPEECH_CHANCES = {
    dealBigDamage:   { threshold: 10, baseChance: 0.30 },
    fullyBlocks:     { baseChance: 0.30 },
    distractNegates: { baseChance: 0.30 },
    ovationMax:      { baseChance: 0.30 },
    dropsBelowHalf:  { baseChance: 0.40 },
    enemyDefeated:   { baseChance: 0.40 },
    debuffApplied:   { baseChance: 0.20 }
};

// Independent chance that the OTHER protagonist reacts instead
const CROSS_REACTION_CHANCE = 0.15;
