// Sets up Vue

let app;
function ensureVueLoaded() {
	if (!(app instanceof Vue)) {
		const screens = Object.freeze({
			MENU_SCREEN: Symbol("Menu screen"),
			CONFIGURATION: Symbol("Configuration"),
			BOARD: Symbol("Board"),
			TICTACTOE: Symbol("Tic-tac-toe"),
			PONG: Symbol("Pong")
		});

		function initialVueState() {
			return {
				/**
				 * @type {Game}
				 */
				game: null,
				GameSaver: GameSaver,
				Coords: Coords,
				highlightedColumn: null,
				/**
				 * the player may change what column they're hovering over before
				 * the animation is complete and it is their turn. since the current board
				 * and thus the available moves is unknown at this time, there is an array
				 * of integers of columns that are candicates to be the highlighted column
				 * when the player is allowed to move
				 * @type {Number[]} 
				 */
				highlightedColumnCandicates: [],
				latestPlayerMove: null,
				availableMoves: [],
				isPlayerMoving: false,

				tokenToRemove: null,
				highlightedToken: null,
				activePowerupSlot: null,

				botDifficulty: "Medium",
				width: 7,
				height: 6,
				arePowerupsEnabledString: "On",
				winningLengthString: "4",
				player1: "You",
				isSinglePlayer: false,

				screens: screens,
				screen: screens.MENU_SCREEN,
				isOverlayActive: false,

				winner: null,
			};
		}

		app = new Vue({
			el: "#app",
			data: initialVueState(),
			computed: {
				arePowerupsEnabled() {
					return this.arePowerupsEnabledString === "On";
				},
				winningLength() {
					return parseInt(this.winningLengthString);
				},
				isPowerupActive() {
					return this.activePowerupSlot !== null;
				},
				gameResult() {
					switch (this.winner) {
						case -1: return "Draw"
						case null: return null
						default: return `Player ${this.winner + 1} has won`
					}
				},
				gameResultStyle() {
					switch (this.winner) {
						case 0: return "color: rgb(134, 210, 255);"
						case 1: return "color: rgb(255, 134, 134);"
						default: return ""
					}
				}
			},
			methods: {
				/**
				 * Creates and starts a new game of Connect Plus
				 * @param {Boolean} loadFromStorage 
				 */
				startGame: async function (loadFromStorage) {
					if (this.game instanceof Game) {
						this.game.cancelled = true;
					}

					if (loadFromStorage === true) {
						this.game = GameSaver.load();
					} else {
						let players = [];

						if (!this.isSinglePlayer) {
							players = [new LocalPlayer(), new LocalPlayer()];
						} else {
							this.arePowerupsEnabledString = "Off";
							const bot = this.botDifficulty === "Medium" ? new MinimaxBot() : new RandomBot();
							if (this.player1 === "Bot") {
								players = [bot, new LocalPlayer()];
							} else {
								players = [new LocalPlayer(), bot];
							}
						}

						this.game = new Game(players, parseInt(this.width), parseInt(this.height), {
							winningLength: this.winningLength,
							arePowerupsEnabled: this.arePowerupsEnabled,

							debug: false
						});
					}

					this.screen = this.screens.BOARD;

					await Vue.nextTick();

					const winner = await this.game.start();
					if (winner !== Game.GAME_CANCELLED_FLAG) {
						this.winner = winner;

						await sleep(1500);
						this.isOverlayActive = true;
					}
				},
				/**
				 * 
				 * @param {Number} x cell's x-coordinate
				 * @param {Number} y cell's y-coordinate
				 */
				clickCell: function (x, y) {
					if (this.game.config.debug && y !== -1) {
						// if debug mode is activated

						// Cycles through the player who owns a given token
						const coords = new Coords(x, y);
						const currentPlayerIndex = this.game.board.getToken(coords)?.playerIndex;

						let newToken;
						if (currentPlayerIndex === undefined) {
							newToken = { playerIndex: 0 };
						} else if (currentPlayerIndex === 0) {
							newToken = { playerIndex: 1 };
						} else {
							newToken = null;
						}

						this.game.board.setToken(coords, newToken);
					} else if (this.isPowerupActive) {
						// if the player is removing a token
						const coords = new Coords(x, y);
						if (this.game.board.getToken(coords) !== null) {
							this.tokenToRemove = coords;
						}
					} else if (this.isColumnValid(x)) {
						// Tells LocalPlayer class that the player wants to move in a particular column
						this.latestPlayerMove = x;
					}
				},
				/**
				 * When the user's mouse enters a cell
				 * @param {Number} x
				 * @param {Number} y
				 */
				enterCell: function (x, y) {
					if (this.isPowerupActive) {
						const coords = new Coords(x, y);
						if (this.game.board.getToken(coords) !== null) {
							this.highlightedToken = coords;
						}
					} else {
						if (this.isColumnValid(x)) {
							this.highlightedColumn = x;
						} else if (this.isPlayerMoving === false) {
							// if it already exists within the array remove it, because its pushed to the end
							// and the elements at the end of the array have greater priority
							this.highlightedColumnCandicates = this.highlightedColumnCandicates.filter(
								col => col !== x
							);
							this.highlightedColumnCandicates.push(x);
						}
					}
				},
				/**
				 * When the user's mouse leaves a cell
				 * @param {Number} x
				 * @param {Number} y
				 */
				leaveCell: function (x, y) {
					if (this.isPowerupActive) {
						this.highlightedToken = null;
					} else {
						if (this.isColumnValid(x)) {
							this.highlightedColumn = null;
							this.highlightedColumnCandicates = [];
						}
					}
				},
				/**
				 * 
				 * @param {Number} x the column's index
				 * @returns {Boolean} whether placing a token in that column is a legal placement
				 */
				isColumnValid: function (x) {
					return this.availableMoves.some(coords => coords.x === x);
				},
				/**
				 * @param {Number} playerIndex integer between 0 and number of game.players
				 * @param {Number} powerupIndex integer between 0 and the number of the 
				 * player's powerups
				 */
				clickPowerup: function (playerIndex, powerupIndex) {
					if ((this.isPlayerMoving && this.game.activePlayerIndex !== playerIndex)
						|| !this.game.canNextMoveBePowerup) {
						return;
					}

					if (powerupIndex === this.activePowerupSlot) {
						this.activePowerupSlot = null;
					} else {
						this.highlightedColumn = null;
						this.latestPlayerMove = null;
						this.activePowerupSlot = powerupIndex;
					}
				},
				/**
				 * @param {Number} x
				 * @param {Number} y
				 * @returns {Boolean} whether the cell at the given coords is currently hovered over
				 */
				isHovered: function (x, y) {
					return x === this.highlightedToken?.x && y === this.highlightedToken?.y;
				},
				/**
				 * Returns to menu screen and resets the configuation
				 */
				resetGame: function (x, y) {
					Object.assign(this.$data, initialVueState());
				},
				/**
				 * Opens a given minigame ready for the players
				 * @param {Screen} screen 
				 */
				openMinigame: async function (screen) {
					this.screen = screen;
					// wait for it to open, then focus the minigame so that, for pong,
					// the iframe can listen to the user input
					await Vue.nextTick();
					document.getElementsByTagName('iframe')[0].focus();
				},
				/**
				 * Resets the temporary values that allow the user to 
				 * make their move and display on hover
				 */
				clearMoveData: function () {
					this.isPlayerMoving = false;
					this.availableMoves = [];
					this.highlightedColumn = null;
					this.tokenToRemove = null;
					this.activePowerupSlot = null;
					this.latestPlayerMove = null;
					this.highlightedToken = null;
				},
				/**
				 * Executes when the configuration form is filled out correctly
				 * @param {Event} event 
				 */
				formComplete: function (event) {
					this.startGame(false);
					event.preventDefault();
				}
			}
		});
	}

	window.onmessage = function (event) {
		if (event.data?.sender === "minigame") {
			app.winner = event.data.winner;
			app.isOverlayActive = true;
		}
	};
}
