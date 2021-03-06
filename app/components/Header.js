// MODULES //

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import * as colors from 'constants/colors';


// MAIN //

class Header extends Component {

	constructor( props ) {
		super( props );
	}

	handleRoleSelection = ( eventKey ) => {
		let newRole;
		switch ( eventKey ) {
		case '1':
			newRole = 'anonymous';
			break;
		case '2':
			newRole = 'user';
			break;
		case '3':
			newRole = 'enrolled';
			break;
		case '4':
		default:
			newRole = 'owner';
			break;
		}
		this.props.onSelectRole( newRole );
	}

	render() {
		return (
			<div>
				<div
					style={{
						color: 'white',
						backgroundColor: colors.GRAY,
						height: '48px',
						minHeight: '48px',
						display: 'flex',
						alignItems: 'center',
						padding: '5px',
						justifyContent: 'space-between'
					}}
				>
					<h3>ISLE Editor</h3>
					<div>
						<Link
							to="/export"
							style={{
								color: 'silver',
								fontSize: '18px',
								marginRight: '10px'
							}}
						>Export</Link>
						<Link
							to="/settings"
							style={{
								color: 'silver',
								fontSize: '18px',
								marginRight: '10px'
							}}
						>Settings</Link>
						<Link
							to="/docs"
							style={{
								color: 'silver',
								fontSize: '18px'
							}}
						>Documentation</Link>
					</div>
				</div>
				<div
					style={{
						backgroundColor: colors.LIGHT_GRAY,
						height: '40px',
						minHeight: '40px',
						color: colors.GRAY,
						display: 'flex',
						alignItems: 'center',
						padding: '5px',
						justifyContent: 'space-between'
					}}
				>
					<span style={{ paddingLeft: 5 }} >{this.props.fileName || 'Untitled Document'}</span>
					<span>
						<DropdownButton
							title={this.props.role}
							id="bg-user-dropdown"
							bsSize="xsmall"
							bsStyle="warning"
							onSelect={this.handleRoleSelection}
							style={{
								width: 100
							}}
						>
							<MenuItem eventKey="1">anonymous</MenuItem>
							<MenuItem eventKey="2">user</MenuItem>
							<MenuItem eventKey="3">enrolled</MenuItem>
							<MenuItem eventKey="4">owner</MenuItem>
						</DropdownButton>
						<span style={{
							paddingLeft: 5,
							paddingRight: 5
						}}>Preview</span>
					</span>
				</div>
			</div>
		);
	}
}

// EXPORTS //

export default Header;
