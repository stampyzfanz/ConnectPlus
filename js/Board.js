/**
 * @typedef Token
 * @property {Number} playerIndex
 */

/**
 * @typedef Style
 * @property {Boolean} isDark
 * @property {Boolean} isLight
 * @property {Boolean} isVisible
 */



class Board {
    /**
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // The array is created and filled with temporary values
        // which are replaced with arrays https://stackoverflow.com/a/52268285

        /**
         * @type {(?Token)[][]}
         */
        this.tokens = new Array(this.height).fill(undefined)
            .map(() => new Array(this.width).fill(null));

        /**
         * @type {(?Style)[][]}
         */
        this.cellStyles = new Array(this.height).fill(undefined);

        for (let y = 0; y < this.height; y++) {
            this.cellStyles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.resetStyle(new Coords(x, y));
            }
        }


        /**
         * An array of all the token animations for the current move
         * @type {TokenAnimation[]}
         */
        this.tokenAnimations = [];
    }

    /**
     * Returns the token that exists at a given coords
     * @param {Coords} coords 
     * @returns {?Token}
     */
    getToken(coords) {
        console.assert(this.isValid(coords));
        return this.tokens[coords.y][coords.x];
    }

    /**
     * Updates the internal token board field, ensuring to update GUI
     * @param {Coords} coords
     * @param {?Token} token 
     */
    setToken(coords, token) {
        console.assert(this.isValid(coords));
        // Functionally performs this.tokens[coords.y][coords.x] = token
        // but it also tells Vue to rerender the cell
        // https://v2.vuejs.org/v2/guide/reactivity.html#For-Arrays
        app.$set(this.tokens[coords.y], coords.x, token);
    }

    /**
     * Returns the token that exists at a given coords
     * @param {Coords} coords 
     * @returns {Style}
     */
    getStyle(coords) {
        console.assert(this.isValid(coords));
        return this.cellStyles[coords.y][coords.x];
    }

    /**
     * Resets a cell's style to its default
     * @param {Coords} coords
     */
    resetStyle(coords) {
        let style = this.cellStyles[coords.y][coords.x];
        if (style === undefined) {
            this.cellStyles[coords.y][coords.x] = {};
            style = this.cellStyles[coords.y][coords.x];
        }

        app.$set(style, "isDark", false);
        app.$set(style, "isLight", false);
        app.$set(style, "isVisible", true);
    }

    /**
     * Returns whether the board contains a given coords
     * @param {Coords} coords 
     * @returns {Boolean} 
     */
    isValid(coords) {
        return 0 <= coords.x && coords.x <= this.width - 1
            && 0 <= coords.y && coords.y <= this.height - 1;
    }

    /**
     * @typedef TokenAnimation
     * @property {Number} playerIndex
     */

    /**
    * Uses CSS animations and Vue to draw the token as it falls and updates the token 2D array
    * @param {Coords} start
    * @param {Coords} end
    * @param {Number} playerIndex
    * @param {Boolean} changeBoard whether a token should be created at *end* after the animation
    * @return {Promise<Void>} a promise that is fulfilled when the animation finishes
    */
    async animate(start, end, playerIndex, changeBoard) {
        const startCoords = document.getElementById(`cell${start.x},${start.y}`)
            .getBoundingClientRect();
        const endCoords = document.getElementById(`cell${end.x},${end.y}`)
            .getBoundingClientRect();

        const length = endCoords.width;

        const id = this.tokenAnimations.length;
        this.tokenAnimations.push({
            playerIndex: playerIndex
        });

        // wait for Vue.js to create the element
        await Vue.nextTick();

        let fallingTime = 270 / this.height * (end.y - start.y) + 150;

        const animationEltContainer = document.getElementById('tokenAnimation' + id);
        animationEltContainer.animate(
            [
                {
                    top: startCoords.top + "px",
                    left: startCoords.left + "px",
                    visibility: "visible",
                    animationTimingFunction: "ease-in",
                },
                {
                    top: endCoords.top + "px",
                    left: endCoords.left + "px",
                    animationTimingFunction: "ease-out",
                    offset: 10 / 13
                },
                {
                    top: endCoords.top + length * (1 - 0.70) + "px",
                    left: endCoords.left + "px",
                    animationTimingFunction: "ease-in",
                    offset: 11 / 13
                },
                {
                    top: endCoords.top + "px",
                    left: endCoords.left + "px",
                    animationTimingFunction: "ease-out",
                    offset: 1
                },
            ],
            fallingTime
        );

        const animationEltImg = animationEltContainer.querySelector("img");
        animationEltImg.animate(
            [
                {
                    aspectRatio: 1,
                    animationTimingFunction: "ease-out",
                    offset: 10 / 13,
                },
                {
                    aspectRatio: 1 / 0.7,
                    animationTimingFunction: "ease-in",
                    offset: 11 / 13
                },
                {
                    aspectRatio: 1,
                    animationTimingFunction: "ease-out",
                    offset: 1
                },
            ],
            fallingTime
        );

        await sleep(fallingTime);

        if (changeBoard) { this.setToken(end, { playerIndex: playerIndex }) };
    }


    /**
    * Returns all the new lines that were created in Connect Plus' board
    * @param {?Coords} coords If you're trying to find lines that include a point
    * @param {Number} minimumLength The mininum number of tokens in a row you care about
    * @return {Line[]}
    */
    findNewLines(coords, minimumLength) {
        /**
         * @type {Line[]}
         */
        const lines = [];

        /*
            If the line neccessarily includes a given pair of coordinates, test every
            direction from that pair of coordinates.

            Otherwise, test every cell in the board in the positive sense for every orientation.
        */

        if (coords instanceof Coords) {

            for (let orientation of Object.values(Orientation)) {
                const line = new Line(this, coords, orientation);
                line.extend([true, false]);
                if (line.length >= minimumLength) {
                    lines.push(line);
                }
            }

        } else {

            for (let orientation of Object.values(Orientation)) {
                for (let x = 0; x < this.width - (minimumLength - 1) * orientation.x; x++) {

                    // If the orientation is horizontal, this code tests a line on the right
                    // of a cell in the first column, then the second column, and so forth
                    // However, it is unnessary to check every column because, 
                    // in the rightmost column, the maximum length of a line starting at it
                    //  could be 1 because there are no cells on its right
                    const highestCellToTest = Math.max(0, (minimumLength - 1) * -orientation.y);
                    const lowestCellToTest = this.height - (minimumLength - 1) * Math.max(0, orientation.y);
                    for (let y = highestCellToTest; y < lowestCellToTest; y++) {
                        const line = new Line(this, new Coords(x, y), orientation);
                        line.extend([true]);
                        if (line.length >= minimumLength) {
                            lines.push(line);
                        }
                    }
                }
            }

        }

        return lines;
    }

    /**
     * Calculates all the places a player can place a token on the board
     * @returns {[Coords]} in order from middle to ends of board for the Bot
     */
    calculateAvailableMoves() {
        const availableMoves = [];

        for (let i = 0; i < this.width; i++) {
            // start from middle (left if two middles) and every second iteration go left or right 
            const sense = i % 2 === 0;
            // credit for the following line of code https://stackoverflow.com/a/6838067
            const x = (this.width / 2 >> 0) + (sense ? i / 2 : -(i / 2 + 1 / 2));

            // see how far down a coordinate falls from above the board 
            // and ensure that it actually falls down
            const move = new Coords(x, -1).applyGravity(GravityDirection.DOWN, this);
            if (move.y != -1) {
                availableMoves.push(move);
            }
        }
        return availableMoves;
    }
}

