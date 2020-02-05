export class History {
	constructor(maxLength, prev, offset = 0) {
		this.data = {
			prev: prev ? prev : new Map(),
			offset,
			maxLength,
			maxIndex: 0
		}
	}

	get maxLength() {
		return this.data.maxLength - this.data.offset;
	}

	get length() {
		return (this.data.prev.data ? this.data.prev.length - this.data.offset : this.data.maxIndex + 1);
	}

	slice(start = 0) {
		return new History(this.data.maxLength, this.data.prev, this.data.offset + start);
	}

	add(index, value) {
		const offsetIndex = parseInt(index) + this.data.offset;
		this.data.prev.set(offsetIndex, value);

		if (this.data.prev.data) {
			if (this.data.prev.data.maxIndex < offsetIndex)
				this.data.prev.data.maxIndex = offsetIndex;
		} else if (this.data.maxIndex < offsetIndex)
			this.data.maxIndex = offsetIndex;
	}

	get(index) {
		const offsetIndex = parseInt(index) + this.data.offset;
		return this.data.prev.get(offsetIndex);
	}
}

/*
 * This is a dangerous construct as it allows modifying different histories. Might come in handy somewhere, idk
 * Implements the same interface(minus Map stuff) as History but works across multiple Histories
 */
export class MultiHistory {
	constructor(histories) {
		this.data = {
			maxIndex: 0,
			histories
		}
	}

	get maxLength() {
		return this.data.histories.reduce((len, hist) => len + hist.maxLength, 0);
	}

	get length() {
		return this.data.histories.reduce((len, hist) => len + hist.length, 0);
	}

	slice(start = 0) {
		return new History(this.data.prev, start);
	}

	add(index, value) {
		const offsetIndex = parseInt(index);
		const [hist, inset] = this.selectHistory(offsetIndex);
		if (hist)
			hist.add(offsetIndex - inset, value);
	}

	get(index) {
		const offsetIndex = parseInt(index);
		const [hist, inset] = this.selectHistory(offsetIndex);
		if (hist)
			return hist.get(offsetIndex - inset);
		return undefined;
	}

	selectHistory(index) {
		let inset = 0;
		for (const hist of this.data.histories)
			if (inset + hist.maxLength > index)
				return [hist, inset];
			else
				inset += hist.maxLength;
	}
}

export default {
	History,
	MultiHistory
}