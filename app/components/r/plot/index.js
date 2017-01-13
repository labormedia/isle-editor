// MODULES //

import React, { Component, PropTypes } from 'react';
import Dimensions from 'components/dimensions';
import { Modal } from 'react-bootstrap';
import request from 'request';
import isArray from '@stdlib/utils/is-array';
import Spinner from 'components/spinner';


// CONSTANTS //

import { OPEN_CPU_DEFAULT_SERVER, OPEN_CPU_IDENTITY } from 'constants/opencpu.js';
const GRAPHICS_REGEX = /graphics/;


// FUNCTIONS //

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

const requireLibs = ( libs ) => {
	return libs.map( x => 'library(' + x + ');' )
		.join( ' ' );
};


// R PLOT //

class RPlot extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			plot: null,
			last: '',
			waiting: false
		};
	}

	getPlot() {
		if ( this.props.code !== this.state.last ) {
			this.setState({
				waiting: true,
				last: this.props.code,
				showModal: false
			});
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
			const fullCode = requireLibs( libs ) + globalCode + prependCode + this.props.code;

			const OPEN_CPU = global.ISLE.rshell && global.ISLE.rshell.server ?
				global.ISLE.rshell.server :
				OPEN_CPU_DEFAULT_SERVER;

			request.post( OPEN_CPU + OPEN_CPU_IDENTITY, {
				form: {
					x: fullCode
				}
			}, ( error, response, body ) => {
				if ( !error ) {
					const arr = body.split( '\n' );
					arr.forEach( elem => {
						if ( GRAPHICS_REGEX.test( elem ) === true ) {
							const imgURL = OPEN_CPU + elem;
							this.setState({
								plot: imgURL,
								waiting: false
							});
						}
					});
				}
			});
		}
	}

	componentDidMount() {
		this.getPlot();
	}

	componentDidUpdate() {
		this.getPlot();
	}

	render() {
		const { width, margin } = calculateMargin( this.props.containerWidth );
		const closeModal = () => this.setState({ showModal: false });
		return (
			<div className="rplot" style={{
			}}>
				<Spinner running={this.state.waiting} width={256} height={128}/>
				{ this.state.waiting ?
					<span /> :
					<span>
						<img
							style={{
								marginLeft: margin,
								marginRight: margin,
								width,
								height: 'auto',
								cursor: 'zoom-in'
							}}
							role="presentation"
							src={ this.state.plot }
							onClick={ () => {
								this.setState({
									showModal: true
								});
							}}
						/>
						<Modal
							show={this.state.showModal}
							onHide={closeModal}
							bsSize="lg"
							title="R Plot"
							backdrop={true}
							rootClose={true}
						>
							<Modal.Header closeButton>
								<Modal.Title id="contained-modal-title-lg">R Plot</Modal.Title>
							</Modal.Header>
							<Modal.Body>
								<img
									src={ this.state.plot }
									style={{
										margin: 'auto',
										display: 'block'
									}}
								/>
							</Modal.Body>
						</Modal>
					</span>
				}
			</div>
		);
	}

}


// PROPERTY TYPES //

RPlot.propTypes = {
	code: PropTypes.string,
	width: PropTypes.number,
	height: PropTypes.number,
	libraries: PropTypes.array,
	prependCode: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.array
	])
};


// DEFAULT PROPERTIES //

RPlot.defaultProps = {
	code: '',
	width: 600,
	height: 400,
	libraries: [],
	prependCode: ''
};


// EXPORTS //

export default Dimensions( RPlot );
