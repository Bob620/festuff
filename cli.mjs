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

import commandJson from './commands.json';
import constants from './constants.json';
import optionsJson from './options.json';

import {ArrayIter} from "./util/interator.mjs";

let env = {};

const args = process.argv.slice(2);

args.reduce(([commands, last], item) => {
	let data = undefined;

	if (last) {

	} else if (item.startsWith('-')) {
		const name = item.slice(1);
		const type = commandJson[name];

		if (type === undefined)
			throw `Unknown command '${name}'`;

		data = {
			name,
			type,
			validArgs: type.arguments.map(e => e.name),
			args: {}
		};
	} else
		throw `Unknown argument '${item}'`;

	return [commands, data];
}, [[], undefined]);

console.log();
