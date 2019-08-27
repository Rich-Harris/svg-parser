const toSpaces = tabs => repeat('  ', tabs.length);

function locate(source, i) {
	const lines = source.split('\n');
	const nLines = lines.length;
	let column = i;
	let line = 0;
	for (; line < nLines; line++) {
		const { length } = lines[line];
		if (column >= length) {
			column -= length;
		} else {
			break;
		}
	}
	const before = source.slice(0, i).replace(/^\t+/, toSpaces);
	const beforeLine = /(^|\n).*$/.exec(before)[0];
	const after = source.slice(i);
	const afterLine = /.*(\n|$)/.exec(after)[0];
	const pad = repeat(' ', beforeLine.length);
	const snippet = `${beforeLine}${afterLine}\n${pad}^`;
	return { line, column, snippet };
}

const validNameCharacters = /[a-zA-Z0-9:_-]/;
const whitespace = /[\s\t\r\n]/;
const quotemarks = /['"]/;

function repeat(str, i) {
	let result = '';
	while (i--) {
		result += str;
	}
	return result;
}

export function parse(source) {
	const length = source.length;
	let currentElement = null;
	let state = metadata;
	let children = null;
	let header = '';
	let root = null;
	let stack = [];

	function error(message) {
		const { line, column, snippet } = locate(source, i);
		throw new Error(
			`${message} (${line}:${column}). If this is valid SVG, it's probably a bug in svg-parser. Please raise an issue at https://github.com/Rich-Harris/svg-parser/issues – thanks!\n\n${snippet}`
		);
	}

	function metadata() {
		let char;
		while (
			i + 1 < length &&
			((char = source[i]) !== '<' || !validNameCharacters.test(source[i + 1]))
		) {
			header += char;
			i += 1;
		}

		return neutral();
	}

	function neutral() {
		let text = '';
		let char;
		while (i < length && (char = source[i]) !== '<') {
			text += char;
			i += 1;
		}

		if (/\S/.test(text)) {
			children.push({ type: 'text', value: text });
		}

		if (source[i] === '<') {
			return openingTag;
		}

		return neutral;
	}

	function openingTag() {
		const char = source[i];

		if (char === '?') {
			// <?xml...
			return neutral;
		}

		if (char === '!') {
			const start = i + 1;
			if (source.slice(start, i + 3) === '--') {
				return comment;
			}
			const end = i + 8;
			if (source.slice(start, end) === '[CDATA[') {
				return cdata;
			}
			if (/doctype/i.test(source.slice(start, end))) {
				return neutral;
			}
		}

		if (char === '/') {
			return closingTag;
		}

		const tagName = getName();
		const properties = {};
		const element = {
			type: 'element',
			tagName,
			properties,
			children: []
		};

		if (currentElement) {
			children.push(element);
		} else {
			root = element;
		}

		getAttributes(properties);

		let selfClosing = false;

		if (source[i] === '/') {
			i += 1;
			selfClosing = true;
		}

		if (source[i] !== '>') {
			error('Expected >');
		}

		if (!selfClosing) {
			currentElement = element;
			children = element.children;
			stack.push(element);
		}

		return neutral;
	}

	function comment() {
		const index = source.indexOf('-->', i);
		if (!~index) {
			error('expected -->');
		}

		i = index + 2;
		return neutral;
	}

	function cdata() {
		const index = source.indexOf(']]>', i);
		if (!~index) {
			error('expected ]]>');
		}
		children.push(source.slice(i + 7, index));

		i = index + 2;
		return neutral;
	}

	function closingTag() {
		const tagName = getName();

		if (!tagName) {
			error('Expected tag name');
		}

		if (tagName !== currentElement.tagName) {
			error(`Expected closing tag </${tagName}> to match opening tag <${currentElement.tagName}>`);
		}

		if (source[i] !== '>') {
			error('Expected >');
		}

		stack.pop();
		currentElement = stack[stack.length - 1];
		if (currentElement) {
			children = currentElement.children;
		}

		return neutral;
	}

	function getName() {
		let name = '';
		let char;
		while (i < length && validNameCharacters.test((char = source[i]))) {
			name += char;
			i += 1;
		}

		return name;
	}

	function getAttributes(properties) {
		while (i < length) {
			if (!whitespace.test(source[i])) {
				return;
			}
			allowSpaces();

			const name = getName();
			if (!name) {
				return;
			}

			let value = true;

			allowSpaces();
			if (source[i] === '=') {
				i += 1;
				allowSpaces();

				value = getAttributeValue();
				if (!isNaN(value) && value.trim() !== '') {
					value = +value; // TODO whitelist numeric attributes?
				}
			}

			properties[name] = value;
		}
	}

	function getAttributeValue() {
		return quotemarks.test(source[i]) ? getQuotedAttributeValue() : getUnquotedAttributeValue();
	}

	function getUnquotedAttributeValue() {
		let value = '';
		do {
			const char = source[i];
			if (char === ' ' || char === '>' || char === '/') {
				return value;
			}

			value += char;
			i += 1;
		} while (i < length);

		return value;
	}

	function getQuotedAttributeValue() {
		const quotemark = source[i++];

		let value = '';
		let escaped = false;

		while (i < length) {
			const char = source[i++];
			if (char === quotemark && !escaped) {
				return value;
			}

			if (char === '\\' && !escaped) {
				escaped = true;
			}

			value += escaped ? `\\${char}` : char;
			escaped = false;
		}
	}

	function allowSpaces() {
		while (i < length && whitespace.test(source[i])) {
			i += 1;
		}
	}

	let i = 0;
	while (i < length) {
		if (!state) {
			error('Unexpected character');
		}
		state = state();
		i += 1;
	}

	if (state !== neutral) {
		error('Unexpected end of input');
	}

	if (root.tagName === 'svg') root.metadata = header;
	return {
		type: 'root',
		children: [root]
	};
}
