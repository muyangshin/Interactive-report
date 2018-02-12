// Dimension for chart area
var chart_width = 700;
var chart_height = 400;

// Berkeley colors
var calPalette = ['#003262', '#FDB515', '#B9D3B6', '#D9661F', '#00B0DA', '#DDD5C7'];

/*
 returns an object for data label formatting
 
 supported types:
	percent, percentage
	time: 2.5 -> 2h 30m
*/
function formatLabel (format_type) {
	switch(format_type) {
		case 'percent':
		case 'percentage':
			label_format_object = { format: d3.format(".2%") };
			break;
		case 'time':
			label_format_object = {
				format: function(v, id, i, j) {
					var h = Math.floor(v);
					var m = Math.floor((v - h) * 60);
					var v_new = (h > 0 ? h + 'h ' + m + 'm' : m + 'm');
					return v_new;
				}
			};
			break;
		default:
			label_format_object = true;
	}
	
	return label_format_object;
}
		
		
/* 
loads a bar chart
example: loadBarChart('data/bar_example.json', 'Bar Chart Example', 'concern_type', ['number_of_cases']);

	dataset: File path of the JSON file
	chart_title: Title of this chart
	var_x: Categorical variable used for this bar chart;
	var_ys: Variable(s) that we are interested in; even if it is a single variable, it should be passed as an array
	label_format (optional): see formatLabel
	y_range (optional): Range for y-axis. [y_min, y_max]
*/
function loadBarChart (dataset, chart_title, var_x, var_ys, label_format = null, y_range = null) {
	// colors
	var chart_colors = {};
	var_ys.forEach(function(e, i) {
		chart_colors[e] = calPalette[i];
	})
	
	// y axis range
	var y_min = null;
	var y_max = null;
	var y_padding = null;
	if (y_range != null) {
		y_min = y_range[0];
		y_max = y_range[1];
		y_padding = {
			top: 0,
			bottom: 0
		};
	}
	
	// reload chart
	chart.load({
		unload: true,
		done: function() {
			chart = chart.destroy();
			chart = c3.generate({
				size: {
					width: chart_width,
					height: chart_height,
				},
				data: {
					url: dataset,
					mimeType: 'json',
					keys: {
						x: var_x,
						value: var_ys
					},
					type: 'bar',
					labels: formatLabel(label_format),
					// colors: chart_colors,
					order: null
				},
				axis: {
					x: {
						type: 'category'
					},
					y: {
						min: y_min,
						max: y_max,
						padding: y_padding
					},
					rotated: true
				},
				title: {
					text: chart_title
				},
				color: {
					pattern: calPalette
				},
				onrendered: function () {
					d3.selectAll('.c3-chart-texts text').style('fill', 'black');
				}
			});
		}
	});
}

/* 
loads a stacked bar chart.
example: loadStackedBarChart('data/bar_example.json', 'Stacked Bar Example', 'type', 'percentage', 'response');

	dataset: File path of the JSON file
	chart_title: Title of this chart
	var_x: Categorical variable used for this bar chart (for example, type: on-campus/off-campus)
	var_y: Variable that we are interested in (for example, percentage);
	var_group: Variable to group by (for example, response: satisfied/dissatisfied)
	label_format (optional): See formatLabel. Use percent as default
		percent (default): numbers should add up to 1. Y axis will be hidden.
	y_range (optional): Range for y-axis. [y_min, y_max]
*/
function loadStackedBarChart (dataset, chart_title, var_x, var_y, var_group, label_format = 'percent', y_range = null) {
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
		
		// y axis
		var y_show = true;
		if (label_format == 'percent' || label_format == 'percentage') {
			y_show = false;
		}
		
		var y_min = null;
		var y_max = null;
		var y_padding = null;
		if (y_range != null) {
			y_min = y_range[0];
			y_max = y_range[1];
			y_padding = {
				top: 0,
				bottom: 0
			};
		}
		
		// reload chart
		chart.load({
			unload: true,
			done: function() {
				chart = chart.destroy();
				chart = c3.generate({
					size: {
						width: chart_width,
						height: chart_height,
					},
					data: {
						json: data,
						keys: {
							x: var_x,
							value: categories
						},
						type: 'bar',
						groups: [categories],
						labels: formatLabel(label_format),
						// colors: chart_colors,
						order: null
					},
					axis: {
						x: {
							type: 'category'
						},
						y :{
							show: y_show,
							min: y_min,
							max: y_max,
							padding: y_padding
						},
						rotated: true
					},
					title: {
						text: chart_title
					},
					color: {
						pattern: calPalette
					}
				});
				
				d3.selectAll('.c3-chart-texts text').style('fill', '#003262');
			}
		});
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
function loadPieChart (dataset, chart_title, var_x, var_y) {
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
			done: function () {
				chart = chart.destroy();
				chart = c3.generate({
					size: {
						width: chart_width,
						height: chart_height,
					},
					data: {
						json: [data],
						keys: {
							value: categories
						},
						type: 'pie',
						// colors: chart_colors,
						labels: true,
						order: null
					},
					axis: {
						x: {
							type: 'category'
						},
						rotated: false
					},
					title: {
						text: chart_title
					},
					color: {
						pattern: calPalette
					}
				});
			}
		});
	});
	
}

/* 
loads a line chart.
example: loadLineChart('data/line_example.json', Line Chart Example', 'Year', 'Score', 'Factor');
	dataset: File path of the JSON file
	chart_title: Title of this chart
	var_x: Variable for x-axis (for example, year) (NOTE: this chart is not rotated)
	var_y: Variable for y-axis (for example, score) (NOTE: this chart is not rotated)
	var_group: Variable that we want to use to group data (for example, factor_type)
	label_format (optional): See formatLabel
	y_range (optional): Range for y-axis. [y_min, y_max]
*/
function loadLineChart (dataset, chart_title, var_x, var_y, var_group, label_format = null, y_range = null) {
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
		
		// Y axis
		var y_min = null;
		var y_max = null;
		var y_padding = null;
		if (y_range != null) {
			y_min = y_range[0];
			y_max = y_range[1];
			y_padding = {
				top: 0,
				bottom: 0
			};
		}

		// reload chart
		chart.load({
			unload: true,
			done: function () {
				chart = chart.destroy();
				chart = c3.generate({
					size: {
						width: chart_width,
						height: chart_height,
					},
					data: {
						json: data,
						keys: {
							x: var_x,
							value: categories
						},
						type: 'line',
						// colors: chart_colors,
						labels: formatLabel(label_format),
						order: null
					},
					axis: {
						x: {
							type: 'category'
						},
						y: {
							min: y_min,
							max: y_max,
							padding: y_padding
						},
						rotated: false
					},
					title: {
						text: chart_title
					},
					color: {
						pattern: calPalette
					}
				});
				
				d3.selectAll('.c3-chart-texts text').style('fill', '#003262');
			}
		});
	});
}