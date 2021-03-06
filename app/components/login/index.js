// MODULES //

import React, { Component } from 'react';
import {
	Button, Col, ControlLabel, FormControl, FormGroup,
	Form, Overlay, Modal, Popover
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import './login.css';


// MAIN //

class Login extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			email: '',
			password: ''
		};

		this.handleInputChange = ( event ) => {
			const target = event.target;
			const value = target.value;
			const name = target.name;

			this.setState({
				[ name ]: value
			});
		};

		this.handleForgotPassword = ( event ) => {
			event.preventDefault();
			if ( this.state.email === '' ) {
				this.setState({
					showInputOverlay: true,
					overlayTarget: this.emailInput,
					invalidInputMessage: 'Enter your email address.	'
				});
			} else {
				const { session } = this.context;
				session.forgotPassword( this.state.email );
			}
		};

		this.handleSubmit = ( event ) => {
			event.preventDefault();
			let form = {
				password: this.state.password,
				email: this.state.email
			};
			if ( form.email === '' ) {
				this.setState({
					showInputOverlay: true,
					overlayTarget: this.emailInput,
					invalidInputMessage: 'Enter your email address.	'
				});
			}
			else if ( form.password === '' ) {
				this.setState({
					showInputOverlay: true,
					overlayTarget: this.passwordInput,
					invalidInputMessage: 'Enter your password.'
				});
			}
			else {
				const { session } = this.context;
				session.login( form, ( err, res ) => {
					if ( !err ) {
						const { message, type } = JSON.parse( res.body );
						console.log( message );
						if ( message === 'ok' ) {
							this.props.onClose();
						} else {
							this.setState({
								showInputOverlay: true,
								overlayTarget: type === 'no_user' ? this.emailInput : this.passwordInput,
								invalidInputMessage: message
							}, () => {
								setTimeout( () => {
									this.setState({
										showInputOverlay: false
									});
								}, 2000 );
							});
						}
					}
				});
			}
		};
	}

	render() {
		return (
			<Modal show={this.props.show} className="login-modal" >
				<Modal.Header>
					<Modal.Title>Login</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form horizontal>
						<FormGroup controlId="formHorizontalEmail">
							<Col componentClass={ControlLabel} sm={2}>
								Email
							</Col>
							<Col sm={10}>
								<FormControl
									name="email"
									type="email"
									placeholder="Email"
									onChange={this.handleInputChange}
									ref={ ( input ) => { this.emailInput = input; }}
								/>
							</Col>
						</FormGroup>
						<FormGroup controlId="formHorizontalPassword">
							<Col componentClass={ControlLabel} sm={2}>
								Password
							</Col>
							<Col sm={10}>
								<FormControl
									name="password"
									type="password"
									placeholder="Password"
									onChange={this.handleInputChange}
									ref={ ( input ) => { this.passwordInput = input; }}
								 />
							</Col>
						</FormGroup>
					</Form>
					<Overlay
						show={this.state.showInputOverlay}
						target={this.state.overlayTarget}
						placement="right"
						container={this}
						containerPadding={20}
					>
						<Popover id="popover-contained" title="Not valid">
							{this.state.invalidInputMessage}
						</Popover>
					</Overlay>
				</Modal.Body>
				<Modal.Footer>
					<a href="" style={{ float: 'left', marginTop: '8px' }} onClick={this.handleForgotPassword}>Forgot password?</a>
					<Button
						bsStyle="primary"
						className="centered"
						type="submit"
						onClick={this.handleSubmit}
					>Sign in</Button>
					<Button onClick={this.props.onClose}>Close</Button>
				</Modal.Footer>
			</Modal>
		);
	}
}

// TYPES //

Login.contextTypes = {
	session: PropTypes.object
};



// EXPORTS //

export default Login;
