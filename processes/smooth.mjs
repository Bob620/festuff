import constants from '../constants.json';

import SG from 'ml-savitzky-golay-generalized';

import {ArrayIter} from '../util/interator.mjs';

export function savitzkyGolay(line = [0], leftIndex = 0, rightIndex = 0, {
	windowSize = 9,
	derivative = 0,
	polynomial = 3
}) {
	if (leftIndex < 0 || rightIndex >= line.length)
		throw 'Out of range';

	if (rightIndex === 0)
		rightIndex = line.length;

	// Cant do it lazily without reimplementing the module :/
	//  And idk math
	return {
		iter: new ArrayIter(SG((Array.isArray(line) ? line : line.toArray()).slice(leftIndex, rightIndex), 1, {
			windowSize,
			derivative,
			polynomial
		})), type: constants.operations.smoothSavitzkyGolay
	};
}

export default {
	savitzkyGolay
};