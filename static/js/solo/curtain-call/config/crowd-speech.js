/**
 * Curtain Call — Crowd Dialogue Configuration
 *
 * Per-audience-type ambient personality lines, character response pairs,
 * game-event crowd reaction pools, and event distribution weights.
 *
 * Lines should feel like overheard chatter — max 6-7 words each.
 */

'use strict';

// Ambient personality lines per audience member type
// These are NOT reactions to game state — they're flavor/comic relief
const CROWD_AMBIENT = {
    basic:    ['Exciting!', 'Oh my!', 'What a show!', 'I love this part!', 'Wonderful!'],
    tophat:   ['A fine establishment.', 'I\'ve seen better. I\'ve seen worse.', 'Reminds me of my youth.', 'Capital!', 'Mm, yes.', 'Quite exquisite.'],
    bowler:   ['Jolly good!', 'Rather impressive.', 'Hear hear!', 'Splendid!', 'I say!'],
    cap:      ['Awesome!', 'Let\'s go!', 'Woo!', 'Yeah!', 'Sick!', 'This is lit!'],
    ponytail: ['Beautiful!', 'So graceful!', 'Amazing!', 'Love it!', 'Stunning!'],
    bun:      ['Elegant.', 'Lovely.', 'How refined.', 'Wonderful.', 'Simply divine.'],
    afro:     ['Groovy!', 'Feel the rhythm!', 'Oh yeah!', 'That\'s the stuff!', 'Vibing!'],
    mohawk:   ['MOSH PIT!', 'This rocks!', 'LOUDER!', 'Best. Show. Ever.', 'ANARCHY!', 'METAL!'],
    cowboy:   ['Yeehaw!', 'This ain\'t my first rodeo.', 'Reminds me of home.', 'Giddy up!', 'Well I\'ll be.'],
    fancyhat: ['Darling!', 'Divine!', 'Simply fabulous!', 'Exquisite!', 'Magnifique!'],
    boy:      ['PUNCH HIM!', 'Go go go!', 'Mom, look!', 'This is the best day!', 'Can we come back tomorrow?'],
    girl:     ['Dad said this would be amazing.', 'When\'s the intermission?', 'I can\'t see over your hat.', 'Are they real puppets?', 'This is SO cool!'],
    glasses:  ['Fascinating technique.', 'The dramaturgy is exquisite.', 'I should write a paper on this.', 'Hmm, interesting.', 'Structurally sound.'],
    bald:     ['Not bad.', 'I\'ve seen things.', 'Classic.', 'Hmm.', 'Back in my day...'],
    messy:    ['WOOO!', 'YEAH BABY!', 'THIS IS INSANE!', 'I CAN\'T EVEN!', 'NO WAY!'],
    beanie:   ['Chill vibes.', 'Cool cool cool.', 'Nice.', 'Vibing.', 'Low-key amazing.'],
    longhair: ['Whoa...', 'Dude...', 'That was rad.', 'Heavy.', 'Far out.'],
    bowtie:   ['Did I leave the oven on?', 'I paid HOW much for this seat?', 'Marvelous. Simply marvelous.', 'Indubitably.', 'Quite.'],
    crown:    ['Acceptable.', 'We are amused.', 'Proceed.', 'How quaint.', 'The royal seal of approval.']
};

// Response pairs: when a specific member says a line, a nearby member of a
// specific type may respond with a follow-up the next time crowd dialogue fires
const CROWD_RESPONSE_PAIRS = [
    { speaker: 'bowtie', line: 'Marvelous. Simply marvelous.', responder: 'girl', response: 'You say that every show.' },
    { speaker: 'mohawk', line: 'MOSH PIT!', responder: 'tophat', response: 'Please sit down.' },
    { speaker: 'boy', line: 'PUNCH HIM!', responder: 'glasses', response: 'Violence isn\'t the answer.' },
    { speaker: 'crown', line: 'Acceptable.', responder: 'cowboy', response: 'High praise from royalty.' },
    { speaker: 'messy', line: 'THIS IS INSANE!', responder: 'bun', response: 'Indoor voice, dear.' },
    { speaker: 'glasses', line: 'I should write a paper on this.', responder: 'cap', response: 'Nerd!' },
    { speaker: 'cowboy', line: 'Yeehaw!', responder: 'crown', response: 'How undignified.' },
    { speaker: 'girl', line: 'When\'s the intermission?', responder: 'boy', response: 'Shh, this is the good part!' },
    { speaker: 'fancyhat', line: 'Magnifique!', responder: 'bald', response: 'Gesundheit.' },
    { speaker: 'beanie', line: 'Cool cool cool.', responder: 'mohawk', response: 'THAT\'S ALL YOU CAN SAY?!' }
];

// Game-event crowd reactions (shared line pools — any random member speaks)
const CROWD_GAME_REACTIONS = {
    macguffinBigDamage: {
        chance: 0.30,
        threshold: 8,   // minimum damage to trigger
        lines: ['Be careful!', 'Watch out!', 'Oh no!', 'Protect it!', 'Not the MacGuffin!']
    },
    enemyDefeated: {
        chance: 0.40,
        lines: ['Bravo!', 'Encore!', 'Magnificent!', 'Huzzah!', 'Victory!']
    },
    ovationMax: {
        chance: 0.50,
        lines: ['STANDING OVATION!', 'INCREDIBLE!', 'BEST SHOW EVER!', 'PHENOMENAL!']
    },
    protagonistKO: {
        chance: 0.40,
        lines: ['Get up!', 'Someone help!', 'Oh dear...', 'No!', 'This can\'t be!']
    },
    fullBlock: {
        chance: 0.25,
        lines: ['What a save!', 'Incredible!', 'Impenetrable!', 'Nothing gets through!']
    }
};

// Weighted distribution for periodic crowd events
const CROWD_EVENT_WEIGHTS = {
    wave: 40,
    characterDialogue: 30,
    tutorialHint: 30
};
