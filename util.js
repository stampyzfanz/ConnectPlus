/*
Some small utility code
*/


/**
 * Returns whether or not every element in an array is equal
 * @returns {Boolean}
 */
Array.prototype.areEqual = function () {
	return this.every((elt, _i, arr) => elt === arr[0]);
}

// Adapted from https://stackoverflow.com/a/70789108
/**
 * 
 * @param {HTMLElement} item 
 * @param {string} event the event type {@link https://developer.mozilla.org/en-US/docs/Web/Events}
 * @returns {Promise<Void>}
 */
function waitForEvent(item, event) {
	return new Promise((resolve) => {
		const listener = () => {
			item.removeEventListener(event, listener);
			resolve();
		}
		item.addEventListener(event, listener);
	});
}

/**
 * Deep clones a non-circular object with every value being a primitive
 * @param {Object} object 
 * @returns {Object}
 */
function deepClone(object) {
	return JSON.parse(JSON.stringify(object));
}

/**
 * Returns a random element from the array
 * @returns 
 */
Array.prototype.getRandomElement = function () {
	return this[Math.floor((Math.random() * this.length))];
}

/**
 * Waits for the specified number of milliseconds
 * @param {Number} ms
 * @returns {Promise<>}
 */
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


