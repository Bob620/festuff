import constants from '../constants.json';

import {BasicIter, IterSlice, MultiIter} from './interator.mjs';

export class IterGroup {
	constructor(...iters) {
		this.data = {
			length: 0,
			current: 0,
			iters: []
		};

		for (const iter of iters) {
			switch(iter.type) {
				case constants.types.iter:
					this.data.iters.push(iter.copy());
					break;
				case constants.types.group:
					for (const it of iter.data.iters) {
						this.data.iters.push(it.copy());
					}
					break;
			}
		}
	}

	[Symbol.iterator] = () => {
		return this.slice();
	};

	get type() {
		return constants.types.group;
	}

	get length() {
		return this.data.length;
	}

	slice(start = 0, end = this.data.length) {
		let iters = this.data.iters.map(iter => new IterSlice(iter, start, end));
		return new IterGroup(...iters);
	}

	concat(...others) {
		let iters = [];
		if (others.length === 1 || others[0].type === constants.types.group) {
			for (const other of others) {
				switch(other.type) {
					case constants.types.iter:
						iters.push(this.data.iters.map(iter => new MultiIter(iter, other)));
						break;
					case constants.types.group:
						iters.push(this.data.iters.map(iter => new MultiIter(iter, ...other.data.iters)));
						break;
				}
			}
		} else {
			iters = this.data.iters.map((iter, i) => new MultiIter(iter, ...others[0].data.iters[i]));
		}

		return new IterGroup(...iters);
	}

	get(pos) {
		return this.getPos(pos);
	}

	getOr(pos, defaultValue = 0) {
		return this.data.iters.map(iter => {
			try {
				return iter.getPos(pos);
			} catch(e) {
				return defaultValue;
			}
		});
	}

	getPos(pos) {
		return this.data.iters.map(iter => iter.getPos(pos));
	}

	group(...iters) {
		return new IterGroup(this, ...iters);
	}

	do(funcToRun, ...args) {
		let iters = this.data.iters.map(iter => funcToRun(iter, ...args));
		return new IterGroup(...iters);
	}

	add(iter) {
		let iters = [];
		switch(iter.type) {
			case constants.types.iter:
				iters = this.data.iters.map(internalIter => {
					return internalIter.add(iter);
				});
				break;
			case constants.types.group:
				iters = this.data.iters.map((internalIter, i) => {
					return internalIter.add(iter.data.iters[i]);
				});
				break;
		}

		return new IterGroup(...iters);
	}

	subtract(iter) {
		let iters = [];
		switch(iter.type) {
			case constants.types.iter:
				iters = this.data.iters.map(internalIter => {
					return internalIter.subtract(iter);
				});
				break;
			case constants.types.group:
				iters = this.data.iters.map((internalIter, i) => {
					return internalIter.subtract(iter.data.iters[i]);
				});
				break;
		}

		return new IterGroup(...iters);
	}

	multiply(iter) {
		let iters = [];
		switch(iter.type) {
			case constants.types.iter:
				iters = this.data.iters.map(internalIter => {
					return internalIter.multiply(iter);
				});
				break;
			case constants.types.group:
				iters = this.data.iters.map((internalIter, i) => {
					return internalIter.multiply(iter.data.iters[i]);
				});
				break;
		}

		return new IterGroup(...iters);
	}

	divide(iter) {
		let iters = [];
		switch(iter.type) {
			case constants.types.iter:
				iters = this.data.iters.map(internalIter => {
					return internalIter.divide(iter);
				});
				break;
			case constants.types.group:
				iters = this.data.iters.map((internalIter, i) => {
					return internalIter.divide(iter.data.iters[i]);
				});
				break;
		}

		return new IterGroup(...iters);
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
		for (const values of this)
			arr.push(values);

		return arr;
	}

	toString() {
		return `[${this.data.iters.map(i => i.name)}]`;
	}
}

export default {
	IterGroup
};