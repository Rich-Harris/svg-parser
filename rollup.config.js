import buble from 'rollup-plugin-buble';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
	entry: 'src/index.js',
	moduleName: 'svgParser',
	plugins: [
		nodeResolve(),
		buble({ include: 'src/**' })
	],
	targets: [
		{ format: 'es', dest: 'dist/svg-parser.es.js' },
		{ format: 'umd', dest: 'dist/svg-parser.umd.js' }
	]
};
