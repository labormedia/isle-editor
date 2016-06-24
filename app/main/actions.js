// MODULES //

import { dialog, ipcMain, BrowserWindow } from 'electron';
import fs from 'fs-plus';
import { extname, basename } from 'path';
import { EXTENSIONS } from './../constants/globals';
import createWindow from './createWindow';


// MAIN PROCESS //

ipcMain.on( 'save-file', ( e, { data, filePath }) => {
	fs.writeFile( filePath, data, 'utf-8', ( err ) => {
		if ( err ) {
			return;
		}
	});
});

ipcMain.on( 'ISLE::dropped-file', ( e, { filePath }) => {
	openFile( filePath, BrowserWindow.fromWebContents( e.sender ) );
});

function openFile( filePath, browserWindow ) {
	if (
		EXTENSIONS.indexOf( extname( filePath ).slice( 1 ).toLowerCase() ) !== -1 ||
		!extname( filePath )
	) {
		const fileSize = fs.getSizeSync( filePath );
		if ( fileSize >= 1048576 ) { // 1MB
			const confirm = dialog.showMessageBox( browserWindow, {
				type: 'error',
				title: 'Unsupported File',
				message: 'You are trying to load a large file, ISLE Editor will be unresponsive',
				detail: 'Do you still want to load this file?',
				buttons: [ 'Proceed', 'Cancel' ]
			});
			if ( confirm === 1 ) return;
		}
		fs.readFile( filePath, 'utf-8', ( err ) => {
			if ( err ) return;
			createWindow( filePath );
		});
		return;
	}
	dialog.showMessageBox( browserWindow, {
		type: 'error',
		title: 'Unsupported File',
		message: 'You are trying to load a not supported file',
		detail: 'The supported file extensions are \n\n' + EXTENSIONS.join( ' ,' ),
		buttons: [ 'Ok' ]
	});
}

ipcMain.on( 'save-file-as', ( e, { data }) => {
	dialog.showSaveDialog({}, ( filePath ) => {
		if ( filePath ) {
			fs.writeFile( filePath, data, 'utf-8', ( err ) => {
				if ( err ) {
					return;
				}
				BrowserWindow.fromWebContents( e.sender ).setTitle( `ISLE -- ${filePath}` );
				e.sender.send( 'ISLE::file-loaded', {
					fileName: basename( filePath ),
					filePath,
					file: data
				});
			});
		}
	});
});


// EXPORTS //

export function open({ browserWindow }) {
	dialog.showOpenDialog( browserWindow, {
		properties: [ 'openFile' ]
	}, ( fileNames ) => {
		if ( fileNames === undefined ) {
			return;
		}
		openFile( fileNames[ 0 ], browserWindow );
	});
}

export function save({ browserWindow }) {
	browserWindow.webContents.send( 'save-file' );
}

export function saveAs({ browserWindow }) {
	browserWindow.webContents.send( 'save-file-as' );
}

export function newFile() {
	createWindow();
}