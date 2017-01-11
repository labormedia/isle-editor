// MODULES //

import React, { Component, PropTypes } from 'react';
import Dimensions from 'components/dimensions';
import { Table, Column, Cell } from 'fixed-data-table';
import { Button, Modal } from 'react-bootstrap';
import DOMPurify from 'dompurify';
import request from 'request';
import Spinner from 'components/spinner';
import floor from '@stdlib/math/base/special/floor';
import isArray from '@stdlib/utils/is-array';


// CONSTANTS //

import { OPEN_CPU_DEFAULT_SERVER, OPEN_CPU_IDENTITY } from 'constants/opencpu.js';
const ERR_REGEX = /\nIn call:[\s\S]*$/gm;
const STDOUT_REGEX = /stdout/;


// FUNCTIONS //

const showResult = ( res ) => {
	if ( res ) {
		let sanitized = {
			__html: DOMPurify.sanitize( res )
		};
		return <pre id="output"><span dangerouslySetInnerHTML={sanitized} /></pre>;
	} else {
		return <span />;
	}
};

const requireLibs = ( libs ) => {
	return libs.map( x => 'library(' + x + ');' )
		.join( ' ' );
};


// R OUTPUT //

class ROutput extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			result: null,
			running: false,
			last: ''
		};

		this.getResult = ( nextProps ) => {
			let code;
			if ( nextProps ) {
				code = nextProps.code;
			} else {
				code = this.props.code;
			}
			if ( code !== this.state.last ) {
				this.setState({
					last: this.props.code,
					running: true
				});

				const OPEN_CPU = global.ISLE.rshell && global.ISLE.rshell.server ?
					global.ISLE.rshell.server :
					OPEN_CPU_DEFAULT_SERVER;

				let fullCode = '';
				let libs = this.props.libraries;
				let globalCode = '';
				if ( ISLE.rshell ) {
					if ( ISLE.rshell.libraries ) {
						libs = libs.concat( ISLE.rshell.libraries );
					}
					if ( ISLE.rshell.global ) {
						globalCode = ISLE.rshell.global + '\n';
					}
				}
				let prependCode = isArray( this.props.prependCode ) ?
					this.props.prependCode.join( '\n' ) :
					this.props.prependCode;
				prependCode += '\n';

				fullCode = requireLibs( libs ) + globalCode + prependCode + code;

				request.post( OPEN_CPU + OPEN_CPU_IDENTITY, {
					form: {
						x: fullCode
					}
				}, ( error, response, body ) => {
					if ( !error ) {
						const arr = body.split( '\n' );
						for ( let i = 0; i < arr.length; i++ ) {
							let elem = arr[ i ];
							if ( STDOUT_REGEX.test( elem ) === true ) {
								request.get( OPEN_CPU + elem, ( err, getResponse, getBody ) => {
									this.setState({
										result: getBody,
										running: false
									});
								});
								break;
							}
						}
					} else {
						this.setState({
							result: body.replace( ERR_REGEX, '' ),
							running: false
						});
					}
				});
			}
		};
	}

	componentDidMount() {
		this.getResult( this.props );
	}

	componentWillReceiveProps( props ) {
		this.getResult( props );
	}

	render() {
		return (
			<span className="ROutput">
				{ this.state.result ?
					<div
						style={{
							marginLeft: 'auto',
							marginRight: 'auto',
							marginTop: '10px',
							marginBottom: '10px'
						}}
					>
						<Spinner
							width={128}
							height={64}
							style={{
								marginTop: '8px',
								marginBottom: '-12px'
							}}
							running={this.state.running}
						/>
						{ !this.state.running ?
							showResult( this.state.result ) :
							<span />
						}
					</div> :
					<span />
				}
			</span>
		);
	}
}


// PROPERTY TYPES //

ROutput.propTypes = {
	code: PropTypes.string,
	libraries: PropTypes.array,
	prependCode: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.array
	])
};


// DEFAULT PROPERTIES //

ROutput.defaultProps = {
	code: '',
	libraries: [],
	prependCode: ''
};


// EXPORTS //

export default ROutput;
