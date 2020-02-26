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
import commandFuncs from './commands.mjs';

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

console.log(commands);

const finalEnv = commands.reduce((env, command) => {
	switch (command.calls) {
		case 'loadSpec':
			env.specs[command.attached[0]] = commandFuncs.loadSpec(command.argument);
			break;
		case 'makeSlice':
			env.specs[command.argument] = commandFuncs.makeSlice(env.specs[command.attached[0]], command.attached[1]);
			break;
	}

	return env;
}, constants.defaultCommandEnv);

console.log(finalEnv);

