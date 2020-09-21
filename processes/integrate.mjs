import {BasicIter} from "../util/interator.mjs";

export function basicIntegration(line = [0]) {
	const integrate = (line, pos) => {
		if (pos > 0)
			return line.get(pos) - line.get(pos - 1);
		return 0;
	};

	return new BasicIter({
		changeFunc: integrate.bind(undefined, line),
		length: line.length
	});
}

export function duelIntegration(lineOne = [0], lineTwo = [0]) {
	const integrate = (lineOne, lineTwo, pos) => {
		if (pos > 0) {
			const one = lineOne.length > pos ? lineOne.get(pos) : 0;
			const two = lineTwo.length > pos ? lineTwo.get(pos) : 0;

			return one - two;
		}
		return 0;
	};

	return new BasicIter({
		changeFunc: integrate.bind(undefined, lineOne, lineTwo),
		length: lineOne.length < lineTwo.length ? lineTwo.length : lineOne.length
	});
}

export default {
	basicIntegration,
	duelIntegration
};