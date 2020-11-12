import {BasicIter} from "../util/interator.mjs";

export function reverse(line = [0]) {
	const reverse = pos => line.get(line.length - (pos + 1));

	return new BasicIter({
		changeFunc: reverse.bind(undefined),
		length: line.length
	})
}

export default reverse;