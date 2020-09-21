// Peak Find
//  Custom Limits
// Background Interpolation and Subtraction
// Integration
// Range Subtraction/Addition
//   Max/Min/Avg
// Peak fit
//   FWHM
//   Center
// Ratios
//
// Load spec1, spec2 -> Range Subtraction -> Min/Max

import constants from './constants.json';
import commandJson from './commands.json';
import {gaussianFit} from "./processes/peakfit.mjs";
import sxes from 'sxes-compressor';
import {ArrayIter} from "./util/interator.mjs";
import {linearBackground} from "./processes/background.mjs";
import {basicIntegration, duelIntegration} from "./processes/integrate.mjs";

const allToFull = Object.entries(commandJson).reduce((full, [command, {short}]) => {
	full[short] = command;
	full[command] = command;
	return full;
}, {});

const args = process.argv.slice(2);

const commands = args.reduce(([commands, last], item) => {
	let data = undefined;

	if (last !== undefined) {
		last.argument = item;
		commands.push(last);
	} else if (item.startsWith('-')) {
		const [name, ...attached] = item.slice(1).split(':');
		let type = commandJson[allToFull[name]];

		if (type === undefined && typeof type !== "object")
			throw `Unknown argument '${name}' with attached arguments '${attached.join(':')}'`;

		if (type.minAttached > attached.length)
			throw `Not enough attached arguments on '${name}:${attached.join(':')}'`;

		data = {
			name,
			calls: type.calls,
			argument: type.argument,
			attached: type.attached.map(({type, default: defaultValue}, index) => sanitizeValue(attached[index], type, defaultValue))
		};
	} else
		throw `Unknown argument '${item}'`;

	return [commands, data];
}, [[], undefined])[0];

function sanitizeValue(value, type, defaultValue) {
	if (value !== undefined)
		switch (type) {
			case 'string':
				return value;
			case 'number':
				return parseInt(value);
			case 'range':
				if (value === '')
					return [0, 0];
				const [a, b] = value.split('-');
				return [parseInt(a), b ? parseInt(b) : 0];
		}

	return defaultValue;
}

async function reduce(arr, func, output) {
	for (const data of arr)
		output = await func(output, data);
	return output;
}

reduce(commands, async (env, command) => {
	switch (command.calls) {
		case 'background':
			env.specs[command.argument] = linearBackground(command.attached[1][0], command.attached[1][1], env.specs[command.attached[0]]);
			break;
		case 'gaussian':
			env.output[command.argument] = gaussianFit(env.specs[command.attached[0]]);
			break;
		case 'integrate':
			if (command.attached[1] === '')
				env.specs[command.argument] = basicIntegration(env.specs[command.attached[0]]);
			else
				env.specs[command.argument] = duelIntegration(env.specs[command.attached[0]], env.specs[command.attached[1]]);
			break;
		case 'loadSpec':
			if (env.sxes[command.argument] === undefined) {
				env.sxes[command.argument] = new sxes.SxesGroup(command.argument);
				await env.sxes[command.argument].initialize();
			}

			const pos = await env.sxes[command.argument].getPosition(command.attached[1]);
			const types = await pos.getTypes();
			const wantedType = command.attached[2];
			const wantedBin = command.attached[3];

			if (types.includes(wantedType)) {
				const arr = await pos.getType(wantedType);
				if (arr.bins <= wantedBin)
					throw new Error('Invalid bin');

				const bin = await arr.get(wantedBin);
				env.specs[command.attached[0]] = new ArrayIter(bin);
			} else
				throw new Error('Unable to find the requested position');
			break;
		case 'makeSlice':
			const [low, high] = command.attached[1];
			env.specs[command.argument] = env.specs[command.attached[0]].slice(low, high);
			break;
	}

	return env;
}, constants.defaultCommandEnv).then(finalEnv => {
	console.log(finalEnv);
});


