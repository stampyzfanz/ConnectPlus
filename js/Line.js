/*
In mathematics, direction is determined by both orientation and sense.
Two lines can be parallel but have opposite senses and thus different direction.
This program lets a "true" sense be straight or diagonally to the right or straight down, 
whereas the "false" sense is diagonally or straight to the left or straight up.
*/

// The terms sexter and sinister come from heraldy https://english.stackexchange.com/a/279442
/**
 * Enum for the orientations of a line (true sense is assumed)
 * @readonly
 * @enum {Coords}
 */
const Orientation = Object.freeze({
    HORIZONTAL: new Coords(1, 0),
    VERTICAL: new Coords(0, 1),
    /** Bottom-left to top-right */
    DIAGONAL_SINISTER: new Coords(1, -1),
    /** Top-left to bottom-right */
    DIAGONAL_DEXTER: new Coords(1, 1),
});

/**
 * @typedef Direction
 * @property {Orientation} orientation
 * @property {Boolean} sense
 */

/**
 * Enum for the directions gravity can be applied in
 * @readonly
 * @enum {Direction}
 */
const GravityDirection = Object.freeze({
    LEFT: {
        orientation: Orientation.HORIZONTAL,
        sense: false
    },
    RIGHT: {
        orientation: Orientation.HORIZONTAL,
        sense: true
    },
    DOWN: {
        orientation: Orientation.VERTICAL,
        sense: true
    }
});


class Line {
    /**
     * A set of tokens that are in a "row" for any orientation
     * @param {Board} board
     * @param {Coords} start where the line begins
     * @param {Orientation} orientation 
     */
    constructor(board, start, orientation) {
        /**
         * @type {Coords[]} coordsArr
         */
        this.coordsArr = [start];
        this.board = board;
        /**
         * @type {Orientation} orientation
         */
        this.orientation = orientation;
        this.start = start;

        /** 
         * @type {?number} playerIndex 
        */
        this.playerIndex = this.board.getToken(start)?.playerIndex;
    }

    /**
     * Extends the line in its orientation in supplied senses
     * @param {Boolean[]} senses
     */
    extend(senses) {
        if (this.hasValidStart()) {
            // if the line actually starts on a player's token, 
            // extend in one sense until the edge of the board or another player's
            // token is reached
            // then extend in the other sense if required
            for (let sense of senses) {
                let end = this.start;
                let next = end.next(this.orientation, sense);

                while (this.board.isValid(next) &&
                    this.board.getToken(next)?.playerIndex === this.playerIndex) {

                    end = next;

                    // coordsArr is sorted so its sense is positive as its iterated
                    if (sense === true) {
                        this.coordsArr.push(end);
                    } else {
                        this.coordsArr.unshift(end);
                    }


                    next = end.next(this.orientation, sense);
                }
            }
        }
    }

    /**
     * Returns whether or not the start is valid
     * Its valid if its not already in a line and there is a token at its position
     * @returns {Boolean}
     */
    hasValidStart() {
        return this.playerIndex !== undefined;
    }

    get length() {
        return this.coordsArr.length;
    }
}
