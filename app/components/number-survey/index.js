
// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import NumberInput from 'components/input/number';


// MAIN //

class NumberSurvey extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			submitted: false,
			value: null
		};

		this.submitQuestion = () => {

			if ( this.props.id ) {
				global.lesson.session.log({
					id: this.props.id,
					type: 'NUMBER_SURVEY_SUBMISSION',
					value: this.state.value
				});
			}
			this.setState({
				submitted: true
			});
			global.lesson.addNotification({
				title: 'Submitted',
				message: 'Your answer has been submitted.',
				level: 'success',
				position: 'tr'
			});
			this.props.onSubmit( this.state.value );
		};
	}

	componentDidMount() {
	}

	render() {
		const props = this.props;
		const disabled = this.state.submitted && !props.allowMultipleAnswers;
		return (
			<Panel className="NumberSurvey" style={{
				margin: '0 auto 10px',
				maxWidth: 600,
				marginTop: '8px'
			}}>
				<h3>{props.question}</h3>
				<NumberInput
					{...props}
					disabled={disabled}
					onChange={( value ) => {
						this.setState({
							value
						});
					}}
				/>
				<Button
					bsSize="small"
					bsStyle="success"
					block fill
					onClick={this.submitQuestion}
					disabled={disabled}
				>{ disabled ? "Submitted" : "Submit"}</Button>
			</Panel>
		);
	}
}


// DEFAULT PROPERTIES //

NumberSurvey.defaultProps = {
	onSubmit() {},
	allowMultipleAnswers: false
};


// PROPERTY TYPES //

NumberSurvey.propTypes = {
	onSubmit: PropTypes.func,
	allowMultipleAnswers: PropTypes.bool
};


// EXPORTS //

export default NumberSurvey;