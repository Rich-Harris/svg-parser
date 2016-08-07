const fs = require( 'fs' );
const path = require( 'path' );
const assert = require( 'assert' );
const svgParser = require( '..' );

const SAMPLES = path.join( __dirname, 'samples' );

describe( 'svg-parser', () => {
	fs.readdirSync( SAMPLES ).forEach( dir => {
		( /-SOLO$/.test( dir ) ? it.only : it )( dir, () => {
			const input = fs.readFileSync( path.join( SAMPLES, dir, 'input.svg' ), 'utf-8' );
			const output = JSON.parse( fs.readFileSync( path.join( SAMPLES, dir, 'output.json' ), 'utf-8' ) );

			assert.deepEqual( svgParser.parse( input ), output );
		});
	});
});
