const { SxesGroup } = require('sxes-compressor');
const gaussianFit = require('gaussian-fit');

//fe range: 1020 - 1200 (qlw)
//fe peak range: 1070 - 1150
const feLineStart = 1020;
const feLineEnd = 1200;

const input = '//EPMA-NAS/data/Noah/SXES_Fe/2019-08-13/fe_stuff/fe_stuff.plzip';

const group = new SxesGroup(input);

group.initialize(false).then(async group => {
	const positions = Array.from(group.getPositions().values());
	const commentPos = await Promise.all(positions.map(async pos => [await pos.getComment(), pos]));

	const fe0 = commentPos.filter(([comment]) => comment.startsWith('FeMetal')).map(([, pos]) => pos);
	const fe2 = commentPos.filter(([comment]) => comment.startsWith('Almandine')).map(([, pos]) => pos);
	const fe3 = commentPos.filter(([comment]) => comment.startsWith('Andradite')).map(([, pos]) => pos);

	console.log(`Loaded ${positions.length} spectra.`);
	console.log(`Extracted ${fe0.length} fe0, ${fe2.length} fe2, ${fe3.length} fe3 reference spectra`);

	const integration = await Promise.all(positions.map(async pos => {
		const rawSpectra = await pos.getType('qlw');
		let spectra = [];

		for (let i = feLineEnd; i > feLineStart; i--)
			spectra.push(await rawSpectra.get(0, i));

		const integration = spectra.reduce(([integrated, last], current) => {
			integrated.push(current - last);
			return [integrated, current];
		}, [[], spectra[0]])[0];

		return {integration, spectra, pos};
	}));

	console.log('Finished');
});

/*
// Things interacting at the very high/low parts of the range will make interference
//   May break everything (More likely on low end than high, or if partially within captured range)

fsPromise.readFile(input, {encoding: 'utf8'}).then(async rawData => {
	const lines = JSON.parse(rawData).map(({name, flags, spectra}) => {
		return {
			name,
			spectra,
			flags,
			line: spectra.slice(feLineStart, feLineEnd).reverse()
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
				highs.alphaPeak.start = highs.alphaPeak.start - (highs.alphaPeak.start < 20 ? highs.alphaPeak.start - 1 : 17);
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
	}).map(({highs: {alphaPeak, betaPeak, lowEdge, highEdge}, integratedLine, line, name, flags, spectra, selfPeakRatio}) => {
		const getPosBackground = makeBackground(line, alphaPeak, betaPeak, lowEdge, highEdge);
		const backgroundCorrectedLine = line.map((value, index) =>
			value - getPosBackground(index)
		);

		const alphaFits = gaussianFit(backgroundCorrectedLine.slice(alphaPeak.start, alphaPeak.end), {components: [{weight: 1, mean: 1, variance: 1}],
			maxNumber: 200,
			maxIterations: 1000,
			tolerance: 1e-9
		});
		const betaFits = gaussianFit(backgroundCorrectedLine.slice(betaPeak.start, betaPeak.end), {components: [{weight: 1, mean: 1, variance: 1}],
			maxNumber: 200,
			maxIterations: 1000,
			tolerance: 1e-9
		});

		alphaPeak.fwhm = Math.sqrt(alphaFits[0].variance) * 2.3548;
		betaPeak.fwhm = Math.sqrt(betaFits[0].variance) * 2.3548;
		alphaPeak.gausPeak = alphaPeak.start + (alphaPeak.end - alphaPeak.start) * alphaFits[0].mean;
		betaPeak.gausPeak = betaPeak.start + (betaPeak.end - betaPeak.start) * betaFits[0].mean;

		return {highs: {alphaPeak, betaPeak, lowEdge, highEdge}, integratedLine, line, backgroundCorrectedLine, name, flags, spectra, selfPeakRatio};
	});

	const fe0 = basisLines.filter(({flags}) => flags.includes('fe0'))[0];
	const fe2 = basisLines.filter(({flags}) => flags.includes('fe2'))[0];
	const fe3 = basisLines.filter(({flags}) => flags.includes('fe3'))[0];
	const [alphaIndex, betaIndex] = findMaxDiffsIndex(fe3.integratedLine.map((value, index) => Math.abs(value - fe2.integratedLine[index])), fe3.highs.alphaPeak.zeros[1]);
	const fe0Background = makeBackground(fe0.line, fe0.highs.alphaPeak, fe0.highs.betaPeak, fe0.highs.lowEdge, fe0.highs.highEdge);
	const maxAreaUnder = fe0.line.map((value, index) =>
		value - fe0Background(index)
	).reduce((total, current) => total + current, 0);

	const runSet = basisLines.map(({highs: {alphaPeak, betaPeak, lowEdge, highEdge}, integratedLine, line, backgroundCorrectedLine, name, flags, spectra, selfPeakRatio}) => {
		const flankRatio = Math.abs(line[betaIndex]/line[alphaIndex]);

		const getPosBackground = makeBackground(line, alphaPeak, betaPeak, lowEdge, highEdge);
		const areaUnderRatio = line.map((value, index) =>
			value - getPosBackground(index)
		).reduce((total, current) => total + current, 0) / maxAreaUnder;

		return {
			highs: {
				alphaPeak,
				betaPeak,
				integratedLine,
				lowEdge,
				highEdge
			},
			line,
			backgroundCorrectedLine,
			name,
			flags,
			spectra,
			ratios: {
				selfPeakRatio,
				flankRatio,
				areaUnderRatio,
				fwhmRatio: betaPeak.fwhm/alphaPeak.fwhm,
				centerRatio: betaPeak.gausPeak/alphaPeak.gausPeak
			}
		}
	});

	console.log(runSet);

	await fsPromise.writeFile(output,  JSON.stringify(runSet));
}).catch(err => {
	console.warn(err);
});

function makeBackground(line, alphaPeak, betaPeak, lowEdge, highEdge) {
	const lowPoint = line[alphaPeak.start] + lowEdge;
	const highPoint = line[betaPeak.end] + highEdge;
	const posChange = (highPoint - lowPoint) / line.length;
	return (pos) => lowPoint + (posChange * pos);
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
*/