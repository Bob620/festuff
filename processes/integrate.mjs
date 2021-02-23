import constants from '../constants.json';

import {BasicIter} from '../util/interator.mjs';

export function basicIntegration(line = [0]) {
	const integrate = pos => {
		if (pos === 0)
			return 0;

		return line.get(pos) - line.get(pos - 1);
	};

	return {
		iter: new BasicIter({
			changeFunc: integrate,
			length: line.length
		}), type: constants.operations.integrateBasic
	};
}

export default {
	basicIntegration
};