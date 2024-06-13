"use strict";

import { FileInternal } from "./FileInternal.js";
import { finished } from "stream";
import path from "path";
import os from "os";
import * as fs from "fs";

export class DiscStorage {
	target;
	constructor(target) {
		this.target = target;
	}
	process(name, stream, info) {
		const target = this.target;
		const file = new FileInternal(name, info);
		const saveLocation = typeof target === "function" ? target(file) : target;

		console.log("disc", file)

		const filePath = path.join(saveLocation?.directory ?? os.tmpdir(), saveLocation?.fileName ?? file.originalName);
		const fileStream = fs.createWriteStream(filePath);
		return new Promise(resolve => {
			finished(stream, err => {
				file.error = err;
				file.path = filePath;
				resolve(file);
			});
			stream.pipe(fileStream);
		});
	}
}