export class BasicIter {
	constructor(changeFunc = pos => pos, length = 0, history = new Map()) {
		this.data = {
			changeFunc,
			length,
			history,
			current: 0
		}
	}

	length = this.data.length;

	getPos(pos) {
		if (this.length <= pos)
			throw "Out of range";

		let value = this.data.history.get(pos);
		if (value === undefined) {
			value = this.data.changeFunc(pos);
			this.data.history.set(pos, JSON.parse(JSON.stringify(value)));
		}

		return value;
	}

	next() {
		let done = false;
		let pos = this.data.current;

		if (this.length > this.data.current + 1)
			this.data.current += 1;
		else
			done = true;

		return {
			done,
			value: this.getPos(pos)
		}
	}

	[Symbol.iterator] = function () {
		return new BasicIter(this.data.changeFunc, this.data.length, this.data.history);
	}
}

export default {
	BasicIter
}