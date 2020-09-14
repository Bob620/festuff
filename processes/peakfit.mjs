import gaussian from 'gaussian-fit';

export function gaussianFit(line) {
	const fit = gaussian(Array.isArray(line) ? line : line.toArray(), {
		maxIterations: 1000,
		tolerance: 1e-9,
		components: [
			{
				weight: 1,
				mean: 1,
				variance: 1
			}
		]
	})[0];

	return {
		weight: fit.weight,
		variance: fit.variance,
		mean: fit.mean,
		fwhm: Math.sqrt(fit.variance) * 2.3548,
		peakIndex: line.length * fit.mean
	};
}

export default {
	gaussianFit
};