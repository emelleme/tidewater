// Cloudflare Pages limits for a static deploy: 25 MiB per asset, 20,000 files per site.
// Runs at the end of `npm run build`; also checks the Pages-only files made it into the build.
//
// Usage: node tools/check-pages-limits.mjs [dist]

import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[ 2 ] || new URL( '../dist', import.meta.url ).pathname;
const MAX_FILE = 25 * 1024 * 1024;
const MAX_FILES = 20000;
const REQUIRED = [ 'index.html', '_headers' ];

if ( ! fs.existsSync( DIST ) ) {

	console.error( 'pages-limits: no build at ' + DIST + ' (run npm run build)' );
	process.exit( 1 );

}

const files = [];
const walk = ( dir ) => {

	for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {

		const file = path.join( dir, entry.name );
		if ( entry.isDirectory() ) walk( file );
		else files.push( { name: path.relative( DIST, file ), size: fs.statSync( file ).size } );

	}

};
walk( DIST );

let failed = false;

for ( const name of REQUIRED ) {

	if ( ! fs.existsSync( path.join( DIST, name ) ) ) {

		console.error( 'pages-limits: ' + name + ' is missing from the build' );
		failed = true;

	}

}

files.sort( ( a, b ) => b.size - a.size );
const total = files.reduce( ( n, f ) => n + f.size, 0 );
console.log( files.length + ' files, ' + ( total / 1e6 ).toFixed( 1 ) + ' MB total' );
for ( const f of files.slice( 0, 5 ) ) console.log( '  ' + ( f.size / 1e6 ).toFixed( 2 ) + ' MB  ' + f.name );

if ( files.length > MAX_FILES ) {

	console.error( 'pages-limits: ' + files.length + ' files, over the Cloudflare Pages limit of ' + MAX_FILES );
	failed = true;

}

for ( const f of files ) if ( f.size > MAX_FILE ) {

	console.error( 'pages-limits: ' + f.name + ' is ' + ( f.size / 1e6 ).toFixed( 1 ) + ' MB, over the Cloudflare Pages limit of 25 MiB per file' );
	failed = true;

}

if ( failed ) process.exit( 1 );
console.log( 'pages-limits: within the Cloudflare Pages limits' );
