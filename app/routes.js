// MODULES //

import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './containers/App';
import Editor from './containers/Editor';
import Documentation from './containers/Documentation';


// EXPORTS //

export default (
	<Route path="/" component={App}>
		<IndexRoute component={Editor} />
		<Route path="/docs" component={Documentation} />
	</Route>
);