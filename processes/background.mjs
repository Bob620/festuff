import constants from '../constants.json';

import {BasicIter} from '../util/interator.mjs';

export function linearBackground(line = [0], leftIndex = 0, rightIndex = 0) {
	if (leftIndex < 0 || rightIndex >= line.length)
		throw 'Out of range';

	if (rightIndex === 0)
		rightIndex = line.length - 1;

	const length = rightIndex - leftIndex + 1;
	const initial = Array.isArray(line) ? line[leftIndex] : line.get(leftIndex);
	const change = ((Array.isArray(line) ? line[rightIndex] : line.get(rightIndex)) - initial) / length;

	const changeFunc = pos => initial + (change * pos);

	return {
		iter: new BasicIter({
			changeFunc,
			length
		}),
		type: constants.operations.background
	};
}

export default {
	linearBackground
};