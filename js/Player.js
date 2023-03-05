/**
 * @abstract
 */
class Player {
    constructor() {
        if (this.constructor === Player) {
            throw new Error("Can't instantiate abstract class!");
        }

        this.powerupCount = 0;

        this.playerIndex = null;
    }

    /**
     * Allows the player to place a token
     * @param {Board} board
     * @param {Coords[]} availableMoves
     * @return {Move}
     */
    async move(board, availableMoves) {

    }
}