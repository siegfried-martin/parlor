/**
 * Shared UI utilities for games
 */

/**
 * Show a waiting screen with a spinner and message
 * @param {HTMLElement} container - Container to show waiting screen in
 * @param {string} message - Message to display
 */
function showWaitingScreen(container, message) {
    container.innerHTML = `
        <div class="waiting-content">
            <div class="spinner"></div>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Show game results
 * @param {HTMLElement} container - Container to show results in
 * @param {string|null} winner - Winner name or null for draw
 * @param {string} playerName - Current player's name
 * @param {function} onRematch - Callback for rematch button
 */
function showResults(container, winner, playerName, onRematch) {
    let resultText, resultClass;

    if (winner === null) {
        resultText = "It's a draw!";
        resultClass = 'draw';
    } else if (winner === playerName) {
        resultText = 'You win!';
        resultClass = 'win';
    } else {
        resultText = 'You lose!';
        resultClass = 'lose';
    }

    container.innerHTML = `
        <div class="results-content ${resultClass}">
            <h2>${resultText}</h2>
            <button class="btn btn-primary" id="rematch-btn">Play Again</button>
            <a href="/" class="btn btn-secondary">Back to Lobby</a>
        </div>
    `;

    if (onRematch) {
        document.getElementById('rematch-btn').addEventListener('click', onRematch);
    }
}

/**
 * Show opponent disconnected overlay
 * @param {HTMLElement} container - Container for overlay
 * @param {function} onWait - Callback to continue waiting
 * @param {function} onLeave - Callback to leave game
 */
function showOpponentDisconnected(container, onWait, onLeave) {
    container.innerHTML = `
        <div class="disconnect-content">
            <p>Opponent disconnected</p>
            <p class="subtext">They have 60 seconds to reconnect</p>
            <div class="disconnect-actions">
                <button class="btn btn-primary" id="wait-btn">Keep Waiting</button>
                <a href="/" class="btn btn-secondary" id="leave-btn">Leave Game</a>
            </div>
        </div>
    `;

    if (onWait) {
        document.getElementById('wait-btn').addEventListener('click', onWait);
    }
}

/**
 * Show error message
 * @param {HTMLElement} container - Container for error
 * @param {string} message - Error message
 */
function showError(container, message) {
    container.innerHTML = `
        <div class="error-content">
            <p class="error-message">${escapeHtml(message)}</p>
            <a href="/" class="btn btn-primary">Back to Lobby</a>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Simple countdown timer
 * @param {HTMLElement} element - Element to show countdown in
 * @param {number} seconds - Seconds to count down
 * @param {function} onComplete - Callback when countdown finishes
 */
function countdown(element, seconds, onComplete) {
    let remaining = seconds;

    function tick() {
        element.textContent = remaining;

        if (remaining <= 0) {
            if (onComplete) onComplete();
            return;
        }

        remaining--;
        setTimeout(tick, 1000);
    }

    tick();
}
