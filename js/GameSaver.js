class GameSaver {
    /**
     * Persistently saves the current statistics 
     */
    static save(game) {
        localStorage.setItem("serialisedGameState", this.recursiveSerialise(game));
    }

    /**
     * Clears the serialised game state from the database
     */
    static delete() {
        localStorage.removeItem("serialisedGameState");
    }

    /**
     * Loads the game from the database
     * @returns {Game}
     */
    static load() {
        console.assert(this.isGameSaved());
        const serialisedGameState = localStorage.getItem("serialisedGameState");
        const game = this.recursiveDeserialise(serialisedGameState, { Game, LocalPlayer, MinimaxBot, RandomBot, Board });

        for (let y = 0; y < game.board.height; y++) {
            game.board.cellStyles[y] = [];
            for (let x = 0; x < game.board.width; x++) {
                game.board.resetStyle(new Coords(x, y));
            }
        }

        return game;
    }

    /**
     * @returns {Boolean} whether there is a valid save game in the database
     */
    static isGameSaved() {
        const serialisedGameState = localStorage.getItem("serialisedGameState");
        return serialisedGameState !== null;
    }

    /**
     * Recursively deeply serialises any arbitrary object into a string
     * @param {object} classInstance
     * @returns {string}
     * 
     * @license https://oooops.dev/2022/09/30/serializing-and-de-serializing-es6-class-instances-recursively/
     */
    static recursiveSerialise(classInstance) {
        return JSON.stringify(classInstance, (_key, value) => {
            if (value && typeof (value) === "object" && value.constructor.name !== "Object") {
                value.__type = value.constructor.name;
            }
            return value;
        });
    }

    /**
     * @param {string} string
     * @param {Object[]} classes an array of all the custom classes that are used
     * 
     * @license https://oooops.dev/2022/09/30/serializing-and-de-serializing-es6-class-instances-recursively/
     */
    static recursiveDeserialise(string, classes) {
        return JSON.parse(string, (key, value) => {
            if (value && typeof (value) === "object" && value.__type) {
                const DynamicClass = classes[value.__type];
                value = Object.assign(Object.create(DynamicClass.prototype), value);
                delete value.__type;
            }
            return value;
        });
    }
}