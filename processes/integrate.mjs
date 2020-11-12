import {BasicIter} from "../util/interator.mjs";

export function basicIntegration(line = [0]) {
	const integrate = pos => {
		if (pos === 0)
			return 0;

		return line.get(pos) - line.get(pos - 1);
	};

	return new BasicIter({
		changeFunc: integrate,
		length: line.length
	});
}

export default {
	basicIntegration,
};