import {History} from './history.mjs';

class IterBasis {
	constructor(length, dataContext = {}) {
		dataContext.length = length;
		dataContext.current = 0;
		this.data = dataContext;
	}

	[Symbol.iterator] = () => {
		return this.slice();
	};

	get length() {
		return this.data.length;
	}

	slice(start = 0, end = this.data.length) {
		return new IterSlice(this, start, end);
	}

	concat(...others) {
		return new MultiIter(this, ...others);
	}

	get(pos) {
		return this.getPos(pos);
	}

	getOr(pos, defaultValue = 0) {
		try {
			return this.getPos(pos);
		} catch(e) {
			return defaultValue;
		}
	}

	getPos(pos) {
		return this.data[pos];
	}

	add(iter) {
		if (typeof iter === 'number')
			return new BasicIter({
				changeFunc: pos => this.get(pos) + iter,
				length: this.length
			});
		else
			return new BasicIter({
				changeFunc: pos => {
					const one = this.length > pos ? this.get(pos) : 0;
					const two = iter.length > pos ? iter.get(pos) : 0;

					return one + two;
				},
				length: this.length < iter.length ? iter.length : this.length
			});
	}

	subtract(iter) {
		if (typeof iter === 'number')
			return new BasicIter({
				changeFunc: pos => this.get(pos) - iter,
				length: this.length
			});
		else
			return new BasicIter({
				changeFunc: pos => {
					const one = this.length > pos ? this.get(pos) : 0;
					const two = iter.length > pos ? iter.get(pos) : 0;

					return one - two;
				},
				length: this.length < iter.length ? iter.length : this.length
			});
	}

	multiply(iter) {
		if (typeof iter === 'number')
			return new BasicIter({
				changeFunc: pos => this.get(pos) * iter,
				length: this.length
			});
		else
			return new BasicIter({
				changeFunc: pos => {
					const one = this.length > pos ? this.get(pos) : 0;
					const two = iter.length > pos ? iter.get(pos) : 0;

					return one * two;
				},
				length: this.length < iter.length ? iter.length : this.length
			});
	}

	divide(iter) {
		if (typeof iter === 'number')
			return new BasicIter({
				changeFunc: pos => this.get(pos) / iter,
				length: this.length
			});
		else
			return new BasicIter({
				changeFunc: pos => {
					const one = this.length > pos ? this.get(pos) : 0;
					const two = iter.length > pos ? iter.get(pos) : 1;

					return one / two;
				},
				length: this.length < iter.length ? iter.length : this.length
			});
	}

	next() {
		let done = false;
		let pos = this.data.current;

		if (this.length >= this.data.current + 1)
			this.data.current += 1;
		else
			done = true;

		return {
			done,
			value: done ? undefined : this.getPos(pos)
		};
	}

	toArray() {
		let arr = [];
		for (const value of this)
			arr.push(value);

		return arr;
	}
}

export class IterSlice extends IterBasis {
	constructor(iter, start, end) {
		super(end - start, {
			iter,
			end,
			start
		});
	}

	getPos(pos) {
		const offsetIndex = parseInt(pos) + this.data.start;

		if (offsetIndex < this.data.end)
			return this.data.iter.getPos(offsetIndex);
	}
}

export class BasicIter extends IterBasis {
	constructor({changeFunc = pos => pos, length = 0, history = new History(length)} = {}) {
		super(length, {
			changeFunc,
			history,
			current: 0
		});
	}

	getPos(pos) {
		if (this.length <= pos)
			throw 'Out of range';

		let value = this.data.history.get(pos);
		if (value === undefined) {
			value = this.data.changeFunc(pos, this.data.history.add.bind(this.data.history));
			this.data.history.add(pos, value);
		}

		return JSON.parse(JSON.stringify(value));
	}
}

export class MultiIter extends IterBasis {
	constructor(...iters) {
		const length = iters.reduce((t, i) => t + i.length, 0);

		super(length, {
			iters,
			length,
			current: 0
		});
	}

	getPos(pos) {
		if (this.length <= pos)
			throw 'Out of range';

		const [iter, inset] = this.selectIter(pos);
		return iter.getPos(pos - inset);
	}

	selectIter(index) {
		let inset = 0;
		for (const iter of this.data.iters)
			if (inset + iter.length > index)
				return [iter, inset];
			else
				inset += iter.length;
	}
}

export class ArrayIter extends BasicIter {
	constructor(arr = [0]) {
		const hist = new History(arr.length);
		for (const index in arr)
			hist.add(index, arr[index]);

		super({
			length: hist.length,
			history: hist
		});
	}
}

export default {
	BasicIter,
	ArrayIter,
	MultiIter
};