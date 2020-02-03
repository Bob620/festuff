import gaussian from 'gaussian-fit';

export function gaussianFit(line = [0]) {
	gaussian(line, {
		maxIterations: 1000,
		tolerance: 1e-9,
		components: [
			{
				weight: 1,
				mean: 1,
				variance: 1
			}
		]
	})
}

export default {
	gaussianFit
};