// MODULES //

import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import PropTypes from 'prop-types';
import Gate from 'components/gate';
const debug = require( 'debug' )( 'isle-editor' );


// MAIN //

class ChatButton extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			opened: false
		};

		this.onClick = () => {
			const { session } = this.context;
			let opened = this.state.opened;
			this.setState({
				opened: !opened
			}, () => {
				if ( !opened ) {
					debug( 'Should join chat...' );
					session.joinChat( this.props.for );
				} else {
					debug( 'Should leave chat...' );
					session.leaveChat( this.props.for );
				}
			});
		};
	}

	componentDidMount() {
		const { session } = this.context;
		this.unsubscribe = session.subscribe( () => {
			let chat = session.getChat( this.props.for );
			if ( !chat ) {
				this.setState({
					opened: false
				});
			}
			this.forceUpdate();
		});
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	render() {
		return (
			<Gate user>
				<Button
					bsStyle="primary"
					bsSize="sm"
					onClick={this.onClick}
				>{this.state.opened ? 'Leave Chat' : 'Join Chat' }</Button>
			</Gate>
		);
	}
}


// TYPES //

ChatButton.contextTypes = {
	session: PropTypes.object
};


// EXPORTS //

export default ChatButton;
