// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, ListGroup, ListGroupItem, OverlayTrigger, Panel, Popover } from 'react-bootstrap';
import isArray from '@stdlib/assert/is-array';
import contains from '@stdlib/assert/contains';
import InstructorBar from 'components/instructor-bar';


// FUNCTIONS //

const Question = ( props ) =>
	<span className="question">
		<h3>{props.content}</h3>
		<span style={{ fontSize: '18px' }}>{props.task}:</span>
	</span>;

Question.PropTypes = {
	content: PropTypes.string.isRequired,
	task: PropTypes.string.isRequired
};

const AnswerOption = ( props ) => {
	let bsStyle;
	if ( props.provideFeedback ) {
		if ( props.correct === true ) {
			bsStyle = 'success';
		}
		else if ( props.correct === false ) {
			bsStyle = 'danger';
		}
		else if ( props.solution === true ) {
			// Case: User did not pick correct answer...
			bsStyle = 'warning';
		}
	}
	const popover =
		<Popover id={props.no}>
			<strong>{ props.solution ? 'Correct answer: ' : 'Incorrect answer: ' }</strong>
			{props.answerExplanation}
		</Popover>;

	if ( props.disabled ) {
		return (
			<ListGroupItem
				bsStyle={bsStyle}
				disabled
			>
				{props.answerContent}
			</ListGroupItem>
		);
	}
	else if ( props.submitted ) {
		return (
			<OverlayTrigger
				trigger={[ 'click', 'hover' ]}
				placement="right"
				overlay={ props.answerExplanation ? popover : <span /> }
			>
				<ListGroupItem
					onClick={props.onAnswerSelected}
					bsStyle={bsStyle}
					disabled={!props.provideFeedback}
				>
					{props.answerContent}
				</ListGroupItem>
			</OverlayTrigger>
		);
	}
	else {
		return (
			<ListGroupItem
				onClick={props.onAnswerSelected}
				active={props.active}
			>
				{props.answerContent}
			</ListGroupItem>
		);
	}
};

AnswerOption.propTypes = {
	answerContent: PropTypes.oneOfType([
		PropTypes.element,
		PropTypes.string
	]).isRequired,
	active: PropTypes.bool.isRequired,
	answerExplanation: PropTypes.oneOfType([
		PropTypes.element,
		PropTypes.string
	]),
	onAnswerSelected: PropTypes.func.isRequired
};


// MULTIPLE CHOICE QUESTION //

class MultipleChoiceQuestion extends Component {

	constructor( props ) {
		super( props );

		if ( props.displaySolution ) {
			this.state = {
				submitted: true,
				active: this.props.solution,
				correct: new Array( props.answers.length ),
				answerSelected: false
			};
		} else {
			let active = isArray( this.props.solution ) ?
				new Array( props.answers.length ) :
				null;
			this.state = {
				submitted: false,
				active,
				correct: new Array( props.answers.length ),
				answerSelected: false
			};
		}

		this.submitQuestion = () => {
			let sol = this.props.solution;
			let newCorrect = new Array( this.props.answers.length );

			if ( this.props.id ) {
				const { session } = this.context;
				session.log({
					id: this.props.id,
					type: 'MULTIPLE_CHOICE_SUBMISSION',
					value: this.state.active
				});
			}

			if ( isArray( sol ) ) {
				for ( let i = 0; i < this.state.active.length; i++ ) {
					if ( this.state.active[ i ] === true ) {
						if ( contains( sol, i ) ) {
							newCorrect[ i ] = true;
						} else {
							newCorrect[ i ] = false;
						}
					}
				}
				let active = new Array( props.answers.length );
				this.setState({
					correct: newCorrect,
					submitted: true,
					active
				});
			}
			else {
				for ( let i = 0; i < newCorrect.length; i++ ) {
					if ( this.state.active === i ) {
						if ( i === sol ) {
							newCorrect[ i ] = true;
						} else {
							newCorrect[ i ] = false;
						}
					}
				}
				let active = null;
				this.setState({
					correct: newCorrect,
					submitted: true,
					active
				});
			}
			this.props.onSubmit( this.state.active );
		};
	}

	componentDidMount() {
		if ( this.props.displaySolution ) {
			this.submitQuestion();
		}
	}

	render() {
		const props = this.props;
		const allowMultipleAnswers = isArray( this.props.solution );

		const renderAnswerOptionsMultiple = ( key, id ) => {
			let isSolution = contains( this.props.solution, id );
			return (
				<AnswerOption
					key={key.content}
					no={id}
					answerContent={key.content}
					answerExplanation={key.explanation}
					active={this.state.active[ id ]}
					correct={this.state.correct[ id ]}
					disabled={this.props.disabled}
					provideFeedback={this.props.provideFeedback}
					submitted={this.state.submitted}
					solution={isSolution}
					onAnswerSelected={ () => {
						if ( !this.state.submitted ) {
							let newActive = this.state.active.slice();
							newActive[ id ] = !newActive[ id ];
							this.setState({
								active: newActive,

							});
						}
					}}
				/>
			);
		};

		const renderAnswerOptionsSingle = ( key, id ) => {
			let isSolution = this.props.solution === id;
			return (
				<AnswerOption
					key={id}
					no={id}
					answerContent={key.content}
					answerExplanation={key.explanation}
					active={this.state.active === id}
					correct={this.state.correct[ id ]}
					disabled={this.props.disabled}
					provideFeedback={this.props.provideFeedback}
					submitted={this.state.submitted}
					solution={isSolution}
					onAnswerSelected={ () => {
						if ( !this.state.submitted ) {
							this.setState({
								active: id,
								answerSelected: true
							});
						}
					}}
				/>
			);
		};

		let disabled;
		if ( allowMultipleAnswers ) {
			disabled = this.props.disabled || this.state.submitted;
		} else {
			disabled = this.props.disabled || this.state.submitted || !this.state.answerSelected;
		}

		return (
			<Panel className="multipleChoiceQuestion" style={{
				margin: '0 auto 10px',
				maxWidth: 600,
				marginTop: '8px'
			}}>
				<Question
					content={props.question}
					task={ allowMultipleAnswers ? 'Choose all that apply' : 'Pick the correct answer' }
				/>
				<ListGroup fill >
					{ allowMultipleAnswers ?
						props.answers.map( renderAnswerOptionsMultiple ) :
						props.answers.map( renderAnswerOptionsSingle )
					}
				</ListGroup>
				<Button
					bsSize="small"
					bsStyle="success"
					block fill
					onClick={this.submitQuestion}
					disabled={disabled}
				>{ this.state.submitted ? "Submitted" : "Submit"}</Button>
				<InstructorBar id={props.id} />
			</Panel>
		);
	}
}


// DEFAULT PROPERTIES //

MultipleChoiceQuestion.defaultProps = {
	answers: [],
	disabled: false,
	displaySolution: false,
	provideFeedback: true,
	onSubmit(){}
};


// PROPERTY TYPES //

MultipleChoiceQuestion.propTypes = {
	solution: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.array
	]).isRequired,
	answers: PropTypes.array.isRequired,
	disabled: PropTypes.bool,
	displaySolution: PropTypes.bool,
	provideFeedback: PropTypes.bool,
	onSubmit: PropTypes.func
};

MultipleChoiceQuestion.contextTypes = {
	session: PropTypes.object
};


// EXPORTS //

export default MultipleChoiceQuestion;
