import {BasicIter} from "../util/interator.mjs";

export function reverse(line = []) {
	const reverse = (line, pos) => line[line.length - (pos + 1)];

	return new BasicIter(reverse.bind(undefined, JSON.parse(JSON.stringify(line))), line.length)
}

export default reverse;