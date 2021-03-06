// Dimension for chart area
var chart_width = 700;
var chart_height = 400;

// Berkeley colors
var calPalette = ['#003262', '#FDB515', '#B9D3B6', '#D9661F', '#00B0DA', '#DDD5C7'];

/*
determines a function to format data labels and tooltips
 
supported types:
	percent, percentage
	time: 2.5 -> 2h 30m
*/
function formatLabel (format_type) {
	switch(format_type) {
		case 'percent':
		case 'percentage':
			return d3.format(".1%");
			break;
		case 'percent_positive':
			return function (v, id, i, j) {
						return (formatLabel('percent'))(Math.abs(v));
					};
			break;
		case 'time':
			return function(v, id, i, j) {
					var h = Math.floor(v);
					var m = Math.floor((v - h) * 60);
					var v_new = (h > 0 ? h + 'h ' + m + 'm' : m + 'm');
					return v_new;
					};
			break;
		default:
			return null;
	}
}

/* 
uses formatLabel to return an object for data.labels
*/
function formatLabelObject (format_type) {
	var formatLabel_function = formatLabel(format_type);
	if (formatLabel_function == null) {
		return true;
	} else {
		return {format: formatLabel_function};
	}
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
function loadBarChart (div_id, dataset, chart_title, var_x, var_ys, label_format = null, y_range = null) {
	// chart obj
	var chart = null;
	
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
	
	$.getJSON(dataset, function(jsonData) {
		// tooltip titles
		var tooltip_titles = [];
		jsonData.forEach(function(e) {
			if (e[var_x + '_tooltip'] != undefined) {
				tooltip_titles.push(e[var_x + '_tooltip']);
			} else {
				tooltip_titles.push(e[var_x]);
			}
		});
		
		chart = c3.generate({
			bindto: "#" + div_id,
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
				labels: formatLabelObject(label_format),
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
			tooltip: {
				format : {
					title: function (d) {
						return tooltip_titles[d];
					},
					value: function (value, ratio, id) {
						if (formatLabel(label_format) == null) {
							return value;
						} else {
							return (formatLabel(label_format))(value);
						}
					}
				}
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
	})
	.done(function() {
		// store the object so that it can be destroyed later
		chart_objs.push(chart);
	});
}

/* 
loads a stacked bar chart.
example: loadStackedBarChart('data/bar_example.json', 'Stacked Bar Example', 'type', 'percentage', 'response');

	dataset: File path of the JSON file
	chart_title: Title of this chart
	var_x: Categorical variable used for this bar chart (for example, type: on-campus/off-campus); use null in case of one stacked bar
	var_y: Variable that we are interested in (for example, percentage);
	var_group: Variable to group by (for example, response: satisfied/dissatisfied)
	label_format (optional): See formatLabel. Use percent as default
		percent (default): numbers should add up to 1. Y axis will be hidden.
	y_range (optional): Range for y-axis. [y_min, y_max]
*/
function loadStackedBarChart (div_id, dataset, chart_title, var_x, var_y, var_group, label_format = 'percent', y_range = null) {
	// chart obj
	var chart = null;
	
	// handle percentage
	if (label_format == 'percentage') {
		label_format = 'percent'
	}
	
	$.getJSON(dataset, function(jsonData) {
		// construct data: converts narrow to wide
		if (var_x == null) {
			// single stacked bar
			var is_single_bar = true;
			
			var obj_data = {
				"type": var_group
			}
			var categories = [];			
			
			jsonData.forEach(function(e) {
				obj_data[e[var_group]] = e[var_y];
				categories.push(e[var_group]);
			});
			
			var data = [obj_data];
			
			// dummy category variable
			var_x = "type";
			
			// show x axis
			x_show = false;
		} else {
			// multiple stacked bars
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
			
			// show x axis
			x_show = true;
		}
		
		// colors
		var chart_colors = {};
		categories.forEach(function(e, i) {
			chart_colors[e] = calPalette[i];
		})
		
		// y axis
		var y_show = true;
		if (label_format == 'percent') {
			y_show = false;
		}
		
		// y axis range
		var y_min = null;
		var y_max = null;
		var y_padding = null;
		if (label_format == 'percent') {
			y_min = 0;
			y_max = 1;
			y_padding = {
				top: 100,
				bottom: 0
			};
		} else if (y_range != null) {
			y_min = y_range[0];
			y_max = y_range[1];
			y_padding = {
				top: 0,
				bottom: 0
			};
		}
		
		// bar width ratio
		bar_width_ratio = 0.6;
		if (is_single_bar) {
			y_padding = {
				top: 100,
				bottom: 100
			};
			bar_width_ratio = 0.3;
		}
		
		chart = c3.generate({
			bindto: "#" + div_id,
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
				labels: formatLabelObject(label_format),
				order: null
			},
			bar: {
				width: {
					ratio: bar_width_ratio
				}
			},
			axis: {
				x: {
					show: x_show,
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
			tooltip: {
				format : {
					value: function (value, ratio, id) {
						if (formatLabel(label_format) == null) {
							return value;
						} else {
							return (formatLabel(label_format))(value);
						}
					}
				}
			},
			title: {
				text: chart_title
			},
			color: {
				pattern: calPalette
			},
			onrendered: function () {
				d3.selectAll('div#' + div_id + ' .c3-chart-texts text').style('fill', 'black');
				
				// data label positioning
				if (label_format == 'percent') {
					if (is_single_bar) {
						var cum_x = 60;
						d3.selectAll('div#' + div_id + ' text.c3-text.c3-text-0')
							.each(function(d, i) {
								var x = +d3.select(this).attr("x");
								if (d.value >= 0.1) {
									d3.select(this).attr("x", x - 35);
								} else {
									d3.select(this).attr("x", x - 30);
								}

								if (d.value < 0.05) {
									d3.select(this).style('display', 'none');
								}
								
								if (i == 0) {
									d3.select(this).style('fill', 'white');
								}
						});
					} else {
						$.each(Object.keys(obj_data), function(index, value) {
							var cum_x = 0;
							d3.selectAll('div#' + div_id + ' text.c3-text.c3-text-' + index)
								.each(function(d, i) {
									var x = +d3.select(this).attr("x");
									if (d.value >= 0.1) {
										d3.select(this).attr("x", x - 35);
									} else {
										d3.select(this).attr("x", x - 30);
									}
									
									if (d.value < 0.05) {
										d3.select(this).style('display', 'none');
									}
									
									if (i == 0) {
										d3.select(this).style('fill', 'white');
									}
							});
						});
					}
				}
			}
		});
	})	
	.done(function() {
		// store the object so that it can be destroyed later
		chart_objs.push(chart);
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
function loadPieChart (div_id, dataset, chart_title, var_x, var_y) {
	// chart obj
	var chart = null;
	
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
		
		// generate chart
		chart = c3.generate({
			bindto: "#" + div_id,
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
	})
	.done(function() {
		// store the object so that it can be destroyed later
		chart_objs.push(chart);
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
function loadLineChart (div_id, dataset, chart_title, var_x, var_y, var_group, label_format = null, y_range = null) {
	// chart object
	var chart = null;
	
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

		// generate chart
		chart = c3.generate({
			bindto: "#" + div_id,
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
				labels: formatLabelObject(label_format),
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
			tooltip: {
				format : {
					value: function (value, ratio, id) {
						if (formatLabel(label_format) == null) {
							return value;
						} else {
							return (formatLabel(label_format))(value);
						}
					}
				}
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
	})
	.done(function() {
		// store the object so that it can be destroyed later
		chart_objs.push(chart);
	});
}

/* 
loads a diverging stacked bar chart.
example: loadDivergingStackedBarChart(div_id,
									'data/diverging_stacked_bar_example.json',
									'Diverging Stacked Bar Chart Example',
									'type',
									'percentage',
									'response',
									['Strongly Disagree', 'Moderately Disagree', 'Moderately Agree', 'Strongly Agree']
									);

	div_id: id of the div to bind this chart
	dataset: File path of the JSON file
	chart_title: Title of this chart
	var_x: Categorical variable used for this bar chart (for example, type (takes values of building A, B, C))
	var_y: Numerical variable that we are interested in (for example, percentage)
	var_group: Variable to group by (for example, response (takes values of 'Strongly Disagree', 'Moderately Disagree', ...))
	groups: Array of groups that we are interested in, from most negative to most positive; neutral response should be in the middle
*/
function loadDivergingStackedBarChart(div_id, dataset, chart_title, var_x, var_y, var_group, groups) {
	// chart obj
	var chart = null;
	
	$.getJSON(dataset, function(jsonData) {
		// construct data: same as in stacked bar chart
		// use an object as an intermediate step
		var obj_data = {};
		jsonData.forEach(function(e) {
			if (e[var_x] in obj_data) {
				obj_data[e[var_x]][e[var_group]] = e[var_y];
			} else {
				obj_data[e[var_x]] = {
					[var_x]: e[var_x],
					[e[var_group]]: e[var_y]
				};
			}
		});
		
		// construct data array
		var data = [];
		Object.keys(obj_data).forEach(function(e) {
			data.push(obj_data[e]);
		});
		
		// convert to diverging stacked bar
		// array of var_x's
		var xs = [];
		$.each(data, function (i, row) {
			xs.push(row[var_x]);
		});
		
		// display negative numbers as positive
		$.each(data, function (i, row) {				
			$.each(groups, function (j, group) {
				data[i][group] = data[i][group] * (j + 1 <= groups.length / 2 ? -1 : 1);
			});
			
		});
		
		// convert json to column array
		var data_columns = [];
		var categories = [];	// categories for var_group
		var group_neutral = null;
		$.each(groups, function (i, e_group) {
			if (i == (groups.length - 1) / 2) {
				// neutral response
				group_neutral = e_group;
				
				// negative part
				var row_array = [group_neutral + "0"];
				$.each(data, function (j, e_data) {
					row_array.push(-e_data[e_group] / 2);
				});
				data_columns.push(row_array);
				categories.push(group_neutral + "0");
				
				// positive part
				var row_array = [group_neutral + "1"];
				$.each(data, function (j, e_data) {
					row_array.push(e_data[e_group] / 2);
				});
				data_columns.push(row_array);
				categories.push(group_neutral + "1");
			} else {
				// other responses
				var row_array = [e_group];
				$.each(data, function (j, e_data) {
					row_array.push(e_data[e_group]);
				});
				data_columns.push(row_array);
				categories.push(e_group);
			}			
		});
		
		// stacking order: extreme responses should come first
		var stack_order = []
		var j = 0
		for (var i = 0; i < groups.length; i++) {
			// index; Strongly Disagree -> Moderately Disagree -> Strongly Agree -> Moderately Agree
			if (i >= groups.length / 2) {
				// positive
				j = groups.length - 1 - Math.floor(i - groups.length / 2);
				stack_order.push(groups[j]);
			} else if (i <= groups.length / 2 - 1) {
				// negative
				j = i;
				stack_order.push(groups[j]);
			}
		}
		// Neutral (neg part) -> Neutral (pos part)
		if (group_neutral != null) {
			stack_order.push(group_neutral + "0");
			stack_order.push(group_neutral + "1");
		}
		
		// colors
		if (groups.length == 4) {
			var chart_colors = ['#ed403c', '#f38e72', '#56c4c5', '#00acac'];
		} else if (groups.length == 5) {
			var chart_colors = ['#ed403c', '#f38e72', '#eeeeee', '#eeeeee', '#56c4c5', '#00acac'];
		} else if (groups.length == 6) {
			var chart_colors = ['#ed403c', '#f38e72', '#fdcfc0', '#56c4c5', '#bbe3e3', '#00acac'];
		} else if (groups.length == 7) {
			var chart_colors = ['#ed403c', '#f38e72', '#fdcfc0', '#eeeeee', '#eeeeee', '#56c4c5', '#bbe3e3', '#00acac'];
		}
			
		// y axis range
		var y_min = null;
		var y_max = null;
		var y_padding = null;
		
		// axes: set as y2
		var axes_object = {};
		$.each(categories, function(i, e) {
			axes_object[e] = 'y2';
		});
		
		console.log(categories);
		console.log(data_columns);
		console.log(stack_order);
		
		// generate chart
		chart = c3.generate({
			bindto: "#" + div_id,
			size: {
				width: chart_width,
				height: chart_height,
			},
			padding: {
				top: 20
			},
			data: {
				columns: data_columns,
				keys: {
					x: var_x
				},
				type: 'bar',
				groups: [categories],
				// labels: formatLabelObject('percent_positive'),
				labels: null,
				order: stack_order,
				axes: axes_object
			},
			bar: {
				width: {
					ratio: 0.5
				}
			},
			axis: {
				x: {
					show: true,
					type: 'category',
					categories: xs
				},
				y :{
					show: false
				},
				y2: {
					show: true,
					min: y_min,
					max: y_max,
					padding: y_padding,
					tick: {
						format: function (x) { 
							return (d3.format(".0%"))(Math.abs(x));
						}
					}
				},
				rotated: true
			},
			grid: {
				y: {
					lines: [
						{value: 0, axis: 'y2'}
					]
				}
			},
 			tooltip: {
				format : {
					value: function (value, ratio, id) {
						return (formatLabel('percent'))(Math.abs(value));
					}
				},
				contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
					// TODO: fix tooltip order
/* 					var d_new = new Array(groups.length).fill(null);
					
					var obj_group_index = {};
					$.each(groups, function (i, e) {
						obj_group_index[e] = i;
					});
					
					var neutral_total = 0;
					$.each(d, function(i, e) {
						if (group_neutral != null & e.id.substring(0, group_neutral.length) == group_neutral) {
							neutral_total += Math.abs(e.value);
						} else {
							d_new[obj_group_index[e.id]] = e;
						}
					});
					
					console.log(d_new);
					console.log(d_new[4]);
					if (group_neutral != null) {
						d_new[obj_group_index[group_neutral]] = {value: neutral_total, id: group_neutral + "0", name: group_neutral, x:d[0].x, index:d[0].index};
					} */			
				
					var d_new = [];
					var total = 0;
 					$.each(d, function(i, e) {
						if (e.id.substring(0, group_neutral.length) == group_neutral) {
							total += Math.abs(e.value);
						} else {
							d_new.push(e);
						}
					});
					d_new.push({value: total, id: group_neutral + "0", name: group_neutral, x:d[0].x, index:d[0].index});
					return this.getTooltipContent(d_new, defaultTitleFormat, defaultValueFormat, color);
				}
			},
			title: {
				text: chart_title
			},
			color: {
				pattern: chart_colors
			},
			onrendered: function () {
				d3.selectAll('div#' + div_id + ' .c3-chart-texts text').style('fill', 'black');
				
/* 				// data label positioning
				if (label_format == 'percent') {
					if (is_single_bar) {
						var cum_x = 60;
						d3.selectAll('div#' + div_id + ' text.c3-text.c3-text-0')
							.each(function(d, i) {
								var x = +d3.select(this).attr("x");
								if (d.value >= 0.1) {
									d3.select(this).attr("x", x - 35);
								} else {
									d3.select(this).attr("x", x - 30);
								}

								if (d.value < 0.05) {
									d3.select(this).style('display', 'none');
								}
								
								if (i == 0) {
									d3.select(this).style('fill', 'white');
								}
						});
					} else {
						$.each(Object.keys(obj_data), function(index, value) {
							var cum_x = 0;
							d3.selectAll('div#' + div_id + ' text.c3-text.c3-text-' + index)
								.each(function(d, i) {
									var x = +d3.select(this).attr("x");
									if (d.value >= 0.1) {
										d3.select(this).attr("x", x - 35);
									} else {
										d3.select(this).attr("x", x - 30);
									}
									
									if (d.value < 0.05) {
										d3.select(this).style('display', 'none');
									}
									
									if (i == 0) {
										d3.select(this).style('fill', 'white');
									}
							});
						});
					}
				} */
			}
		});
	})	
	.done(function() {
		// store the object so that it can be destroyed later
		chart_objs.push(chart);
	});
}