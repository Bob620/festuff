import {BasicIter} from '../util/interator.mjs';

export function linearInterpolation(line = [0], steps = 1) {
	steps = steps + 1;
	const part = (1 / steps);
	let changeFunc;

	if (Array.isArray(line))
		changeFunc = pos => {
			const interPos = pos / steps;
			if (Math.floor(interPos) === interPos)
				return line[interPos];

			const low =  Math.floor(interPos);
			const high = Math.ceil(interPos);
			const lowValue = line[low];
			const highValue = line[high];

			return lowValue * (1 - part) + highValue * part;
		}
	else
		changeFunc = pos => {
			const interPos = pos / steps;
			if (Math.floor(interPos) === interPos)
				return line.get(interPos);

			const low =  Math.floor(interPos);
			const high = Math.ceil(interPos);
			const lowValue = line.get(low);
			const highValue = line.get(high);

			return lowValue + ((highValue - lowValue) * (interPos - low));
		}

	return new BasicIter({
		changeFunc,
		length: (line.length * (steps)) - steps
	});
}

function hermite00(cubed, squared) {
	return (2 * cubed) - (3 * squared) + 1;
}

function hermite10(cubed, squared, value) {
	return cubed - (2 * squared) + value;
}

function hermite01(cubed, squared) {
	return (-2 * cubed) + (3 * squared);
}

function hermite11(cubed, squared) {
	return cubed - squared;
}

// https://en.wikipedia.org/wiki/Spline_interpolation
// https://en.wikipedia.org/wiki/Cubic_spline
// Reimplemented a Cubic Spline with Finite Difference tangents in order to make it more efficient
export function cubicSplineInterpolation(line = [0], steps = 1) {
	steps = steps + 1;
	const stepSize = 1 / steps;
	const length = (line.length * (steps)) - steps;
	let changeFunc;

	let stepValues = [];
	for (let i = 1; i < steps; i++) {
		// move the wanted pos some value between 0 and 1 (we know its never 0 nor 1)
		const scaledWantedPos = i * stepSize;

		const scaledCubed = Math.pow(scaledWantedPos, 3);
		const scaledSquared = Math.pow(scaledWantedPos, 2);

		stepValues[i] = {
			scaledWantedPos,
			h00: hermite00(scaledCubed, scaledSquared),
			h10: hermite10(scaledCubed, scaledSquared, scaledWantedPos),
			h01: hermite01(scaledCubed, scaledSquared),
			h11: hermite11(scaledCubed, scaledSquared)
		}
	}

	if (Array.isArray(line))
		changeFunc = (pos, recordPos) => {
			// Calculate the actual position in the iterator
			const interPos = pos / steps;
			const low =  Math.floor(interPos);

			// Return the already existing known values when possible
			if (low === interPos)
				return line.get(interPos);

			const stepsIn = (interPos - low) / stepSize;

			// Calculate the low-side and grab the values for spline calculation
			const thisValue = line[low];
			const lastValue = low - 1 < 0 ? thisValue : line[low - 1];
			const nextValue = low + 1 >= line.length ? thisValue : line[low + 1]
			const nextNextValue = low + 2 >= line.length ? nextValue : line[low + 2]

			const tangent = 0.5 * ((nextValue - thisValue) + (thisValue - lastValue));
			const nextTangent = 0.5 * ((nextNextValue - nextValue) + (nextValue - thisValue));
			let thisOne;

			for (let i = 1; i < steps; i++) {
				const {scaledWantedPos, h00, h10, h01, h11} = stepValues[i];

				const output = (h00 * thisValue) + (h10 * tangent) + (h01 * nextValue) + (h11 * nextTangent);
				recordPos((low + scaledWantedPos) * steps, output);

				if (i === stepsIn)
					thisOne = output;
			}

			return thisOne;
		}
	else
		changeFunc = (pos, recordPos) => {
			// Calculate the actual position in the iterator
			const interPos = pos / steps;
			const low =  Math.floor(interPos);

			// Return the already existing known values when possible
			if (low === interPos)
				return line.get(interPos);

			const stepsIn = (interPos - low) / stepSize;

			// Calculate the low-side and grab the values for spline calculation
			const thisValue = line.get(low);
			const lastValue = line.getOr(low - 1, thisValue);
			const nextValue = line.getOr(low + 1, thisValue);
			const nextNextValue = line.getOr(low + 2, nextValue);

			const tangent = 0.5 * ((nextValue - thisValue) + (thisValue - lastValue));
			const nextTangent = 0.5 * ((nextNextValue - nextValue) + (nextValue - thisValue));
			let thisOne;

			for (let i = 1; i < steps; i++) {
				const {scaledWantedPos, h00, h10, h01, h11} = stepValues[i];

				const output = (h00 * thisValue) + (h10 * tangent) + (h01 * nextValue) + (h11 * nextTangent);
				recordPos((low + scaledWantedPos) * steps, output);

				if (i === Math.round(stepsIn))
					thisOne = output;
			}

			return thisOne;
		}

	return new BasicIter({
		changeFunc,
		length
	});
}


export default {
	linearInterpolation,
	cubicSplineInterpolation
};