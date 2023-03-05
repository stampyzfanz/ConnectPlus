class Coords {
    /**
     * Provides minimalistic functionality for an immutable pair of coordinates
     * @param {Number} x how many cells to the right a coord is from the top left
     * @param {Number} y how many cells to the down  a coord is from the top left
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;

        // Ensures that the properties can't be changed
        Object.freeze(this);
    }

    /**
     * Returns a new pair of coordinates a single unit away from the current coords in a given direction
     * @param {Orientation | Direction} arg0 
     * @param {Boolean} sense not needed if direction is used
     * @returns {Coords}
     */
    next(arg0, sense) {
        if (arg0 instanceof Coords) {
            const orientation = arg0;
            return this.add(orientation.mult(sense ? 1 : -1));
        } else {
            const direction = arg0;
            return this.add(direction.orientation.mult(direction.sense ? 1 : -1));
        }
    }

    /**
     * Returns a new pair of coordinates that is the vector sum of the coordinates and another pair
     * @param {Coords} coords 
     * @returns {Coords}
     */
    add(coords) {
        return new Coords(this.x + coords.x, this.y + coords.y);
    }

    /**
     * Returns a new pair of coordinates that is the elementwise vector multiplication
     *  of the coordinates and another pair
     * @param {Number} scalar 
     * @returns {Coords}
     */
    mult(scalar) {
        return new Coords(this.x * scalar, this.y * scalar);
    }

    /**
     * Returns a new pair of coordinates of the current coordinates that have had gravity applied to them
     * @param {GravityDirection} gravityDirection
     * @param {Board} board
     * @returns {Coords}
     */
    applyGravity(gravityDirection, board) {
        let currentCell = new Coords(this.x, this.y);
        let nextCell = currentCell.next(gravityDirection);

        // if the cell below the cell below the token is full/does not exist
        while (board.isValid(nextCell) && board.getToken(nextCell) === null) {
            currentCell = nextCell
            nextCell = currentCell.next(gravityDirection);
        }

        return currentCell;
    }
}