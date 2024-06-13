"use strict";

import formDataParser from "../index.js";
import formData from "form-data";
import path from "path";
import * as fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requestSchema = {
	consumes: ["multipart/form-data"],
	body: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			age: {
				type: "integer"
			},
			avatar: {
				type: "string",
				format: "binary"
			},
			address: {
				type: "object",
				properties: {
					id: { type: "string" },
					street: { type: "string" }
				},
				required: ["id", "street"]
			}
		}
	}
};
export default async (instance, options = undefined, includeSchema = true) => {
	instance.register(formDataParser, options);
	instance.post(
		"/",
		{
			schema: includeSchema && requestSchema
		},
		async (request, reply) => {
			reply.status(200).send();
		}
	);
	await instance.listen({ port: 0, host: "::" });
	const form = new formData();
	form.append("name", "Jane Doe");
	form.append("avatar", fs.createReadStream(path.join(__dirname, "chequer.png")));
	form.append("age", 31);
	form.append(
		"address",
		JSON.stringify({
			id: "316 A",
			street: "First Street"
		})
	);
	return await instance.inject({
		protocol: "http:",
		hostname: "localhost",
		port: instance.server.address().port,
		path: "/",
		headers: form.getHeaders(),
		method: "POST",
		payload: form
	});
};