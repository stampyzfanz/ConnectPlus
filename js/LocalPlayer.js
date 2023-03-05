class LocalPlayer extends Player {
    async move(_board, availableMoves) {
        const inventoryWrapper = document.querySelector(".inventoryBorder");
        app.availableMoves = availableMoves;

        for (let col of app.highlightedColumnCandicates.reverse()) {
            if (app.isColumnValid(col)) {
                app.highlightedColumn = col;
                break;
            }
        }

        app.highlightedColumnCandicates = [];

        app.isPlayerMoving = true;

        let moveType = null;
        let column = null;
        let coords = null;

        let isValid = false;
        do {
            await waitForEvent(inventoryWrapper, "click");
            if (app.latestPlayerMove !== null) {
                moveType = MoveTypes.TOKEN_PLACEMENT
                column = app.latestPlayerMove;

                isValid = app.isColumnValid(column);
            } else {
                moveType = MoveTypes.TOKEN_REMOVAL;
                coords = app.tokenToRemove;

                isValid = coords !== null;
            }
        } while (!isValid);

        app.highlightedColumnCandicates = [app.highlightedColumn];
        app.clearMoveData();


        if (moveType === MoveTypes.TOKEN_PLACEMENT) {
            return {
                moveType,
                column
            };
        } else {
            return {
                moveType,
                coords
            };
        }
    }
}