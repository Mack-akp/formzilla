"use strict";

export class CallbackStorage {
	callback;
	constructor(callback) {
		this.callback = callback;
	}
	process(name, stream, info) {
		return this.callback(name, stream, info);
	}
}