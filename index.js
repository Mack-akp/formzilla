"use strict";

import { StreamStorage } from './StreamStorage.js';
import { FieldParserWithSchema } from './FieldParserWithSchema.js';
import { FieldParserNoSchema } from './FieldParserNoSchema.js';
import busboy from "busboy";
// import Busboy from "@fastify/busboy";
import { finished } from "stream";
import appendField from "append-field";

const formDataParser = async (instance, options) => {
	const { limits, storage = new StreamStorage() } = options;
	instance.addContentTypeParser("multipart/form-data", (request, message, done) => {
		const results = [];
		const body = {};
		const props = request.routeOptions.schema?.body?.properties;
		const parser = props ? new FieldParserWithSchema(props) : new FieldParserNoSchema();
		const bus = busboy({ headers: message.headers, limits, defParamCharset: "utf8" });
		bus.on("file", (name, stream, info) => {
			results.push(storage.process(name, stream, info));
			// const fileProp = body[name]
			// if(!fileProp) {
			// 	appendField(body, name, JSON.stringify(info));
			// 	return;
			// }
			// if (Array.isArray(fileProp)) {
			// 	fileProp.push(JSON.stringify(info));
			// 	return;
			// }
			// body[name] = [fileProp, JSON.stringify(info)]
		});
		bus.on("field", (name, value) => {
			appendField(body, name, parser.parseField(name, value));
		});
		finished(bus, (err = null) => {
			Promise.all(results).then(files => {
				request.__files__ = files;
				done(err, body);
			});
		});
		message.pipe(bus);
	});
	instance.addHook("preHandler", async request => {
		const files = request.__files__;
		if (files?.length) {
			const fileFields = {};
			for (const file of files) {
				const field = file.field;
				delete file.field;
				const fileProp = fileFields[field]
				if(!fileProp) {
					appendField(fileFields, field, file);
					continue;
				}
				if (Array.isArray(fileProp)) {
					fileProp.push(file);
					continue;
				}
				fileFields[field] = [fileProp, file]
			}
			Object.assign(request.body, fileFields);
		}
		delete request.__files__;
	});
};

formDataParser[Symbol.for("skip-override")] = true;

export default formDataParser;