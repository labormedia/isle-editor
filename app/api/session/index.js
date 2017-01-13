// MODULES //

import request from 'request';


// SESSION //


class Session {

	constructor( config ) {
		this.userVal = 'ISLE_USER_' + config.server;
		let item = localStorage.getItem( this.userVal );
		this.user = item ? JSON.parse( item ) : null;
		this.anonymous = item ? false : true;
		this.finished = false;
		this.actions = [];
		this.vars = {};
		this.startTime = new Date().getTime();
		this.endTime = null;
		this.duration = 0;
		this.lesson = config;
		this.server = config.server;
	}

	updateUser() {
		let item = localStorage.getItem( this.userVal );
		this.user = item ? JSON.parse( item ) : null;
		this.anonymous = item ? false : true;
	}

	set( name, val ) {
		this.vars[ name ] = val;
	}

	get( name ) {
		return this.vars[ name ];
	}

	finalize() {
		this.updateUser();
		this.endTime = new Date().getTime();
		this.duration = this.endTime - this.startTime;
		this.finished = true;

		if ( this.anonymous === false ) {
			this.updateDatabase();
		}
	}

	updateDatabase() {
		const currentSession = {
			startTime: this.startTime,
			endTime: this.endTime,
			duration: this.duration,
			actions: this.actions,
			finished: this.finished,
			vars: this.vars,
			lessonID: this.lesson.title + '_' + this.lesson.author,
			userID: this.user._id
		};
		request.post( this.server + '/updateSession', {
			form: {
				stringified: JSON.stringify( currentSession )
			}
		}, ( error, response, body ) => {
			console.log( error );
		});
	}

	log( action ) {
		action.time = new Date().getTime() - this.startTime;
		this.actions.push( action );
	}

}


// EXPORTS //

export default Session;