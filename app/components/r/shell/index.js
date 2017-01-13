// MODULES //

import React, { PropTypes } from 'react';
import ReactDom from 'react-dom';
import Dimensions from 'components/dimensions';
import { Button, ButtonToolbar, Modal, OverlayTrigger, Popover, Tooltip } from 'react-bootstrap';
import request from 'request';
import DOMPurify from 'dompurify';
import isArray from '@stdlib/utils/is-array';
import beforeUnload from 'utils/before-unload';
import isElectron from 'utils/is-electron';

import ace from 'brace';
import 'brace/mode/r';
import 'brace/theme/katzenmilch';
import 'brace/theme/solarized_light';

import Spinner from 'components/spinner';

// CONSTANTS //

import { OPEN_CPU_DEFAULT_SERVER, OPEN_CPU_IDENTITY } from 'constants/opencpu.js';
const GRAPHICS_REGEX = /graphics/;
const STDOUT_REGEX = /stdout/;
const ERR_REGEX = /\nIn call:[\s\S]*$/gm;
const HELP_REGEX = /(help\([^\)]*\)|\?[^\n]*)/;
const HELP_PATH_REGEX = /\/(?:site-)?library\/([^\/]*)\/help\/([^\/"]*)/;


// VARIABLES //

let counter = 0;
let rCode = [];


// FUNCTIONS //

const max = Math.max;

const calculateMargin = ( containerWidth ) => {
	let sizeType = 0;
	if ( containerWidth <= 1400 && containerWidth >= 1024 ) {
		sizeType = 1;
	}
	else if ( containerWidth < 1024 && containerWidth >= 800 ) {
		sizeType = 2;
	}
	else if ( containerWidth < 800 ) {
		sizeType = 3;
	}
	switch ( sizeType ) {
	case 0:
		return {
			width: containerWidth * 0.6,
			margin: ( containerWidth - ( containerWidth * 0.6 ) ) / 2.0
		};
	case 1:
		return {
			width: containerWidth * 0.7,
			margin: ( containerWidth - ( containerWidth * 0.7 ) ) / 2.0
		};
	case 2:
		return {
			width: containerWidth * 0.8,
			margin: ( containerWidth - ( containerWidth * 0.8 ) ) / 2.0
		};
	case 3:
		return {
			width: containerWidth * 0.9,
			margin: ( containerWidth - ( containerWidth * 0.9 ) ) / 2.0
		};
	}
};

const insertImages = ( imgs, containerWidth ) => {
	const ret = [];
	const { width, margin } = calculateMargin( containerWidth );
	for ( let i = 0; i < imgs.length; i++ ) {
		ret[ i ] = ( <img
			key={i}
			style={{
				marginLeft: margin,
				marginRight: margin,
				width,
				height: 'auto'
			}}
			role="presentation" src={imgs[ i ]}
		></img> );
	}
	return ret;
};

const requireLibs = ( libs ) => {
	return libs.map( x => 'library(' + x + ');' )
		.join( ' ' );
};

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

const displayHint = ( id, hints ) => {
	return (
		<Popover
			id="popover-positioned-top"
			title="Hints"
			style={{
				minWidth: '400px'
			}}
		>
			{ hints
				.filter( ( e, i ) => i <= id )
				.map( ( hintText, i ) => <span key={i}>
					<label>Hint {i+1}:</label>
					<br />
					<span>{hintText}</span>
					<br />
				</span> )
			}
		</Popover>
	);
};

const getHintLabel = ( id, noHints, hintOpen ) => {
	if ( hintOpen ) {
		return id <= 1 ? 'Close Hint' : 'Close Hints';
	}
	if ( id === 0 ) {
		return 'Get Hint';
	}
	else if ( id === noHints ) {
		return 'Show Hints';
	}
	else {
		return 'Next Hint';
	}
};

const showSolutionButton = ( currentHint, nHints, clickHandler, displayed ) => {
	const tooltip = (
		<Tooltip
			id="tooltip"
		>
			Solution becomes available once all hints have been used.
		</Tooltip>
	);
	if ( currentHint < nHints ) {
		return (
			<OverlayTrigger
				placement="top"
				positionLeft={100}
				overlay={tooltip}
				rootClose={true}
			>
				<span style={{display: 'inline-block', padding: 1, marginTop: -1}}>
					<Button
						bsStyle="warning"
						bsSize="sm"
						disabled
						style={{
							pointerEvents: 'none'
						}}
					>{ !displayed ? 'Show Solution' : 'Hide Solution' }</Button>
				</span>
			</OverlayTrigger>
		);
	} else {
		return (
			<Button
				bsStyle="warning"
				bsSize="sm"
				onClick={clickHandler}
			>{ !displayed ? 'Show Solution' : 'Hide Solution' }</Button>
		);
	}
};

const showResetButton = ( clickHandler ) => {
	const tooltip = (
		<Tooltip
			id="tooltip"
		>
			Reset the shell input to its default value.
		</Tooltip>
	);
	return (
		<OverlayTrigger
			placement="top"
			positionLeft={100}
			overlay={tooltip}
			rootClose={true}
		>
			<span style={{display: 'inline-block', padding: 1, marginTop: -1}}>
				<Button
					bsStyle="warning"
					bsSize="sm"
					onClick={clickHandler}
				>Reset</Button>
			</span>
		</OverlayTrigger>
	);
};


// R SHELL //

class RShell extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			id: counter,
			disabled: this.props.disabled,
			result: '',
			plots: [],
			running: false,
			currentHint: 0,
			hintOpen: false,
			solutionOpen: false,
			windowWidth: window.innerWidth,
			help: ''
		};

		counter += 1;
		rCode.push( props.code );

		this.insertPlot = ( url, id ) => {
			const { width, margin } = calculateMargin( this.props.containerWidth );
			return ( <img
				key={id}
				style={{
					marginLeft: margin,
					marginRight: margin,
					width,
					height: 'auto'
				}}
				role="presentation" src={url}
			></img> );
		};

		this.handleSolutionClick = () => {
			const val = this.editor.getValue();
			const solutionUnescaped = this.props.solution.replace( /\\n/g, '\n' );

			if ( this.state.solutionOpen === false ) {
				this.editor.setTheme( 'ace/theme/solarized_light' );
				this.editor.setOptions({
					highlightActiveLine: false,
					highlightGutterLine: false,
					readOnly: true
				});
			} else {
				this.editor.setTheme( 'ace/theme/katzenmilch' );
				this.editor.setOptions({
					highlightActiveLine: true,
					highlightGutterLine: true,
					readOnly: false
				});
			}

			if ( val !== solutionUnescaped ) {
				if ( this.props.id ) {
					global.lesson.session.log({
						id: this.props.id,
						type: 'RSHELL_DISPLAY_SOLUTION',
						value: val
					});
				}
				this.setState({
					lastSolution: val,
					solutionOpen: !this.state.solutionOpen
				});
				this.editor.setValue( solutionUnescaped, 1 );
			} else {
				this.setState({
					solutionOpen: !this.state.solutionOpen
				});
				this.editor.setValue( this.state.lastSolution, 1 );
			}
		};

		this.handleResetClick = () => {
			this.editor.setValue( this.props.code );
		};

		this.handleHintClick = () => {
			const { currentHint, hintOpen } = this.state;
			const { hints } = this.props;
			if ( currentHint < hints.length && hintOpen === false ) {
				if ( this.props.id ) {
					global.lesson.session.log({
						id: this.props.id,
						type: 'RSHELL_OPEN_HINT',
						value: currentHint
					});
				}
				this.setState({
					currentHint: currentHint + 1,
					hintOpen: true
				});
			} else {
				this.setState({
					hintOpen: !this.state.hintOpen
				});
			}
		};

		this.handleEvaluationClick = () => {
			this.setState({
				result: '',
				plots: [],
				running: true
			});
			let currentCode = this.editor.getValue();
			rCode[ this.state.id ] = currentCode;

			if ( currentCode === '' ) {
				this.setState({
					result: 'Code to be evaluated is empty',
					running: false
				});
			}
			else {
				let helpCommand = currentCode.match( HELP_REGEX );
				if ( helpCommand ) {
					this.getHelpPage( helpCommand[ 0 ]);
				}

				if ( this.props.id ) {
					global.lesson.session.log({
						id: this.props.id,
						type: 'RSHELL_EVALUATION',
						value: currentCode
					});
				}

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

				if ( this.props.addPreceding ) {
					for ( let i = 0; i < this.state.id; i++ ) {
						prependCode += rCode[ i ];
						prependCode += '\n';
					}
				}

				currentCode = requireLibs( libs ) + globalCode + prependCode + currentCode + '\n';
				this.props.onEvaluate( currentCode );

				const OPEN_CPU = global.ISLE.rshell && global.ISLE.rshell.server ?
					global.ISLE.rshell.server :
					OPEN_CPU_DEFAULT_SERVER;

				request.post( OPEN_CPU + OPEN_CPU_IDENTITY, {
					form: {
						x: currentCode
					}
				}, ( error, response, body ) => {
					const arr = body.split( '\n' );
					const plots = [];
					if ( !error && response.statusCode !== 400 ) {
						arr.forEach( elem => {
							if ( GRAPHICS_REGEX.test( elem ) === true ) {
								const imgURL = OPEN_CPU + elem;
								plots.push( imgURL );
							}
							if ( STDOUT_REGEX.test( elem ) === true ) {
								request.get( OPEN_CPU + elem, ( err, getResponse, getBody ) => {
									this.setState({
										result: getBody
									});
									this.props.onResult( this.state.result );
								});
							}
						});
						this.setState({
							plots,
							running: false
						});
					} else {
						this.setState({
							result: body.replace( ERR_REGEX, '' ),
							running: false
						});
					}
				});
			}
		};

		this.hideHelp = () => {
			this.setState({
				help: ''
			});
		};

		this.getHelpPage = ( helpCommand ) => {

			const OPEN_CPU = global.ISLE.rshell && global.ISLE.rshell.server ?
				global.ISLE.rshell.server :
				OPEN_CPU_DEFAULT_SERVER;

			request.post( OPEN_CPU + OPEN_CPU_IDENTITY, {
				form: {
					x: 'x = ' + helpCommand + '; x[1]'
				}
			}, ( error, response, body ) => {
				const arr = body.split( '\n' );
				if ( !error && response.statusCode !== 400 ) {
					arr.forEach( elem => {
						if ( STDOUT_REGEX.test( elem ) === true ) {
							request.get( OPEN_CPU + elem, ( err, res, helpPath ) => {
								const [ , lib, topic ] = helpPath.match( HELP_PATH_REGEX );
								request.get( `https://public.opencpu.org/ocpu/library/${lib}/man/${topic}/html`, ( err2, res2, html ) => {
									if ( !err2 ) {
										this.setState({
											help: html
										});
									}
								});
							});
						}
					});
				}
			});
		};

	}

	componentDidMount() {
		this.editor = ace.edit( ReactDom.findDOMNode( this ).firstChild );
		this.session = this.editor.getSession();
		this.session.setMode( 'ace/mode/r' );
		this.session.getDocument().setNewLineMode( 'unix' );
		this.editor.setTheme( 'ace/theme/katzenmilch' );
		this.editor.$blockScrolling = Infinity;
		this.editor.setOptions({
			maxLines: max( 5, this.props.lines ),
			minLines: this.props.lines,
			fontFamily: this.props.fontFamily,
			fontSize: this.props.fontSize
		});
		this.session.setUseWrapMode( true );
		this.editor.setValue( this.props.code, -1 );
		this.editor.resize();
		if ( this.state.disabled ) {
			this.editor.setOptions({
				readOnly: true,
				highlightActiveLine: false,
				highlightGutterLine: false
			});
			this.editor.renderer.$cursorLayer.element.style.opacity = 0;
			this.editor.textInput.getElement().disabled = true;
		}

		if ( !isElectron ) {
			const onChange = () => {
				window.addEventListener( 'beforeunload', beforeUnload );
				this.session.off( 'change', onChange );
			};
			this.session.on( 'change', onChange );
		}

		if ( this.props.precompute ) {
			this.handleEvaluationClick();
		}
	}

	componentDidUpdate() {
		this.editor.resize();
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.code !== nextProps.code ) {
			rCode[ this.state.id ] = nextProps.code;
			this.editor.setValue( nextProps.code, 1 );
			if ( nextProps.precompute ) {
				this.handleEvaluationClick();
			}
		}
	}

	componentWillUnmount() {
		counter = 0;
		rCode = [];
		this.editor.destroy();
		this.editor = null;
	}

	handleResize() {}

	render() {
		const nHints = this.props.hints.length;
		return (
			<div className="RShell"
				style={{
					margin: '5px',
					padding: '5px',
					border: '2px solid lightblue',
					borderRadius: '4px'
				}}
			>
				<div id="ace" style={{
					width: '100%'
				}}></div>
				{ !this.state.disabled ?
					<Button
						bsStyle="primary"
						bsSize="sm"
						style={{
							marginTop: '8px',
							marginBottom: '8px'
						}}
						onClick={this.handleEvaluationClick}
					>Evaluate</Button> :
					<span />
				}
				<Spinner
					running={this.state.running}
					width={60}
					height={30}
					display="inline"
					lines={12}
					style={{
						marginTop: '8px',
						marginBottom: '-12px'
					}}
				/>
				<ButtonToolbar style={{ float: 'right', marginTop: '8px' }}>
					{ nHints > 0 ?
						<OverlayTrigger
							trigger="click"
							placement="left"
							overlay={ displayHint( this.state.currentHint - 1, this.props.hints ) }
						>
							<Button
								bsStyle="info"
								bsSize="sm"
								onClick={this.handleHintClick}
								disabled={this.state.disabled}
							>{getHintLabel( this.state.currentHint, this.props.hints.length, this.state.hintOpen )}</Button>
						</OverlayTrigger> :
						null
					}
					{ ( this.props.solution && !this.state.disabled ) ?
						showSolutionButton(
							this.state.currentHint,
							nHints,
							this.handleSolutionClick,
							this.state.solutionOpen
						) :
						null
					}
					{ ( this.props.resettable ) ?
						showResetButton(
							this.handleResetClick
						) :
						null
					}
				</ButtonToolbar>
				<div id="output">
					{ showResult( this.state.result ) }
					{ insertImages( this.state.plots, this.props.containerWidth ) }
				</div>
				<Modal
					backdrop={false}
					show={Boolean( this.state.help )}
					title="R Help"
					onHide={this.hideHelp}
					style={{
						left: 'auto',
						padding: '10px',
						position: 'fixed',
						top: '10px',
						right: '30px',
						zIndex: 99999,
						overflow: 'hidden'
					}}
					enforceFocus={false}
				>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-lg">R Help</Modal.Title>
					</Modal.Header>
					<Modal.Body style={{
						height: '400',
						overflow: 'auto'
					}}>
						<span dangerouslySetInnerHTML={{ __html: this.state.help }}></span>
					</Modal.Body>
					<Modal.Footer>
						<Button onClick={this.hideHelp}>Close</Button>
					</Modal.Footer>
				</Modal>
			</div>
		);
	}
}


// PROPERTY TYPES //

RShell.propTypes = {
	onResult: PropTypes.func,
	onEvaluate:  PropTypes.func,
	code: PropTypes.string,
	lines: PropTypes.number,
	libraries: PropTypes.array,
	prependCode: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.array
	]),
	hints: PropTypes.array,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	disabled: PropTypes.bool,
	solution: PropTypes.string,
	precompute: PropTypes.bool,
	resettable: PropTypes.bool,
	addPreceding: PropTypes.bool
};


// DEFAULT PROPERTIES //

RShell.defaultProps = {
	onResult() {},
	onEvaluate(){},
	code: '',
	lines: 5,
	solution: '',
	libraries: [],
	prependCode: '',
	hints: [],
	fontSize: 16,
	fontFamily: 'Courier New',
	disabled: false,
	precompute: false,
	resettable: false,
	addPreceding: false
};


// EXPORTS //

export default Dimensions( RShell );