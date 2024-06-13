"use strict";

import setupMultifile from "./setup-multifile.js";
import test from "ava";
import { Readable } from 'stream';

test("should allow multiple files in one field", async t => {
	const instance = (await import('fastify')).fastify();
	t.teardown(async () => {
		await instance.close();
	});
	try {
		instance.addHook("onResponse", async (request, reply) => {
			const requestBody = request.body;
			t.true(Array.isArray(requestBody.files));
			t.true(requestBody.files[0].stream instanceof Readable);
			t.true(requestBody.files[1].stream instanceof Readable);
			t.is(reply.statusCode, 200);
		});
		await setupMultifile(instance);
	} catch (err) {
		t.fail(err.message);
	}
});