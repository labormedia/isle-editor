// MODULES //

import React, { Component } from 'react';
import { Button, Modal } from 'react-bootstrap';
import randomstring from 'randomstring';
import Plotly from 'plotly.js';
import './plotly.css';


// MAIN //

class Plot extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			plotID: randomstring.generate(),
			fullscreen: false
		};
	}

	toggleFullscreen = () => {
		this.setState({
			fullscreen: !this.state.fullscreen
		});
	}

	drawPlot = ( plotID ) => {
		Plotly.newPlot(
			plotID,
			this.props.data,
			this.props.layout,
			{
				displayModeBar: true,
				displaylogo: false,
				modeBarButtonsToRemove: [ 'sendDataToCloud' ],
				modeBarButtonsToAdd: [ {
					name: 'Toggle FullScreen',
					icon: Plotly.Icons[ 'zoombox' ],
					click: this.toggleFullscreen
				} ]
			}
		);
	}

	componentDidMount() {
		this.drawPlot( this.state.plotID );
	}

	componentDidUpdate() {
		this.drawPlot( this.state.plotID );
	}

	render() {
		if ( this.state.fullscreen ) {
			return (
				<Modal
					show={this.state.fullscreen}
					onHide={this.toggleFullscreen}
					dialogClassName="fullscreen-modal"
				>
					<div id={this.state.plotID} ></div>
					<Modal.Footer>
						<Button onClick={this.toggleFullscreen}>Close</Button>
					</Modal.Footer>
				</Modal>
			);
		}
		return <div id={this.state.plotID} ></div>;
	}
}


// EXPORTS //

export default Plot;
