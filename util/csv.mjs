import fs from 'fs/promises';

export async function csvExport(specs = [{specName: '', spec: [0]}], uri, {includeName = true, zeroFill = false} = {}) {
	let lines = [[]];
	let length = specs.reduce((longest, {spec}) => spec.length > longest ? spec.length : longest, 0);

	if (includeName)
		for (const {specName} of specs)
			lines[0].push(specName);

	for (let i = 0; i < length + 7; i += 8) {
		lines[1 + i] = [];
		lines[1 + i + 1] = [];
		lines[1 + i + 2] = [];
		lines[1 + i + 3] = [];
		lines[1 + i + 4] = [];
		lines[1 + i + 5] = [];
		lines[1 + i + 6] = [];
		lines[1 + i + 7] = [];

		for (const {spec, frontPad} of specs) {
			if (frontPad < i) {
				const pos = (i - frontPad);

				lines[1 + i].push(spec.getOr(pos, ''));
				lines[1 + i + 1].push(spec.getOr(pos + 1, ''));
				lines[1 + i + 2].push(spec.getOr(pos + 2, ''));
				lines[1 + i + 3].push(spec.getOr(pos + 3, ''));
				lines[1 + i + 4].push(spec.getOr(pos + 4, ''));
				lines[1 + i + 5].push(spec.getOr(pos + 5, ''));
				lines[1 + i + 6].push(spec.getOr(pos + 6, ''));
				lines[1 + i + 7].push(spec.getOr(pos + 7, ''));
			} else {
				const pos = (i - frontPad);

				lines[1 + i].push(pos >= 0 ? spec.getOr(pos, '') : 0);
				lines[1 + i + 1].push(pos + 1 >= 0 ? spec.getOr(pos + 1, '') : 0);
				lines[1 + i + 2].push(pos + 2 >= 0 ? spec.getOr(pos + 2, '') : 0);
				lines[1 + i + 3].push(pos + 3 >= 0 ? spec.getOr(pos + 3, '') : 0);
				lines[1 + i + 4].push(pos + 4 >= 0 ? spec.getOr(pos + 4, '') : 0);
				lines[1 + i + 5].push(pos + 5 >= 0 ? spec.getOr(pos + 5, '') : 0);
				lines[1 + i + 6].push(pos + 6 >= 0 ? spec.getOr(pos + 6, '') : 0);
				lines[1 + i + 7].push(pos + 7 >= 0 ? spec.getOr(pos + 7, '') : 0);
			}
		}
	}

	fs.writeFile(uri, lines.map(data => data.join(',')).join('\n'));
}

export default {
	csvExport
};
