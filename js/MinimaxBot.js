/**
 * This follows the Minimax strategy
 * It assumes that the other player is optimal
 * 
 * Note: winninglength=4 is hardcoded & two players
 * 
 * @see {@link} https://en.wikipedia.org/wiki/Minimax
 * @implements {Player}
 */


class MinimaxBot extends Player {
    constructor() {
        super();
        this._depth = 3;
    }

    async move(board, _availableMoves) {
        // specific implementations were not consulted but overviews and 
        // descriptions of minimax were 
        // additionally, the heuristic present in _evaluateMove was found below too
        // http://dx.doi.org/10.4236/jilsa.2019.112002
        const moveAnalysis = this._negamax(board, { coords: null, evaluation: 0 }, true, this._depth);
        const column = moveAnalysis.coords.x;
        return {
            moveType: MoveTypes.TOKEN_PLACEMENT,
            column
        };
    }

    /**
     * Performs static determination of how good a move is
     * @param {Coords} coords
     * @param {Board} board
     * @returns {Number}
     */
    _evaluateMove(coords, board) {
        const newLines = board.findNewLines(coords, 2);

        let value = 0;
        // Feature 1: multiple tokens in a row
        for (let newLine of newLines) {

            switch (newLine.length) {
                case 3: value += 90_000; break;
                case 2: value += 500_000; break;
                // lazy exit out of this function if the player is known to win with 4 or more
                default:
                    return 10 ** 100;
            }
        }

        // Feature 2: prioritise landing in the middle
        const normalisedColumnsAway = Math.abs((board.width / 2 - coords.x) / board.width * 2);
        value += 118 * normalisedColumnsAway ** 2 - 227 * normalisedColumnsAway + 200;

        return value;
    }

    /**
     * @typedef MoveAnalysis
     * @property {Coords} coords
     * @property {Number} evaluation
     */

    /**
     * 
     * @param {Board} board 
     * @param {MoveAnalysis} moveAnalysis 
     * @param {Boolean} isMaximisingPlayer 
     * @param {Number} depthRemaining integer
     * @returns {MoveAnalysis}
     */
    _negamax(board, moveAnalysis, isMaximisingPlayer, depthRemaining) {
        /*
        high-level generic minimax pseudo-code from https://youtu.be/l-hh51ncgDI
        high-level generic negamax psedo-code from https://en.wikipedia.org/wiki/Negamax
        */

        const availableMoves = board.calculateAvailableMoves();

        if (moveAnalysis.coords !== null) {
            board.setToken(moveAnalysis.coords, { playerIndex: isMaximisingPlayer ? this.playerIndex : 1 - this.playerIndex });
            moveAnalysis.evaluation += this._evaluateMove(moveAnalysis.coords, board) * (isMaximisingPlayer ? 1 : -1);

            if (depthRemaining === 0 || (!isFinite(moveAnalysis.evaluation)) || availableMoves.length === 0) {
                if ((depthRemaining) % 2 === 1) {
                    moveAnalysis.evaluation *= -1;
                }

                board.setToken(moveAnalysis.coords, null);

                // return static evaluation
                return moveAnalysis;
            }
        }

        /**
         * @type {MoveAnalysis}
         */
        let bestMoveAnalysis = {
            evaluation: null,
            coords: null
        };

        for (let moveCoords of availableMoves) {
            const childMoveAnalysis = this._negamax(board,
                { coords: moveCoords, evaluation: moveAnalysis.evaluation }, !isMaximisingPlayer, depthRemaining - 1);

            childMoveAnalysis.evaluation *= -1;

            if (childMoveAnalysis.evaluation > bestMoveAnalysis.evaluation || bestMoveAnalysis.coords === null) {
                bestMoveAnalysis = childMoveAnalysis;
            }
        }

        if (moveAnalysis.coords !== null) {
            board.setToken(moveAnalysis.coords, null);
        }
        return bestMoveAnalysis;
    }
}

