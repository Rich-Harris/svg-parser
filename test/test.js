const fs = require('fs');
const path = require('path');
const assert = require('assert');
const svgParser = require('..');

require('source-map-support').install();

const SAMPLES = path.join(__dirname, 'samples');

describe('svg-parser', () => {
	fs.readdirSync(SAMPLES).forEach((dir) => {
		(/-SOLO$/.test(dir) ? it.only : it)(dir, () => {
			const input = fs.readFileSync(path.join(SAMPLES, dir, 'input.svg'), 'utf-8');
			const output = JSON.parse(fs.readFileSync(path.join(SAMPLES, dir, 'output.json'), 'utf-8'));

			assert.deepStrictEqual(svgParser.parse(input), output);
		});
	});

	it('errors on bad closing tags', () => {
		assert.throws(() => {
			svgParser.parse('<svg></svg');
		}, /Expected >/);

		assert.throws(() => {
			svgParser.parse('<svg></');
		}, /Unexpected end of input/);
	});

	it('reports empty input clearly', () => {
		assert.throws(() => svgParser.parse(''), /^Error: SVG input is empty$/);
		assert.throws(() => svgParser.parse(' \n\t'), /^Error: SVG input is empty$/);
	});

	it('shows the error location without directing users to the issue tracker', () => {
		assert.throws(
			() => {
				svgParser.parse('<svg< xmlns=""');
			},
			(error) => {
				assert.strictEqual(error.message, 'Expected > (0:4)\n\n<svg< xmlns=""\n    ^');
				assert.ok(!error.message.includes('github.com'));
				return true;
			},
		);
	});

	it('attaches location metadata to parser errors', () => {
		assert.throws(
			() => {
				svgParser.parse('<svg< xmlns=""');
			},
			(error) => {
				assert.strictEqual(error.line, 0);
				assert.strictEqual(error.column, 4);
				assert.strictEqual(error.snippet, '<svg< xmlns=""\n    ^');
				return true;
			},
		);
	});

	it('limits error snippets horizontally', () => {
		assert.throws(
			() => {
				svgParser.parse(`<svg ${'a'.repeat(150)}<`);
			},
			(error) => {
				const snippetLines = error.message.split('\n').slice(2);
				assert.ok(snippetLines.every((line) => line.length <= 80));
				assert.match(snippetLines[0], /^…/);
				return true;
			},
		);
	});

	it('limits error snippets vertically', () => {
		assert.throws(
			() => {
				svgParser.parse('<svg>\nfar-before\nnear-before\n<path <\nnear-after\nfar-after\n</svg>');
			},
			(error) => {
				assert.match(error.message, /\n…\nnear-before\n<path <\n      \^\nnear-after\n…$/);
				assert.ok(!error.message.includes('far-before'));
				assert.ok(!error.message.includes('far-after'));
				return true;
			},
		);
	});

	it('replace tabs with spaces to show correct position in the line', () => {
		assert.throws(() => {
			svgParser.parse('<svg>\n\t\t<path\td=" class="" />\n</svg>');
		}, /\n    <path  d=/);
	});
});
