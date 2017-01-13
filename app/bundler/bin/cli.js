#!/usr/bin/env node
'use strict';

// MODULES //

const fs = require( 'fs' );
const path = require( 'path' );
const cwd = require( '@stdlib/utils/cwd' );
const parseArgs = require( 'minimist' );
const pkg = require( './../../../package.json' );
const opts = require( './opts.json' );
const main = require( './../index.js' );


// FUNCTIONS //

/**
* Performs initialization tasks.
*
* @private
* @example
* init();
*/
function init() {
	// Set the process title to allow the process to be more easily identified:
	process.title = pkg.name;
	process.stdout.on( 'error', process.exit );
} // end FUNCTION init()

/**
* Prints usage information.
*
* @private
* @example
* help();
* // => '...'
*/
function help() {
	var fpath = path.join( __dirname, 'usage.txt' );
	fs.createReadStream( fpath )
		.pipe( process.stdout )
		.on( 'close', onClose );

	function onClose() {
		process.exit( 0 );
	}
} // end FUNCTION help()

/**
* Prints the package version.
*
* @private
* @example
* version();
* // => '#.#.#'
*/
function version() {
	var msg = pkg.version.toString()+'\n';
	process.stdout.write( msg, 'utf8' );
	process.exit( 0 );
} // end FUNCTION version()

/**
* Callback invoked upon completion.
*
* @private
* @param {(Error|null)} error - error object
*/
function onFinish( error ) {
	if ( error ) {
		throw error;
	}
	console.log( 'Bundling is complete.' );
} // end FUNCTION onFinish()


// VARIABLES //

let minify = false;
let lessonContent;
let outDir;
let fpath;
let args;


// MAIN //

init();

// Parse command-line arguments:
args = parseArgs( process.argv.slice( 2 ), opts );

if ( args.help ) {
	return help();
}
if ( args.version ) {
	return version();
}
if ( args.minify ) {
	minify = true;
}

fpath = path.resolve( cwd(), args._[ 0 ]);
lessonContent = fs.readFileSync( fpath ).toString();
outDir = path.resolve( cwd(), args._[ 1 ]);


// Create ISLE bundle:
main( outDir, lessonContent, minify, onFinish );
