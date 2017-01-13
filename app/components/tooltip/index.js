// MODULES //

import radium from 'radium';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import styles from 'components/styles';


// TOOLTIP //

class Tooltip extends React.Component {
	/*
	* Create a Tooltip.
	*/
	constructor( props ) {
		super( props );
		// Set initial state variables...
		this.state = {
			visible: false
		};
	}

	/*
	* Invoked once on client after the initial rendering. Handles fade-in animation.
	*/
	componentDidMount() {
		const elem = ReactDOM.findDOMNode( this );
		elem.style.opacity = 0;
		window.requestAnimationFrame( () => {
			// Set a transition on the opacity...
			elem.style.transition = 'opacity 250ms';
			elem.style.opacity = 1;
		});
	}

	/*
	* React component render method.
	*/
	render() {
		return (
			<div
				className="tooltip"
				style={{ display: this.state.visible ? 'inline' : 'none' }}
			>
				<div
					key="tooltip"
					style={[ styles.tooltip, { left: this.props.left, top: this.props.top } ]}
				>
					{this.props.text}
				</div>
			</div>
		);
	}
}


// DEFAULT PROPERTIES //

Tooltip.defaultProps = {
	top: -40,
	left: -50
};


// PROPERTY TYPES //

Tooltip.propTypes = {
	left: PropTypes.number,
	text: PropTypes.string,
	top: PropTypes.number
};


// EXPORTS //

export default radium( Tooltip );