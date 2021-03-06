// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CheckboxInput from 'components/input/checkbox';
import SelectInput from 'components/input/select';
import SliderInput from 'components/input/slider';
import Dashboard from 'components/dashboard';
import Plotly from 'components/plotly';
import isArray from '@stdlib/assert/is-array';
import kernelSmooth from 'kernel-smooth';
import linspace from '@stdlib/math/utils/linspace';
import min from 'compute-min';
import max from 'compute-max';
import pow from '@stdlib/math/base/special/pow';
import gaussian from '@stdlib/math/base/dist/normal/pdf';
import iqr from 'compute-iqr';


// FUNCTIONS //

function by( arr, factor, fun ) {
	let ret = {};
	for ( let i = 0; i < arr.length; i++ ) {
		if ( !isArray( ret[ factor[ i ] ]) ) {
			ret[ factor[ i ] ] = [];
		}
		ret[ factor[ i ] ].push( arr[ i ]);
	}
	for ( let key in ret ) {
		ret[ key ] = fun( ret[ key ]);
	}
	return ret;
}


// MAIN //

class Histogram extends Component {

	constructor( props ) {
		super( props );
	}

	generateHistogram(
		variable, group, overlayDensity, overlapping, chooseBins, nBins
	) {
		var output;
		if ( !group ) {
			const vals = this.props.data[ variable ];
			const data = [ {
				x: vals,
				type: 'histogram',
				name: 'histogram'
			} ];
			if ( chooseBins ) {
				data[ 0 ].nbinsx = nBins;
			}
			if ( overlayDensity ) {
				// Chose appropriate bandwidth via rule-of-thumb:
				const h = 2.0 * iqr( vals ) * pow( vals.length, -1/3 );
				const phi = gaussian.factory( 0.0, 1.0 );
				const kde = kernelSmooth.density( vals, phi, h );
				const x = linspace( min( vals ), max( vals ), 512 );
				let y = x.map( x => kde( x ) );
				data.push({
					x: x,
					y: y,
					type: 'lines',
					name: 'density'
				});
				data[ 0 ][ 'histnorm' ] = 'probability density';
			}
			const layout = {
				xaxis: {title: 'Value' },
				yaxis: {title: overlayDensity ? 'Density' : 'Count' }
			};
			output = {
				variable: variable,
				type: 'Chart',
				value: <div>
					<label>{variable}: </label>
					<Plotly data={data} layout={layout} />
				</div>
			};
		} else {
			let freqs = by( this.props.data[ variable ], this.props.data[ group ], arr => {
				return arr;
			});
			let data = [];
			for ( let key in freqs ) {
				let vals = freqs[ key ];
				if ( overlayDensity ) {
					// Chose appropriate bandwidth via rule-of-thumb:
					const h = 2.0 * iqr( vals ) * pow( vals.length, -1/3 );
					const phi = gaussian.factory( 0.0, 1.0 );
					const kde = kernelSmooth.density( vals, phi, h );
					const x = linspace( min( vals ), max( vals ), 512 );
					const y = x.map( x => kde( x ) );
					const config = {
						x: vals,
						type: 'histogram',
						histnorm: 'probability density',
						name: key+':histogram',
						opacity: 0.5
					};
					if ( chooseBins ) {
						config.nbinsx = nBins;
					}
					data.push( config );
					data.push({
						x: x,
						y: y,
						type: 'lines',
						name: key+':density',
					});
				} else {
					data.push({
						x: vals,
						type: 'histogram',
						name: key,
						opacity: overlapping ? 0.5 : 1.0
					});
				}
			}
			const layout = {
				xaxis: {title: 'Value' },
				yaxis: {title: overlayDensity ? 'Density' : 'Count' }
			};
			if ( overlapping ) {
				layout.barmode = 'overlay';
			}
			output = {
				variable: variable,
				type: 'Chart',
				value: <div>
					<label>{variable}: </label>
					<Plotly data={data} layout={layout} />
				</div>
			};
		}
		this.props.logAction( 'DATA_EXPLORER:HISTOGRAM', {
			variable, group, overlayDensity, overlapping, nBins
		});
		this.props.onCreated( output );
	}

	render() {
		const { variables, defaultValue, groupingVariables } = this.props;
		return (
			<Dashboard
				title="Histogram"
				autoStart={false}
				onGenerate={this.generateHistogram.bind( this )}
			>
				<SelectInput
					legend="Variable:"
					defaultValue={defaultValue || variables[ 0 ]}
					options={variables}
				/>
				<SelectInput
					legend="Group By:"
					options={groupingVariables}
					clearable={true}
				/>
				<CheckboxInput
					legend="Overlay Density"
					defaultValue={false}
				/>
				<CheckboxInput
					legend="Overlapping Bars (when grouped)"
					defaultValue={true}
				/>
				<div>
					<CheckboxInput
						legend="Choose # of bins"
						defaultValue={false}
						inline
					/>
					<SliderInput
						defaultValue={10}
						min={0}
						step={1}
						inline
					/>
				</div>
			</Dashboard>
		);
	}
}


// DEFAULT PROPERTIES //

Histogram.defaultProps = {
	defaultValue: null,
	onPlotDone() {}
};


// PROPERTY TYPES //

Histogram.propTypes = {
	data: PropTypes.object.isRequired,
	onCreated: PropTypes.func.isRequired
};


// EXPORTS //

export default Histogram;
