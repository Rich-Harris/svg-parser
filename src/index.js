import { locate } from 'locate-character';

const validNameCharacters = /[a-zA-Z0-9:_-]/; // Valid characters within an XML tag's name
const validNameStartCharacters = /[a-zA-Z:_]/; // Valid starting characters for an XML tag's name
const whitespace = /[\s\t\r\n]/;
const quotemark = /['"]/;

function repeat(str, i) {
	let result = '';
	while (i--) result += str;
	return result;
}

export function parse(source) {
	let header = '';
	let stack = [];

	let state = metadata;
	let currentElement = null;
	let root = null;

	function error(message) {
		const { line, column } = locate(source, i);
		const before = source.slice(0, i);
		const beforeLine = /(^|\n).*$/.exec(before)[0].replace(/\t/g, '  ');
		const after = source.slice(i);
		const afterLine = /.*(\n|$)/.exec(after)[0];

		const snippet = `${beforeLine}${afterLine}\n${repeat(' ', beforeLine.length)}^`;

		throw new Error(
			`${message} (${line}:${column}). If this is valid SVG, it's probably a bug in svg-parser. Please raise an issue at https://github.com/Rich-Harris/svg-parser/issues – thanks!\n\n${snippet}`
		);
	}

	function metadata() {
		// Need to check for comments in the metadata section, as they can legally contain <tags>
		while (i < source.length) {
			if (source.slice(i, i+4) === '<!--') {
				// If we find a comment in the header section, copy all of it and continue processing
				let commentEnd = source.indexOf('-->', i+3);
				if (!~commentEnd) {
					error('expected -->');
				}
				header += source.slice(i, commentEnd);
				i = commentEnd;
			} else if (i < source.length-1 && source[i] === '<' && validNameStartCharacters.test(source[i+1])) {
				// If we find a valid tag (not inside a comment) then we've reached the end of the header
				break;
			}
			header += source[i++];
		}

		return neutral();
	}

	function neutral() {
		let text = '';
		while (i < source.length && source[i] !== '<') text += source[i++];

		if (/\S/.test(text)) {
			currentElement.children.push({ type: 'text', value: text });
		}

		if (source[i] === '<') {
			return tag;
		}

		return neutral;
	}

	function tag() {
		const char = source[i];

		if (char === '?') return neutral; // <?xml...

		if (char === '!') {
			if (source.slice(i + 1, i + 3) === '--') return comment;
			if (source.slice(i + 1, i + 8) === '[CDATA[') return cdata;
			if (/doctype/i.test(source.slice(i + 1, i + 8))) return neutral;
		}

		if (char === '/') return closingTag;

		const tagName = getName();

		const element = {
			type: 'element',
			tagName,
			properties: {},
			children: []
		};

		if (currentElement) {
			currentElement.children.push(element);
		} else {
			root = element;
		}

		let attribute;
		while (i < source.length && (attribute = getAttribute())) {
			element.properties[attribute.name] = attribute.value;
		}

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
			stack.push(element);
		}

		return neutral;
	}

	function comment() {
		let commentEnd = source.indexOf('-->', i);
		if (!~commentEnd) {
			error('expected -->');
		}

		let comment = {
			type: 'comment',
			value: source.slice(i+2, commentEnd)
		};

		if (currentElement) {
			currentElement.children.push(comment);
		} else {
			// Ignoring a comment that is outside an element
			// This will be handled by metadata if it's before the root element, or silently ignored if it's after
		}

		i = commentEnd + 2;
		return neutral;
	}

	function cdata() {
		const index = source.indexOf(']]>', i);
		if (!~index) error('expected ]]>');

		currentElement.children.push(source.slice(i + 7, index));

		i = index + 2;
		return neutral;
	}

	function closingTag() {
		const tagName = getName();

		if (!tagName) error('Expected tag name');

		if (tagName !== currentElement.tagName) {
			error(`Expected closing tag </${tagName}> to match opening tag <${currentElement.tagName}>`);
		}

		allowSpaces();

		if (source[i] !== '>') {
			error('Expected >');
		}

		stack.pop();
		currentElement = stack[stack.length - 1];

		return neutral;
	}

	function getName() {
		let name = '';
		while (i < source.length && validNameCharacters.test(source[i])) name += source[i++];

		return name;
	}

	function getAttribute() {
		if (!whitespace.test(source[i])) return null;
		allowSpaces();

		const name = getName();
		if (!name) return null;

		let value = true;

		allowSpaces();
		if (source[i] === '=') {
			i += 1;
			allowSpaces();

			value = getAttributeValue();
			if (!isNaN(value) && value.trim() !== '') value = +value; // TODO whitelist numeric attributes?
		}

		return { name, value };
	}

	function getAttributeValue() {
		return quotemark.test(source[i]) ? getQuotedAttributeValue() : getUnquotedAttributeValue();
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
		} while (i < source.length);

		return value;
	}

	function getQuotedAttributeValue() {
		const quotemark = source[i++];

		let value = '';
		let escaped = false;

		while (i < source.length) {
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
		while (i < source.length && whitespace.test(source[i])) i += 1;
	}

	let i = metadata.length;
	while (i < source.length) {
		if (!state) error('Unexpected character');
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
