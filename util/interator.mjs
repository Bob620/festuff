import constants from '../constants.json';

import {History} from './history.mjs';
import {IterGroup} from './group.mjs';

class IterBasis {
	constructor(length, dataContext = {}) {
		dataContext.length = length;
		dataContext.current = 0;
		dataContext.operations = dataContext.operations ? dataContext.operations : [];
		dataContext.name = dataContext.name ? dataContext.name : 'iter';
		this.data = dataContext;
	}

	[Symbol.iterator] = () => {
		return this.slice();
	};

	set name(name) {
		this.data.name = 'iter ' + name;
	}

	get name() {
		return this.data.name;
	}

	get type() {
		return constants.types.iter;
	}

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

	group(...iters) {
		return new IterGroup(this, ...iters);
	}

	do(funcToRun, ...args) {
		let {iter, type} = funcToRun(this, ...args);
		iter.addOperation({
			type,
			with: args.toString()
		});

		return iter;
	}

	addOperation(operation = {
		type: '',
		with: ''
	}) {
		this.data.operations.push(operation);
	}

	add(iter) {
		let returnIter;
		if (typeof iter === 'number') {
			let returnIter = new BasicIter({
				changeFunc: pos => this.get(pos) + iter,
				length: this.length
			});

			returnIter.addOperation({
				type: constants.operations.add,
				with: 'number array'
			});
			return returnIter;
		} else
			switch(iter.type) {
				case constants.types.iter:
					returnIter = new BasicIter({
						changeFunc: pos => {
							const one = this.length > pos ? this.get(pos) : 0;
							const two = iter.length > pos ? iter.get(pos) : 0;

							return one + two;
						},
						length: this.length < iter.length ? iter.length : this.length
					});
					break;
				case constants.types.group:
					returnIter = new BasicIter({
						changeFunc: pos => {
							const one = this.length > pos ? this.get(pos) : 0;
							const two = iter.length > pos ? iter.get(pos).reduce((i, j) => i + j) : 0;

							return one + two;
						},
						length: this.length < iter.length ? iter.length : this.length
					});
					break;
			}

		returnIter.addOperation({
			type: constants.operations.add,
			with: iter.name
		});
		return returnIter;
	}

	subtract(iter) {
		let returnIter;
		if (typeof iter === 'number') {
			returnIter = new BasicIter({
				changeFunc: pos => this.get(pos) - iter,
				length: this.length
			});

			returnIter.addOperation({
				type: constants.operations.add,
				with: 'number array'
			});
			return returnIter;
		} else
			switch(iter.type) {
				case constants.types.iter:
					returnIter = new BasicIter({
						changeFunc: pos => {
							const one = this.length > pos ? this.get(pos) : 0;
							const two = iter.length > pos ? iter.get(pos) : 0;

							return one - two;
						},
						length: this.length < iter.length ? iter.length : this.length
					});
					break;
				case constants.types.group:
					returnIter = new BasicIter({
						changeFunc: pos => {
							const one = this.length > pos ? this.get(pos) : 0;
							const two = iter.length > pos ? iter.get(pos).reduce((i, j) => i + j) : 0;

							return one - two;
						},
						length: this.length < iter.length ? iter.length : this.length
					});
					break;
			}

		returnIter.addOperation({
			type: constants.operations.subtract,
			with: iter.name
		});
		return returnIter;
	}

	multiply(iter) {
		let returnIter;
		if (typeof iter === 'number') {
			returnIter = new BasicIter({
				changeFunc: pos => this.get(pos) * iter,
				length: this.length
			});

			returnIter.addOperation({
				type: constants.operations.add,
				with: 'number array'
			});
			return returnIter;
		} else
			switch(iter.type) {
				case constants.types.iter:
					returnIter = new BasicIter({
						changeFunc: pos => {
							const one = this.length > pos ? this.get(pos) : 0;
							const two = iter.length > pos ? iter.get(pos) : 0;

							return one * two;
						},
						length: this.length < iter.length ? iter.length : this.length
					});
					break;
				case constants.types.group:
					returnIter = new BasicIter({
						changeFunc: pos => {
							const one = this.length > pos ? this.get(pos) : 0;
							const two = iter.length > pos ? iter.get(pos).reduce((i, j) => i + j) : 0;

							return one * two;
						},
						length: this.length < iter.length ? iter.length : this.length
					});
					break;
			}

		returnIter.addOperation({
			type: constants.operations.multiply,
			with: iter.name
		});
		return returnIter;
	}

	divide(iter) {
		let returnIter;
		if (typeof iter === 'number') {
			returnIter = new BasicIter({
				changeFunc: pos => this.get(pos) / iter,
				length: this.length
			});

			returnIter.addOperation({
				type: constants.operations.add,
				with: 'number array'
			});
			return returnIter;
		} else
			switch(iter.type) {
				case constants.types.iter:
					returnIter = new BasicIter({
						changeFunc: pos => {
							const one = this.length > pos ? this.get(pos) : 0;
							const two = iter.length > pos ? iter.get(pos) : 0;

							return one / two;
						},
						length: this.length < iter.length ? iter.length : this.length
					});
					break;
				case constants.types.group:
					returnIter = new BasicIter({
						changeFunc: pos => {
							const one = this.length > pos ? this.get(pos) : 0;
							const two = iter.length > pos ? iter.get(pos).reduce((i, j) => i + j) : 0;

							return one / two;
						},
						length: this.length < iter.length ? iter.length : this.length
					});
					break;
			}

		returnIter.addOperation({
			type: constants.operations.divide,
			with: iter.name
		});
		return returnIter;
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

	toString() {
		return this.name;
	}

	copy() {
		return new BasicIter({
			changeFunc: pos => this.getPos(pos),
			length: this.length,
			history: this.data.history
		});
	}
}

export class IterSlice extends IterBasis {
	constructor(iter, start, end) {
		super(end - start, {
			iter,
			end,
			start,
			operations: iter.operations.map(i => i)
		});

		this.addOperation({
			type: constants.operations.slice,
			with: [start, end]
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
			current: 0,
			operations: [{
				type: constants.operations.concat,
				with: iters.toString()
			}]
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