/**
 * This chooses a random valid move
 * 
 * @implements {Player}
 */

class RandomBot extends Player {
    async move(_board, availableMoves) {
        await sleep(300);
        const index = [Math.floor(Math.random() * availableMoves.length)];
        return {
            moveType: MoveTypes.TOKEN_PLACEMENT,
            column: availableMoves[index].x
        };
    }
}

