"use strict";

import { FileInternal } from "./FileInternal.js";
import { finished } from "stream";

export class BufferStorage {
	process(name, stream, info) {
		const file = new FileInternal(name, info);
		const data = [];
		return new Promise(resolve => {
			finished(stream, err => {
				file.error = err;
				file.data = Buffer.concat(data);
				resolve(file);
			});
			stream.on("data", chunk => data.push(chunk));
		});
	}
}