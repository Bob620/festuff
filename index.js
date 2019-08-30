const fsPromise = require('fs').promises;

//fe range: 1020 - 1200 (qlw)
//fe peak range: 1070 - 1150
const input = '//EPMA-NAS/data/Noah/SXES_Fe/2019-08-13/fe_stuff/qlw_test.xes';
const output = '//EPMA-NAS/data/Noah/SXES_Fe/2019-08-13/fe_stuff/qlw_test.data';

// Things interacting at the very high/low parts of the range will make interference
//   May break everything (More likely on low end than high, or if partially within captured range)

fsPromise.readFile(input, {encoding: 'utf8'}).then(async rawData => {
	const lines = JSON.parse(rawData).map(({name, flags, spectra}) => {
		return {
			name,
			spectra,
			flags,
			line: spectra.slice(1020, 1200).reverse()
		}
	});

	const integratedLines = lines.map(({name, flags, spectra, line}) => {
			return {
				integratedLine: line.reduce(([integrated, last], current) => {
					integrated.push(current - last);
					return [integrated, current];
				}, [[], line[0]])[0],
				line,
				name,
				flags,
				spectra
			}
		}
	);

	const basisLines = integratedLines.map(({integratedLine, line, name, flags, spectra}) =>
		integratedLine.reduce((highs, current, index) => {
			if (highs.alphaPeak.passedZero !== 2) {
				if (highs.alphaPeak.start === -1)
					highs.alphaPeak.start = index;
				if (highs.alphaPeak.value < Math.abs(current)) {
					highs.alphaPeak.value = Math.abs(current);
					highs.alphaPeak.index = index;
				} else if (highs.alphaPeak.passedZero === 0) {
					if (current < 0) {
						highs.alphaPeak.passedZero++;
						highs.alphaPeak.zeros.push(index);
					}
				} else if (highs.alphaPeak.passedZero === 1) {
					if (current > 0) {
						highs.alphaPeak.passedZero++;
						highs.alphaPeak.zeros.push(index);
						highs.alphaPeak.end = index;
					}
				}
			} else if (highs.betaPeak.passedZero !== 2) {
				if (highs.betaPeak.start === -1)
					highs.betaPeak.start = index;
				if (highs.betaPeak.value < Math.abs(current)) {
					highs.betaPeak.value = Math.abs(current);
					highs.betaPeak.index = index;
				} else if (highs.betaPeak.passedZero === 0) {
					if (current < 0) {
						highs.betaPeak.passedZero++;
						highs.betaPeak.zeros.push(index);
					}
				} else if (highs.betaPeak.passedZero === 1) {
					if (current > 0) {
						highs.betaPeak.passedZero++;
						highs.betaPeak.zeros.push(index);
						highs.betaPeak.end = index;
					}
				}
			} else if (index < ((integratedLine.length / 8) * 5)) {
				highs.alphaPeak = highs.betaPeak;
				highs.betaPeak = {value: 0, start: -1, index: 0, end: -1, passedZero: 0, zeros: []};
			}
			return highs;
		}, {alphaPeak: {value: 0, start: -1, index: 0, end: -1, passedZero: 0, zeros: []}, betaPeak: {value: 0, start: -1, index: 0, end: -1, passedZero: 0, zeros: []},
			integratedLine,
			line,
			name,
			flags,
			spectra
		})
	).map(({alphaPeak, betaPeak, integratedLine, line, name, flags, spectra}) => {
		return {highs: {alphaPeak, betaPeak, lowEdge: integratedLine.slice(0, alphaPeak.start).reduce((movement, value) => {
			return movement + value;
		}, 0), highEdge: integratedLine.slice(betaPeak.end).reduce((movement, value) => {
			return movement + value;
		}, 0)},
			integratedLine,
			line,
			name,
			flags,
			spectra,
			selfPeakRatio: Math.abs(line[betaPeak.index]/line[alphaPeak.index])}
	});

	const fe0 = basisLines.filter(({flags}) => flags.includes('fe0'))[0];
	const fe2 = basisLines.filter(({flags}) => flags.includes('fe2'))[0];
	const fe3 = basisLines.filter(({flags}) => flags.includes('fe3'))[0];
	const [alphaIndex, betaIndex] = findMaxDiffsIndex(fe3.integratedLine.map((value, index) => Math.abs(value - fe2.integratedLine[index])), fe3.highs.alphaPeak.zeros[1]);
	const fe0Background = makeBackground(fe0.line, fe0.highs.alphaPeak, fe0.highs.betaPeak, fe0.highs.lowEdge, fe0.highs.highEdge);
	const maxAreaUnder = fe0.line.map((value, index) =>
		value - fe0Background(index)
	).reduce((total, current) => total + current, 0);

	const runSet = basisLines.map(({highs: {alphaPeak, betaPeak, lowEdge, highEdge}, integratedLine, line, name, flags, spectra, selfPeakRatio}) => {
		//const diffLineFe0 = fe0.highs.integratedLine.map((value, index) => Math.abs(value - integratedLine[index]));
		//const diffLineFe2 = fe2.highs.integratedLine.map((value, index) => Math.abs(value - integratedLine[index]));
		//const diffLineFe3 = fe3.highs.integratedLine.map((value, index) => Math.abs(value - integratedLine[index]));

		//const maxDiffFe0 = findMaxDiffsIndex(diffLineFe0, fe0.highs.alphaPeak.zeros[1]);
		//const maxDiffFe2 = findMaxDiffsIndex(diffLineFe2, fe2.highs.alphaPeak.zeros[1]);
		//const maxDiffFe3 = findMaxDiffsIndex(diffLineFe3, fe3.highs.alphaPeak.zeros[1]);

		const flankRatio = Math.abs(line[betaIndex]/line[alphaIndex]);

		const getPosBackground = makeBackground(line, alphaPeak, betaPeak, lowEdge, highEdge);
		const areaUnderRatio = line.map((value, index) =>
			value - getPosBackground(index)
		).reduce((total, current) => total + current, 0) / maxAreaUnder;

		return {highs: {alphaPeak, betaPeak, integratedLine, lowEdge, highEdge}, line, name, flags, spectra, ratios: {selfPeakRatio, flankRatio, areaUnderRatio}}
	});

	console.log(runSet);

	await fsPromise.writeFile(output,  JSON.stringify(runSet.map(({ratios}) => ratios)));
}).catch(err => {
	console.warn(err);
});

function makeBackground(line, alphaPeak, betaPeak, lowEdge, highEdge) {
	const func = ((line[alphaPeak.start] + lowEdge) - (line[betaPeak.end] + highEdge)) / line.length;
	return (pos) => {
		return func * pos;
	}
}

function findMaxDiffsIndex(diffLine, zeroPos) {
	return [
		diffLine.slice(0, zeroPos).reduce((highest, current, index) => {
			if (current > highest[0])
				return [current, index];
			return highest;
		}, [0, 0])[1],
		diffLine.slice(zeroPos).reduce((highest, current, index) => {
			if (current > highest[0])
				return [current, index];
			return highest;
		}, [0, 0])[1] + zeroPos
	];
}