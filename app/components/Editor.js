// MODULES //

import React, { Component } from 'react';
import ReactDom from 'react-dom';
import PropTypes from 'prop-types';
import ace from 'brace';
import 'brace/mode/html';
import 'brace/theme/github';
import 'brace/ext/searchbox';
import 'brace/ext/language_tools';
import aceSnippets from './../snippets';
import { noop } from '@stdlib/utils/noop';


// CONSTANTS //

const NO_ATTRIBUTE_WARNING_REGEXP = /Unexpected character in unquoted attribute/;
const NO_DOCTYPE_REGEXP = /doctype first\. Expected/;


// VARIABLES //

const langTools = ace.acequire( 'ace/ext/language_tools' );

const customCompleter = {
	getCompletions( editor, session, pos, prefix, callback ) {
		if ( prefix.length === 0 ) {
			callback( null, []);
			return;
		}

		callback( null, [
			// { name: 'Markdown', value: '<md></md>', score: 1, meta: 'Markdown' }
		]);
	}
};


// MAIN //

class Editor extends Component {

	constructor( props ) {
		super( props );

		this.onChange = () => {
			this.props.onChange( this.editor.getValue() );
		};
	}

	componentDidMount() {
		langTools.addCompleter( customCompleter );

		this.editor = ace.edit( ReactDom.findDOMNode( this ) );
		this.editor.$blockScrolling = Infinity;

		const session = this.editor.getSession();
		session.setMode( 'ace/mode/html' );
		session.setUseWrapMode( true );
		this.editor.setTheme( 'ace/theme/github' );

		const currentFontSize = parseFloat( localStorage.getItem( 'fontSize' ) ) || 14;
		this.editor.setFontSize( currentFontSize );

		// Add event listener:
		this.editor.on( 'change', this.onChange );

		this.editor.setValue( this.props.value, this.props.cursorStart );

		this.editor.setOptions({
			maxLines: 5000,
			minLines: 50,
			enableBasicAutocompletion: true,
			enableSnippets: true,
			enableLiveAutocompletion: true,
			highlightActiveLine: true
		});

		this.editor.setShowPrintMargin( false );
		this.editor.setAutoScrollEditorIntoView( true );
		this.editor.focus();

		aceSnippets( ace, this.editor );
		this.interval = setInterval( () => this.editor.resize(), 100 );

		// Handle unwanted annotations and remove them:
		session.on( 'changeAnnotation', () => {
			const annotations = session.getAnnotations() || [];
			const len = annotations.length;
			let i = len;
			while ( i-- ) {
				if ( NO_DOCTYPE_REGEXP.test( annotations[ i ].text ) ||
					NO_ATTRIBUTE_WARNING_REGEXP.test( annotations[ i ].text )
				) {
					annotations.splice( i, 1 );
				}
			}
			if ( len > annotations.length ) {
				session.setAnnotations( annotations );
			}
		});
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.editor && this.editor.getValue() !== nextProps.value ) {
			const pos = this.editor.getCursorPosition();
			this.editor.setValue( nextProps.value, nextProps.cursorStart );
			this.editor.moveCursorToPosition( pos );
		}
	}

	componentWillUnmount() {
		this.editor.destroy();
		this.editor = null;
		clearInterval( this.interval );
	}

	render() {
		return (
			<div
				ref="editorWindow"
				onChange={this.onChange}
				style={{
					'height': '100%',
					'width': '100%',
				}}
			/>
		);
	}
}


// DEFAULT PROPERTIES //

Editor.defaultProps = {
	onChange: noop,
	value: '',
	cursorStart: 1
};


// PROPERTY TYPES //

Editor.propTypes = {
	onChange: PropTypes.func,
	value: PropTypes.string,
	cursorStart: PropTypes.number
};


// EXPORTS //

export default Editor;
