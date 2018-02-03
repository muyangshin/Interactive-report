// Berkeley colors
var calPalette = ['#003262', '#FDB515', '#B9D3B6', '#D9661F', '#00B0DA', '#DDD5C7'];

/* 
loads a bar chart
example: loadBarChart('data/df_sacm_by_concern_type.json', 'Figure 1: Number of Cases', 'concern_type', ['number_of_cases']);

	dataset: File path of the JSON file
	chart_title: Title of this chart
	chart_x: Categorical variable used for this bar chart;
	chart_values: Variable(s) that we are interested in; even if it is a single variable, it should be passed as an array
*/
function loadBarChart (dataset, chart_title, chart_x, chart_values, label_format = null) {
	// colors
	var chart_colors = {};
	chart_values.forEach(function(e, i) {
		chart_colors[e] = calPalette[i];
	})
	
	// reload chart
	chart.load({
		unload: true,
		url: dataset,
		mimeType: 'json',
		keys: {
			x: chart_x,
			value: chart_values
		},
		type: 'bar',
		colors: chart_colors,
		done: function() {
			if (label_format != null) {
				// data label
				switch(label_format) {
					// time: 2.5 -> 2h 30m
					case 'time':
						d3.select('.c3-chart-texts')
							.selectAll('.c3-texts')
							.each(function() {
								d3.select(this)
									.selectAll('text')
									.each(function(d, i) {
										var value_old = +d3.select(this).text();
										var h = Math.floor(value_old);
										var m = Math.floor((value_old - h) * 60);
										var value_new = (h > 0 ? h + 'h ' + m + 'm' : m + 'm');
										d3.select(this).text(value_new);
									});
							});
						break;
					default:
						alert('Incorrect label format name');
				}
				
			}
		}
	});

	// title
	d3.select('.c3-title').node().innerHTML = chart_title;
}

/* 
loads a pie chart
example: loadPieChart('data/df_sacm_crossover.json', 'Figure 3: Percentage of Transferred Cases', 'crossover', 'percentage');

	dataset: File path of the JSON file
	chart_title: Title of this chart
	chart_x: Categorical variable used for this bar chart;
	chart_values: Variable that we are interested in; 
*/
function loadPieChart (dataset, chart_title, chart_x, chart_value) {
	$.getJSON(dataset, function(jsonData) {
		// pie chart needs a slightly different data format. construct c3js-readable data/categories
		var data = {};
		var categories = [];
		jsonData.forEach(function(e) {
			categories.push(e[chart_x]);
			data[e[chart_x]] = e[chart_value];
		});

		// colors
		var chart_colors = {};
		categories.forEach(function(e, i) {
			chart_colors[e] = calPalette[i];
		})
		
		// reload chart
		chart.load({
			unload: true,
			json: [data],
			keys: {
				value: categories
			},
			type: 'pie',
			colors: chart_colors
		});
		
		// title
		d3.select('.c3-title').node().innerHTML = chart_title;
	});
	
}