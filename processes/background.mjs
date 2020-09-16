import {BasicIter} from '../util/interator.mjs';

export function linearBackground(leftIndex = 0, rightIndex = 0, line = [0]) {
	if (leftIndex < 0 || rightIndex >= line.length)
		throw "Out of range";

	if (rightIndex === 0)
		rightIndex = line.length

	const length = rightIndex - leftIndex;
	const initial = Array.isArray(line) ? line[leftIndex] : line.get(leftIndex);
	const change = ((Array.isArray(line) ? line[rightIndex] : line.get(rightIndex)) - initial) / length;

	const changeFunc = (change, initial, current) => initial + (change * current);

	return new BasicIter({
		changeFunc: changeFunc.bind(undefined, change, initial),
		length
	});
}

export default {
	linearBackground
};