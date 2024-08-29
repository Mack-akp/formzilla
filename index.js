"use strict";

const { DiscStorage } = require("./DiscStorage");
const { StreamStorage } = require("./StreamStorage");
const { FieldParserWithSchema } = require("./FieldParserWithSchema");
const { FieldParserNoSchema } = require("./FieldParserNoSchema");
const busboy = require("busboy");
const { finished } = require("stream");
const fs = require("fs/promises");
const appendField  = require("./append-field");

const cleanRequestFiles = async (paths) => {
	if (!paths) {
		return
	}
	for (let i = 0; i < paths.length; ++i) {
		const filepath = paths[i]
		try {
			await fs.rm(filepath, { force: true })
		} catch (error) {
			/* istanbul ignore next */
			console.log("Error",error)
		}
	}
}

const formDataParser = async (instance, options) => {
	const { limits, storage = new StreamStorage() } = options;
	instance.decorateRequest('cleanRequestFiles', cleanRequestFiles)
	instance.addContentTypeParser("multipart/form-data", (request, message, done) => {
		const results = [];
		const body = Object.create(null);
		const props = request.routeOptions.schema?.body?.properties;
		const parser = props ? new FieldParserWithSchema(props) : new FieldParserNoSchema();
		const bus = busboy({ headers: message.headers, limits, defParamCharset: "utf8" });
		bus.on("file", (name, stream, info) => {
			results.push(storage.process(name, stream, info));
		});
		bus.on("field", (name, value) => {
			appendField(body, name, parser.parseField(name, value));
		});
		finished(bus, (err = null) => {
			Promise.all(results).then(files => {
				request.__files__ = files;
				done(err, JSON.parse(JSON.stringify(body)));
			});
		});
		message.pipe(bus);
	});
	instance.addHook("preHandler", async request => {
		const files = request.__files__;
		if (files?.length) {
			request.tmpUploads = [];
			const fileFields = Object.assign({}, request.body);
			for (const file of files) {
				const field = file.field;
				const fileProp = fileFields[field];
				if(storage instanceof DiscStorage) {
					request.tmpUploads.push(file.path)
				}
				if(!fileProp) {
					appendField(fileFields, field, file);
					continue;
				}
				if (Array.isArray(fileProp)) {
					fileProp.push(file);
					continue;
				}
				fileFields[field] = [fileProp, file];
			}
			Object.assign(request.body, fileFields);
		}
		request.__files__ = undefined;
	});

	instance.addHook('onResponse', async (request, reply) => {
		if(!storage.isPersist) {
			await request.cleanRequestFiles(request.tmpUploads)
		}
	})
};
formDataParser[Symbol.for("skip-override")] = true;

exports.default = formDataParser;