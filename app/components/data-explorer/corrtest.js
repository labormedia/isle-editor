// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NumberInput from 'components/input/number';
import SelectInput from 'components/input/select';
import Dashboard from 'components/dashboard';
import TeX from 'components/tex';
import pcorrtest from '@stdlib/math/statistics/pcorrtest';


// MAIN //

class CorrTest extends Component {

	constructor( props ) {

		super( props );

		this.calculateCorrTest = ( var1, var2, rho0, direction, alpha ) => {
			const { data } = this.props;
			const x = data[ var1 ];
			const y = data[ var2 ];
			const result = pcorrtest( x, y, {
				'alpha': alpha,
				'alternative': direction,
				'rho': rho0
			});
			let arrow = '\\ne';
			if ( direction === 'less' ) {
				arrow = '<';
			} else if ( direction === 'greater' ){
				arrow = '>';
			}
			const output = {
				variable: `Test for correlation between ${var1} and ${var2}`,
				type: 'Test',
				value: <div>
					<label>Hypothesis test for correlation between {var1} and {var2}:</label>
					<TeX displayMode raw={`H_0: \\rho = ${rho0} \\; vs. \\; H_1: \\rho ${arrow} ${rho0}`} tag="" />
					<pre>
						{result.print()}
					</pre>
				</div>
			};
			this.props.logAction( 'DATA_EXPLORER:TESTS:CORRTEST', {
				var1, var2, rho0, direction, alpha
			});
			this.props.onCreated( output );
		};
	}

	render() {
		const { continuous } = this.props;
		return (
			<Dashboard
				title="Correlation Test"
				label="Calculate"
				autoStart={false}
				onGenerate={this.calculateCorrTest}
			>
				<SelectInput
					legend="Variable:"
					defaultValue={continuous[ 0 ]}
					options={continuous}
				/>
				<SelectInput
					legend="Variable:"
					defaultValue={continuous[ 1 ]}
					options={continuous}
				/>
				<NumberInput
					legend={<TeX raw="\rho_0" />}
					defaultValue={0.0}
					step="any"
					min={-1.0}
					max={1.0}
				/>
				<SelectInput
					legend="Direction:"
					defaultValue="two-sided"
					options={[ 'less', 'greater', 'two-sided' ]}
				/>
				<NumberInput
					legend={<span>Significance level <TeX raw="\alpha" /></span>}
					defaultValue={0.05}
					min={0.0}
					max={1.0}
					step="any"
				/>
			</Dashboard>
		);
	}
}


// PROPERTY TYPES //

CorrTest.propTypes = {
	data: PropTypes.object.isRequired,
	onCreated: PropTypes.func.isRequired
};


// EXPORTS //

export default CorrTest;
