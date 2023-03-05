/**
 * @typedef Config
 * @property {Number} winningLength integer
 * @property {Boolean} arePowerupsEnabled 
 * @property {Boolean} debug flag that allows arbitrary tokens to easily be changed when clicked
 */


/**
 * Enum for the orientations of a line (true sense is assumed)
 * @readonly
 * @enum {string}
 */
const MoveTypes = Object.freeze({
    TOKEN_PLACEMENT: Symbol("Token placement"),
    TOKEN_REMOVAL: Symbol("Token removal"),
});


/** 
 * @typedef {TokenPlacement|TokenRemoval} Move
 * 
 * @typedef TokenPlacement
 * @property {Number} column
 * @property {MoveTypes} moveType
 * 
 * @typedef TokenRemoval
 * @property {Coords} location
 * @property {MoveTypes} moveType
 */

class Game {
    /**Oversees Connect Plus by controlling the board and the players
     * 
     * @param {Player[]} players An array of 2 instances of polymorphic players
     * @param {Number} width 
     * @param {Number} height 
     * @param {Config} config 
     */
    constructor(players, width, height, config) {
        this.players = players;

        for (let [i, player] of players.entries()) {
            player.playerIndex = i;
        }

        this.width = width;
        this.height = height;
        this.config = config;

        this.board = new Board(this.width, this.height);

        /**
         * since powerups can't be used two times in a row by a single player
         * @type {Boolean}
         */
        this.canNextMoveBePowerup = true;

        if (this.config.arePowerupsEnabled) {
            this.config.powerupLength ??= 3;
        }

        this.activePlayerIndex = 0;

        this.cancelled = false;
    }

    /**
     * static property that means that the game has since been cancelled during operation
     */
    static GAME_CANCELLED_FLAG = -2;

    /**
     * Allows both players to make moves until the game ends
     * @returns {Promise<Number>} Index of winning player (-1 if its a draw, -2 if the game has been cancelled)
     */
    async start() {
        // I understand that while (true) with breaks is a code smell of complicated goto style code
        // However, I believe that is is justifiable because there are multiple exit conditions
        // - when a player wins or the board is filled up
        // Additionally, these occur during the loop, not the start or end
        while (true) {
            const player = this.players[this.activePlayerIndex];

            // calculate available moves & exit if needed
            const availableMoves = this.board.calculateAvailableMoves();

            if (availableMoves.length === 0) {
                GameSaver.delete();
                return -1;
            }

            // allow player to make move
            const move = await player.move(this.board, availableMoves);

            if (this.cancelled) {
                return Game.GAME_CANCELLED_FLAG;
            }

            // each 'line' is a horizontal, diagonal or vertical row that the player connects
            let newLines = [];

            switch (move.moveType) {
                case MoveTypes.TOKEN_PLACEMENT:
                    const moveCoords = availableMoves.find(coords => coords.x === move.column);

                    // update board with move
                    await this.board.animate(new Coords(move.column, -1), moveCoords, this.activePlayerIndex, true);
                    if (this.cancelled) {
                        return Game.GAME_CANCELLED_FLAG;
                    }
                    this.board.tokenAnimations = [];

                    newLines = this.board.findNewLines(
                        moveCoords, this.config.powerupLength ?? this.config.winningLength
                    );
                    break;
                case MoveTypes.TOKEN_REMOVAL:
                    this.canNextMoveBePowerup = false;
                    player.powerupCount--;

                    this.board.setToken(move.coords, null);

                    const animationPromises = [];
                    for (let y = this.height - 1; y >= 0; y--) {
                        const coordsOfTokenToLower = new Coords(move.coords.x, y);
                        const loweredCoords = coordsOfTokenToLower.applyGravity(
                            GravityDirection.DOWN, this.board
                        );

                        if (loweredCoords.y !== coordsOfTokenToLower.y) {
                            const token = this.board.getToken(coordsOfTokenToLower);

                            if (token !== null) {
                                this.board.getStyle(loweredCoords).isVisible = false;
                                this.board.setToken(loweredCoords, token);
                                this.board.setToken(coordsOfTokenToLower, null);

                                const animationPromise = this.board.animate(
                                    coordsOfTokenToLower, loweredCoords, token.playerIndex, false
                                )

                                animationPromises.push(animationPromise);

                                animationPromise.then(async () => {
                                    this.board.getStyle(loweredCoords).isVisible = true;
                                });

                                await sleep(39);
                                if (this.cancelled) {
                                    return Game.GAME_CANCELLED_FLAG;
                                }
                            }
                        }
                    }

                    await Promise.all(animationPromises);
                    if (this.cancelled) {
                        return Game.GAME_CANCELLED_FLAG;
                    }
                    this.board.tokenAnimations = [];

                    // since no powerups are administered for lines created from powerup
                    newLines = this.board.findNewLines(
                        null, this.config.winningLength
                    );
                    break;
            }


            // if a player has won
            const winningLines = newLines.filter(line => line.length >= this.config.winningLength);
            if (winningLines.length >= 1) {
                // if both players have won, its a draw
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        this.board.getStyle(new Coords(x, y)).isDark = true;
                        this.board.getStyle(new Coords(x, y)).isLight = false;
                    }
                }

                for (let winningLine of winningLines) {
                    // give player powerup
                    // animate giving of powerup and striking through the cells
                    for (let coords of winningLine.coordsArr) {
                        this.board.getStyle(coords).isDark = false;
                    }
                }

                GameSaver.delete();
                if (new Set(winningLines.map(line => line.playerIndex)).size === 2) {
                    return -1;
                } else {
                    return winningLines[0].playerIndex;
                }
            }

            // check if a cell combination has caused a powerup
            if (move.moveType === MoveTypes.TOKEN_PLACEMENT && newLines.length > 0) {
                player.powerupCount++;
                for (let newLine of newLines) {
                    // give player powerup
                    // animate giving of powerup and striking through the cells
                    for (let coords of newLine.coordsArr) {
                        this.board.getStyle(coords).isLight = true;
                    }
                }

                setTimeout(() => {
                    for (let newLine of newLines) {
                        for (let coords of newLine.coordsArr) {
                            this.board.getStyle(coords).isLight = false;
                        }
                    }
                }, 1000);
            }

            // cycle to the next player, wrapping back to the first if it is the last player
            if (move.moveType === MoveTypes.TOKEN_PLACEMENT) {
                this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
                this.canNextMoveBePowerup = true;
            }
            GameSaver.save(this);
        }
    }
}