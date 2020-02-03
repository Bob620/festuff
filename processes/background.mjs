import {BasicIter} from '../util/interator.mjs';

export function linearBackground(leftIndex = 0, rightIndex = 0, line = [0]) {
	if (leftIndex < 0 || rightIndex >= line.length)
		throw "Out of range";

	const length = rightIndex - leftIndex;
	const initial = line[leftIndex];
	const change = (line[rightIndex] - initial) / length;

	const changeFunc = (change, initial, current) => initial + (change * current);

	return new BasicIter(changeFunc.bind(undefined, change, initial), length);
}

export default {
	linearBackground
};