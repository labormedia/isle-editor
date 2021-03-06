// MODULES //

import { Component } from 'react';


// CONSTANTS //

// The following components need to be ignored (works with react-dom and react-native):
const IGNORED_COMPONENTS = [ 'StatelessComponent', 'Constructor', 'AnimatedComponent' ];


// FUNCTIONS //

/**
* Retrieve the immediate parent of the supplied node
*
* @private
* @param {} node - input node
* @returns {[type]} parent node
*/
function _getParent( node ) {
	if ( node instanceof Component ) {
		node = node._reactInternalInstance;
	}
	let owner = node && node._currentElement._owner;
	let parentNode = node && node._hostParent;
	// location real parent node based on owner
	while ( owner && parentNode && parentNode._currentElement._owner._mountOrder != owner._mountOrder ) {
		parentNode = parentNode._currentElement._owner;
		if ( parentNode._currentElement._owner._mountOrder < owner._mountOrder ) {
			parentNode = null;
			break;
		}
	}
	return parentNode || owner;
} // end FUNCTION _getParent()

/**
* Get all children of the specified node by recursion.
*
* @private
* @param node - node to search from
* @returns {(Array|null)}
*/
function _getAllChildren( node ) {
	if ( node instanceof Component ) {
		node = node._reactInternalInstance;
	}
	let children = [];
	if ( node._renderedComponent ) {
		children.push( node._renderedComponent );
		let deeper = _getAllChildren( node._renderedComponent );
		( deeper && deeper.length ) && ( children = children.concat( deeper ) );
	} else if ( node._renderedChildren ) {
		for ( let key in node._renderedChildren ) {
			if ( node._renderedChildren.hasOwnProperty( key ) && key.indexOf( '.' ) == 0 ) {
				let child = node._renderedChildren[ key ];
				children.push( child );
				let deeper = _getAllChildren( child );
				( deeper && deeper.length ) && ( children = children.concat( deeper ) );
			}
		}
	}
	return children;
} // end FUNCTION _getAllChildren()

// filter the component that we really need.
function _filterComponent( nodes, childType ) {
	let result = null;
	if ( nodes && nodes.length ) {
		let filterResult = [];
		nodes.forEach( function( item ) {
			let instance = _getValidComponent( item );
			if ( instance && ( !childType || ( instance instanceof childType ) ) ) {
				filterResult.push( instance );
			}
		});
		if ( filterResult.length ) {
			result = filterResult;
		}
	}
	return result;
} // end FUNCTION _filterComponent()

/**
* Get valid component and ignore common component. If node is ReactCompositeComponentWrapper, get _instance.
*
* @private
*/
function _getValidComponent( node ) {
	if ( node && ( node._instance || node.constructor.name == 'ReactCompositeComponentWrapper' ) ) {
		node = node._instance;
	}
	if ( node && IGNORED_COMPONENTS.indexOf( node.constructor.name ) >= 0 ) {
		node = null;
	}
	return node;
} // end FUNCTION _getValidComponent()

/**
* Retrieve all child-components in the node tree structure
*
* @param node - node to search from
* @param childType - child type
* @returns {(Array|null)}
*/
export function findAllChildren( node, childType ) {
	let children = _getAllChildren( node );
	return _filterComponent( children, childType );
} // end FUNCTION findAllChildren()

/**
* Search for the first parent in node-tree structure.
*
* @private
* @param node - node to search from
* @param pType - parent type
* @returns {(Array|null)}
*/
export function findParent( node, pType ) {
	let parentNode = _getParent( node );
	let instance = _getValidComponent( parentNode );
	while ( parentNode && ( !instance || ( pType && !( instance instanceof pType ) ) ) ) {
		parentNode = _getParent( parentNode );
		instance = _getValidComponent( parentNode );
	}
	return instance;
} // end FUNCTION findParent()

/**
* Search all parents in node-tree structure.
*
* @private
* @param node - node to search from
* @param pType - parent type
* @returns {(Array|null)}
*/
export function findAllParents( node, pType ) {
	let parents = [];
	let parent = _getParent( node );
	while ( parent ) {
		parents.push( parent );
		parent = _getParent( parent );
	}
	parents = _filterComponent( parents, pType );
	return parents ? parents.reverse() : null;
} // end FUNCTION findAllParents()
