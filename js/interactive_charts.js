// Berkeley colors
var calPalette = ['#003262', '#FDB515', '#B9D3B6', '#D9661F', '#00B0DA', '#DDD5C7'];

/* 
loads a bar chart
example: loadBarChart('data/bar_example.json', 'Bar Chart Example', 'concern_type', ['number_of_cases']);

	dataset: File path of the JSON file
	chart_title: Title of this chart
	var_x: Categorical variable used for this bar chart;
	var_ys: Variable(s) that we are interested in; even if it is a single variable, it should be passed as an array
	label_format (optional): currently only supports time
		time: 2.5 -> 2h 30m
*/
function loadBarChart (dataset, chart_title, var_x, var_ys, label_format = null) {
	// colors
	var chart_colors = {};
	var_ys.forEach(function(e, i) {
		chart_colors[e] = calPalette[i];
	})
	
	// reload chart
	chart.load({
		unload: true,
		url: dataset,
		mimeType: 'json',
		keys: {
			x: var_x,
			value: var_ys
		},
		type: 'bar',
		colors: chart_colors,
		done: function() {
			if (label_format != null) {
				// show y axis
				d3.select('.c3-axis.c3-axis-y')
					.style("visibility", "visible");
					
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
loads a stacked bar chart.
example: loadStackedBarChart('data/bar_example.json', 'Stacked Bar Example', 'type', 'percentage', 'response');

	dataset: File path of the JSON file
	chart_title: Title of this chart
	var_x: Categorical variable used for this bar chart (for example, type: on-campus/off-campus)
	var_y: Variable that we are interested in (for example, percentage);
	var_group: Variable to group by (for example, response: satisfied/dissatisfied)
	label_format: 
		percent (default): numbers should add up to 1. Y axis will be hidden.
		time: 2.5 -> 2h 30m
*/
function loadStackedBarChart (dataset, chart_title, var_x, var_y, var_group, label_format = 'percent') {
	$.getJSON(dataset, function(jsonData) {
		// converts narrow data to wide
		// use an object as an intermediate step
		var obj_data = {};
		var categories = [];	// categories for var_group
		jsonData.forEach(function(e) {
			if (e[var_x] in obj_data) {
				obj_data[e[var_x]][e[var_group]] = e[var_y];
			} else {
				obj_data[e[var_x]] = {
					[var_x]: e[var_x],
					[e[var_group]]: e[var_y]
				};
			}
			
			if (!(categories.includes(e[var_group]))) {
				categories.push(e[var_group]);
			}
		});
		
		// construct data array
		var data = [];
		Object.keys(obj_data).forEach(function(e) {
			data.push(obj_data[e]);
		});
		
		// colors
		var chart_colors = {};
		categories.forEach(function(e, i) {
			chart_colors[e] = calPalette[i];
		})
	
		// reload chart
		chart.load({
			unload: true,
			json: data,
			keys: {
				x: var_x,
				value: categories
			},
			type: 'bar',
	 		colors: chart_colors,
			done: function() {
				// grouping
				chart.groups([categories]);
	
				// show/hide y axis
				if (label_format == 'percent') {
					d3.select('.c3-axis.c3-axis-y')
						.style("visibility", "hidden");
				} else {
					d3.select('.c3-axis.c3-axis-y')
						.style("visibility", "visible");
				}
				
 				// data label
				switch(label_format) {
					case 'percent':
						d3.select('.c3-chart-texts')
							.selectAll('.c3-texts')
							.each(function() {
								d3.select(this)
									.selectAll('text')
									.each(function(d, i) {
										var value_old = +d3.select(this).text();
										var value_new = Math.round(value_old * 10000) / 100 + '%';
										d3.select(this).text(value_new);
									});
							});
						break;
					
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
						alert('Incorrect data label format!');
				} 
				
			} 
		});

		// title
		d3.select('.c3-title').node().innerHTML = chart_title;
	});
}

/* 
loads a pie chart
example: loadPieChart('data/pie_example.json', 'Pie Chart Example', 'crossover', 'percentage');

	dataset: File path of the JSON file
	chart_title: Title of this chart
	var_x: Categorical variable used for this bar chart;
	var_ys: Variable that we are interested in; 
*/
function loadPieChart (dataset, chart_title, var_x, var_y, label_format = null) {
	$.getJSON(dataset, function(jsonData) {
		// converts narrow data to wide
		var data = {};
		var categories = [];
		jsonData.forEach(function(e) {
			categories.push(e[var_x]);
			data[e[var_x]] = e[var_y];
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
