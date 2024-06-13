"use strict";

import { FileInternal } from "./FileInternal.js";
import { PassThrough, finished } from "stream";

export class StreamStorage {
	process(name, stream, info) {
		const file = new FileInternal(name, info);
		const delegateStream = new PassThrough();
		return new Promise(resolve => {
			finished(stream, err => {
				file.error = err;
				file.stream = delegateStream;
				resolve(file);
			});
			stream.on("data", chunk => delegateStream.push(chunk));
		});
	}
}