// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonToolbar, FormControl, OverlayTrigger, Panel, Tooltip } from 'react-bootstrap';
import ChatButton from 'components/chat-button';
import InstructorBar from 'components/instructor-bar';


// MAIN //

class FreeTextQuestion extends Component {
	/**
	* Create a free-form question with a text input field.
	*
	* @param {Object} props
	*/
	constructor( props ) {
		super( props );

		// Initialize state variables...
		this.state = {
			value: '',
			solutionDisplayed: false,
			submitted: false
		};

		/*
		* Event handler invoked when text area value changes. Updates `value` and invokes
		* `onChange` callback with the new text as its first argument
		*/
		this.handleChange = ( event ) => {
			const newValue = event.target.value;
			this.setState({ value: newValue });
			this.props.onChange( newValue );
		};

		this.submitHandler = ( event ) => {
			const { session } = this.context;
			if ( this.state.submitted ) {
				session.addNotification({
					title: 'Answer re-submitted.',
					message: this.props.resubmissionMsg,
					level: 'success',
					position: 'tr'
				});
			} else {
				session.addNotification({
					title: 'Answer submitted.',
					message: this.props.submissionMsg,
					level: 'success',
					position: 'tr'
				});
			}

			this.setState({
				submitted: true
			});
			if ( this.props.id ) {
				session.log({
					id: this.props.id,
					type: 'FREE_TEXT_QUESTION_SUBMIT_ANSWER',
					value: this.state.value
				});
			}
		};

		this.handleSolutionClick = () => {
			const { session } = this.context;
			if ( this.state.solutionDisplayed ) {
				this.setState({
					solutionDisplayed: false,
					value: this.state.studentAnswer
				});
			} else {
				session.log({
					id: this.props.id,
					type: 'FREE_TEXT_QUESTION_DISPLAY_SOLUTION',
					value: null
				});
				this.setState({
					solutionDisplayed: true,
					studentAnswer: this.state.value,
					value: this.props.solution
				});
			}
		};
	}

	/*
	* React component render method.
	*/
	render() {
		const nHints = this.props.hints.length;
		const tooltip = (
			<Tooltip
				id="tooltip"
			>
				Solution becomes available after answer is submitted.
			</Tooltip>
		);

		return (
			<Panel className="FreeFormQuestion">
				{ this.props.question ? <h4>{this.props.question}</h4> : null }
				<label>{ this.state.solutionDisplayed ? 'Solution:' : 'Your answer:' } </label>
				<FormControl
					componentClass="textarea"
					placeholder="Enter your answer here..."
					onChange={this.handleChange}
					style={{
						resize: this.props.resizable ? 'both' : 'none'
					}}
					rows={this.props.rows}
					value={this.state.value}
					disabled={this.state.solutionDisplayed}
				/>
				{
					this.state.value.length >= 2 ?
						<Button
							bsStyle="primary"
							bsSize="sm"
							style={{
								marginTop: '8px',
								marginBottom: '8px'
							}}
							onClick={this.submitHandler}
						>{ !this.state.submitted ? 'Submit' : 'Resubmit' }</Button> :
						<OverlayTrigger
							placement="top"
							positionLeft={100}
							overlay={<Tooltip id="submitTooltip">
								Click submit after you have typed your answer.
							</Tooltip>}
							rootClose={true}
						>
							<div style={{ display: 'inline-block' }}>
								<Button
									bsStyle="primary"
									bsSize="sm"
									style={{
										marginTop: '8px',
										marginBottom: '8px',
										pointerEvents: 'none'
									}}
									disabled
								>Submit</Button>
							</div>
						</OverlayTrigger>
				}

				<ButtonToolbar style={{ marginTop: '8px', marginBottom: '4px', float: 'right' }}>
					{ nHints > 0 ?
						<OverlayTrigger
							trigger="click"
							placement="left"
							overlay={ displayHint( this.state.currentHint - 1, this.props.hints ) }
						>
							<Button
								bsStyle="primary"
								bsSize="sm"
								onClick={this.handleHintClick}
								disabled={this.state.disabled}
							>{getHintLabel( this.state.currentHint, this.props.hints.length, this.state.hintOpen )}</Button>
						</OverlayTrigger> :
						null
					}
					{
						this.props.solution ? ( this.state.submitted ?
							<Button
								bsStyle="warning"
								bsSize="sm"
								onClick={this.handleSolutionClick}
							>{ !this.state.solutionDisplayed ? 'Show Solution' : 'Hide Solution' }</Button> :
							<OverlayTrigger
								placement="top"
								positionLeft={100}
								overlay={tooltip}
								rootClose={true}
							>
								<div style={{ display: 'inline-block', marginLeft: '4px' }}>
									<Button
										bsStyle="warning"
										bsSize="sm"
										disabled
										style={{
											pointerEvents: 'none'
										}}
									>{ !this.state.solutionDisplayed ? 'Show Solution' : 'Hide Solution' }</Button>
								</div>
							</OverlayTrigger> ) :
							<span />
					}
					{
						this.props.chat && this.props.id ?
							<div style={{ display: 'inline-block', marginLeft: '4px' }}>
								<ChatButton for={this.props.id} />
							</div> : null
					}
				</ButtonToolbar>
				<InstructorBar id={this.props.id} />
			</Panel>
		);
	}
}


// DEFAULT PROPERTIES //

FreeTextQuestion.defaultProps = {
	chat: false,
	hints: [],
	onChange() {},
	question: '',
	solution: null,
	resizable: false,
	resubmissionMsg: 'You have successfully re-submitted your answer.',
	rows: 5,
	submissionMsg: 'Compare your answer with solution using the "Show Solution" button. You can then change your answer and re-submit if necessary.'
};


// PROPERTY TYPES //

FreeTextQuestion.propTypes = {
	chat: PropTypes.bool,
	hints: PropTypes.array,
	onChange: PropTypes.func,
	question: PropTypes.string,
	solution: PropTypes.string,
	resizable: PropTypes.bool,
	resubmissionMsg: PropTypes.string,
	rows: PropTypes.number,
	submissionMsg: PropTypes.string
};

FreeTextQuestion.contextTypes = {
	session: PropTypes.object
};


// EXPORTS //

export default FreeTextQuestion;
