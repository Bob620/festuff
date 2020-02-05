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

export default {
	basicIntegration
};