import {BasicIter} from "../util/interator.mjs";

export function basicIntegration(line = [0]) {
	const integratedLine = line.reduce(([integrated, last], current) => {
		integrated.push(current - last);
		return [integrated, current];
	}, [[], line[0]])[0];

	return new BasicIter(e => e, integratedLine.length, integratedLine);
}

export default {
	basicIntegration
};