/**
 * GameClient - WebSocket wrapper for multiplayer games
 */
class GameClient {
    constructor(gameId, handlers) {
        this.gameId = gameId;
        this.handlers = handlers || {};
        this.ws = null;
        this.instanceId = null;
        this.playerName = null;
    }

    /**
     * Connect to the game server
     * @param {string} playerName - The player's display name
     * @param {string|null} instanceId - Optional instance ID for reconnection
     */
    connect(playerName, instanceId = null) {
        this.playerName = playerName;
        this.instanceId = instanceId;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/game/${this.gameId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');

            if (instanceId) {
                // Try to rejoin existing game
                this.send({
                    type: 'rejoin',
                    instance_id: instanceId,
                    player_name: playerName
                });
            } else {
                // New join
                this.send({
                    type: 'join',
                    player_name: playerName
                });
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this.handleMessage(msg);
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            this.handlers.onDisconnected?.();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    /**
     * Send a message to the server
     * @param {object} message - Message object to send
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Send a game move
     * @param {object} data - Move data specific to the game
     */
    sendMove(data) {
        this.send({ type: 'move', data });
    }

    /**
     * Handle incoming messages
     * @param {object} msg - Parsed message from server
     */
    handleMessage(msg) {
        console.log('Received:', msg.type, msg);

        switch (msg.type) {
            case 'waiting':
                this.handlers.onWaiting?.(msg);
                break;

            case 'matched':
                this.instanceId = msg.instance_id;
                // Update URL without reloading
                const newUrl = `/game/${this.gameId}/${msg.instance_id}`;
                history.pushState({}, '', newUrl);
                this.handlers.onMatched?.(msg);
                break;

            case 'rejoined':
                this.instanceId = msg.instance_id;
                this.handlers.onRejoined?.(msg);
                break;

            case 'game_state':
                this.handlers.onGameState?.(msg.data);
                break;

            case 'round_result':
                this.handlers.onRoundResult?.(msg);
                break;

            case 'new_round':
                this.handlers.onNewRound?.(msg);
                break;

            case 'game_over':
                this.handlers.onGameOver?.(msg);
                break;

            case 'opponent_disconnected':
                this.handlers.onOpponentDisconnected?.();
                break;

            case 'opponent_reconnected':
                this.handlers.onOpponentReconnected?.();
                break;

            case 'rematch_requested':
                this.handlers.onRematchRequested?.(msg);
                break;

            case 'rematch_starting':
                this.handlers.onRematchStarting?.();
                break;

            case 'error':
                this.handlers.onError?.(msg);
                break;

            default:
                console.log('Unknown message type:', msg.type);
        }
    }

    /**
     * Close the WebSocket connection
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
