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
import {gaussianFit} from './processes/peakfit.mjs';
import sxes from 'sxes-compressor';
import {ArrayIter} from './util/interator.mjs';
import {linearBackground} from './processes/background.mjs';
import {cubicSplineInterpolation, linearInterpolation} from './processes/interpolation.mjs';
import {savitzkyGolay} from './processes/smooth.mjs';
import {basicIntegration} from './processes/integrate.mjs';
import {csvExport} from './util/csv.mjs';

const allToFull = Object.entries(commandJson).reduce((full, [command, {short}]) => {
	full[short] = command;
	full[command] = command;
	return full;
}, {});

let args = process.argv.slice(2);
args = args.filter(arg => arg !== '""' && arg.length > 0)

const commands = args.reduce(([commands, last], item) => {
	let data = undefined;

	if (last !== undefined) {
		if (last.argument.startsWith)
			if (!item.startsWith(last.argument.startsWith))
				item = item + last.argument.startsWith;

		if (last.argument.endsWith)
			if (!item.endsWith(last.argument.endsWith))
				item = item + last.argument.endsWith;

		last.argument = item;
		commands.push(last);
	} else if (item.startsWith('-')) {
		const [name, ...attached] = item.slice(1).split(':');
		let type = commandJson[allToFull[name]];

		if (type === undefined && typeof type !== 'object')
			throw `Unknown argument '${name}' with attached arguments '${attached.join(':')}'`;

		if (type.minAttached > attached.length)
			throw `Not enough attached arguments on '${name}:${attached.join(':')}'`;

		let parsedAttached = type.attached.map(({type, default: defaultValue}, index) => sanitizeValue(attached[index], type, defaultValue));
		if (type.attachedRest)
			parsedAttached.push(attached.slice(type.attached.length).map(value => sanitizeValue(value, type.attachedRest.type)));

		data = {
			name,
			calls: type.calls,
			argument: type.argument,
			attached: parsedAttached
		};
	} else
		throw `Unknown argument '${item}'`;

	return [commands, data];
}, [[], undefined])[0];

function sanitizeValue(value, type, defaultValue) {
	if (value !== undefined)
		switch(type) {
			case 'bool':
				return value === 'true';
			case 'string':
				return value;
			case 'number':
				return value.includes('.') ? parseFloat(value) : parseInt(value);
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
	switch(command.calls) {
		case 'add':
			env.specs[command.argument] = env.specs[command.attached[0]].add(env.specs[command.attached[1]] === undefined ? parseFloat(command.attached[1]) : env.specs[command.attached[1]]);
			break;
		case 'calculateBackground':
			env.specs[command.argument] = linearBackground(env.specs[command.attached[0]], command.attached[1][0], command.attached[1][1]);
			break;
		case 'csv':
			let specs = [];
			for (const specName of command.attached[0])
				specs.push({specName, spec: env.specs[specName], frontPad: 0});
			await csvExport(specs, command.argument);
			break;
		case 'cubicSplineInterpolation':
			env.specs[command.argument] = cubicSplineInterpolation(env.specs[command.attached[0]], command.attached[1]);
			break;
		case 'divide':
			env.specs[command.argument] = env.specs[command.attached[0]].divide(env.specs[command.attached[1]] === undefined ? parseFloat(command.attached[1]) : env.specs[command.attached[1]]);
			break;
		case 'gaussian':
			env.output[command.argument] = gaussianFit(env.specs[command.attached[0]]);
			break;
		case 'integrate':
			env.specs[command.argument] = basicIntegration(env.specs[command.attached[0]]);
			break;
		case 'subtract':
			env.specs[command.argument] = env.specs[command.attached[0]].subtract(env.specs[command.attached[1]] === undefined ? parseFloat(command.attached[1]) : env.specs[command.attached[1]]);
			break;
		case 'linearInterpolation':
			env.specs[command.argument] = linearInterpolation(env.specs[command.attached[0]], command.attached[1]);
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
		case 'multiply':
			env.specs[command.argument] = env.specs[command.attached[0]].multiply(env.specs[command.attached[1]] === undefined ? parseFloat(command.attached[1]) : env.specs[command.attached[1]]);
			break;
		case 'savitzkyGolay':
			env.specs[command.argument] = savitzkyGolay(env.specs[command.attached[0]], command.attached[1][0], command.attached[1][1], {windowSize: command.attached[2]});
			break;
	}

	return env;
}, constants.defaultCommandEnv).then(finalEnv => {
	console.log(finalEnv);
});


