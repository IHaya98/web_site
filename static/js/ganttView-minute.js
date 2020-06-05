/*
jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/

/*
Options
-----------------
showWeekends: boolean
data: object
cellWidth: number
cellHeight: number
slideWidth: number
dataUrl: string
behavior: {
	clickable: boolean,
	draggable: boolean,
	resizable: boolean,
	onClick: function,
	onDrag: function,
	onResize: function
}
*/

(function (jQuery) {

	jQuery.fn.ganttView = function () {

		var args = Array.prototype.slice.call(arguments);

		if (args.length == 1 && typeof (args[0]) == "object") {
			build.call(this, args[0]);
		}

		if (args.length == 2 && typeof (args[0]) == "string") {
			handleMethod.call(this, args[0], args[1]);
		}
	};

	function build(options) {

		var els = this;
		var defaults = {
			showWeekends: true,
			cellWidth: 21,
			cellHeight: 31,
			slideWidth: 400,
			vHeaderWidth: 100,
			behavior: {
				clickable: true,
				draggable: true,
				resizable: true
			}
		};

		var opts = jQuery.extend(true, defaults, options);

		if (opts.data) {
			build();
		} else if (opts.dataUrl) {
			jQuery.getJSON(opts.dataUrl, function (data) { opts.data = data; build(); });
		}

		function build() {

			var minDays = Math.floor((opts.slideWidth / opts.cellWidth) + 5);
			var startEnd = DateUtils.getBoundaryDatesFromData(opts.data, minDays);
			opts.start = startEnd[0];
			opts.end = startEnd[1];

			els.each(function () {

				var container = jQuery(this);
				var div = jQuery("<div>", { "class": "ganttview" });
				new Chart(div, opts).render();
				container.append(div);

				var w = jQuery("div.ganttview-vtheader", container).outerWidth() +
					jQuery("div.ganttview-slide-container", container).outerWidth();
				container.css("width", (w + 2) + "px");

				new Behavior(container, opts).apply();
			});
		}
	}

	function handleMethod(method, value) {

		if (method == "setSlideWidth") {
			var div = $("div.ganttview", this);
			div.each(function () {
				var vtWidth = $("div.ganttview-vtheader", div).outerWidth();
				$(div).width(vtWidth + value + 1);
				$("div.ganttview-slide-container", this).width(value);
			});
		}
	}

	var Chart = function (div, opts) {

		function render() {
			addVtHeader(div, opts.data, opts.cellHeight);

			var slideDiv = jQuery("<div>", {
				"class": "ganttview-slide-container",
				"css": { "width": opts.slideWidth + "px" }
			});

			dates = getDates(opts.start, opts.end);
			addHzHeader(slideDiv, dates, opts.cellWidth);
			addGrid(slideDiv, opts.data, dates, opts.cellWidth, opts.showWeekends);
			addBlockContainers(slideDiv, opts.data);
			addBlocks(slideDiv, opts.data, opts.cellWidth, opts.start);
			div.append(slideDiv);
			applyLastClass(div.parent());
		}

		var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		// Creates a 3 dimensional array [year][month][day] of every day 
		// between the given start and end dates
		function getDates(start, end) {
			var dates = [];
			dates[start.getFullYear()] = [];
			dates[start.getFullYear()][start.getMonth()] = [];
			dates[start.getFullYear()][start.getMonth()][start.getDate()] = [];
			dates[start.getFullYear()][start.getMonth()][start.getDate()][start.getHours()] = [start];
			var last = start;
			while (last.compareTo(end) == -1) {
				var next = last.clone().addMinutes(15);
				if (!dates[next.getFullYear()]) { dates[next.getFullYear()] = []; }
				if (!dates[next.getFullYear()][next.getMonth()]) {
					dates[next.getFullYear()][next.getMonth()] = [];
				}
				if (!dates[next.getFullYear()][next.getMonth()][next.getDate()]) {
					dates[next.getFullYear()][next.getMonth()][next.getDate()] = [];
				}
				if (!dates[next.getFullYear()][next.getMonth()][next.getDate()][next.getHours()]) {
					dates[next.getFullYear()][next.getMonth()][next.getDate()][next.getHours()] = [];
				}
				dates[next.getFullYear()][next.getMonth()][next.getDate()][next.getHours()].push(next);
				last = next;
			}
			return dates;
		}

		function addVtHeader(div, data, cellHeight) {
			var headerDiv = jQuery("<div>", { "class": "ganttview-vtheader" });
			for (var i = 0; i < data.length; i++) {
				var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
				itemDiv.append(jQuery("<div>", {
					"class": "ganttview-vtheader-item-name",
					"css": { "height": (data[i].series.length * cellHeight) + "px" }
				}).append(data[i].name));
				var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
				for (var j = 0; j < data[i].series.length; j++) {
					seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" })
						.append(data[i].series[j].name));
				}
				itemDiv.append(seriesDiv);
				headerDiv.append(itemDiv);
			}
			div.append(headerDiv);
		}

		function addHzHeader(div, dates, cellWidth) {
			var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
			//var monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months" });
			var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" });
			var hoursDiv = jQuery("<div>", { "class": "ganttview-hzheader-hours" });
			var minutesDiv = jQuery("<div>", { "class": "ganttview-hzheader-minutes" });
			var totalW_d = 0;
			var totalW_h = 0;
			for (var y in dates) {
				for (var m in dates[y]) {
					for (var d in dates[y][m]) {
						var w_d = dates[y][m][d].length * 84;
						totalW_d = totalW_d + w_d;
						daysDiv.append(jQuery("<div>", {
							"class": "ganttview-hzheader-day",
							"css": { "width": (w_d - 1) + "px" }
						}).append(y + "/" + monthNames[m] + "/" + d));
						for (var h in dates[y][m][d]) {
							hoursDiv.append(jQuery("<div>", {
								"class": "ganttview-hzheader-hour",
								"css": { "width": (84 - 1) + "px" }
							}).append(h));
							for (var mi in dates[y][m][d][h]) {
								minutesDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-minute" })
									.append(dates[y][m][d][h][mi].getMinutes()));
							}
						}
					}
					// var w = dates[y][m].length * cellWidth;
					// totalW = totalW + w;
					// monthsDiv.append(jQuery("<div>", {
					// 	"class": "ganttview-hzheader-month",
					// 	"css": { "width": (totalWs+w - 1) + "px" }
					// }).append(y + "/" + m));
				}
			}
			// monthsDiv.css("width", totalWs + "px");
			daysDiv.css("width", totalW_d + "px");
			hoursDiv.css("width", totalW_d + "px");
			minutesDiv.css("width", totalW_d + "px");
			headerDiv.append(daysDiv).append(hoursDiv).append(minutesDiv);
			div.append(headerDiv);
		}

		function addGrid(div, data, dates, cellWidth, showWeekends) {
			var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
			var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" });
			for (var y in dates) {
				for (var m in dates[y]) {
					for (var d in dates[y][m]) {
						for (var h in dates[y][m][d]) {
							for (var mi in dates[y][m][d][h]) {
								var cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell" });
								if (DateUtils.isWeekend(dates[y][m][d][h][mi]) && showWeekends) {
									cellDiv.addClass("ganttview-weekend");
								}
								rowDiv.append(cellDiv);
							}
						}
					}
				}
			}
			var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
			rowDiv.css("width", w + "px");
			gridDiv.css("width", w + "px");
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					gridDiv.append(rowDiv.clone());
				}
			}
			div.append(gridDiv);
		}

		function addBlockContainers(div, data) {
			var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
				}
			}
			div.append(blocksDiv);
		}

		function addBlocks(div, data, cellWidth, start) {
			var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div);
			var rowIdx = 0;
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					var series = data[i].series[j];
					var size = DateUtils.hoursBetween(series.start, series.end) + 1;
					var offset = DateUtils.hoursBetween(start, series.start);
					var block = jQuery("<div>", {
						"class": "ganttview-block",
						"title": series.name + ", " + size + " hours",
						"css": {
							"width": ((size * cellWidth) - 9) + "px",
							"margin-left": ((offset * cellWidth) + 3) + "px"
						}
					});
					addBlockData(block, data[i], series);
					if (data[i].series[j].color) {
						block.css("background-color", data[i].series[j].color);
					}
					block.append(jQuery("<div>", { "class": "ganttview-block-text" }).text(size));
					jQuery(rows[rowIdx]).append(block);
					rowIdx = rowIdx + 1;
				}
			}
		}

		function addBlockData(block, data, series) {
			// This allows custom attributes to be added to the series data objects
			// and makes them available to the 'data' argument of click, resize, and drag handlers
			var blockData = { id: data.id, name: data.name };
			jQuery.extend(blockData, series);
			block.data("block-data", blockData);
		}

		function applyLastClass(div) {
			jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
			jQuery("div.ganttview-hzheader-minutes div.ganttview-hzheader-minute:last-child", div).addClass("last");
			jQuery("div.ganttview-hzheader-hours div.ganttview-hzheader-hour:last-child", div).addClass("last");
			jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
			jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
		}

		return {
			render: render
		};
	}

	var Behavior = function (div, opts) {

		function apply() {

			if (opts.behavior.clickable) {
				bindBlockClick(div, opts.behavior.onClick);
			}

			if (opts.behavior.resizable) {
				bindBlockResize(div, opts.cellWidth, opts.start, opts.behavior.onResize);
			}

			if (opts.behavior.draggable) {
				bindBlockDrag(div, opts.cellWidth, opts.start, opts.behavior.onDrag);
			}
		}

		function bindBlockClick(div, callback) {
			jQuery("div.ganttview-block", div).live("click", function () {
				if (callback) { callback(jQuery(this).data("block-data")); }
			});
		}

		function bindBlockResize(div, cellWidth, startDate, callback) {
			jQuery("div.ganttview-block", div).resizable({
				grid: cellWidth,
				handles: "e,w",
				stop: function () {
					var block = jQuery(this);
					updateDataAndPosition(div, block, cellWidth, startDate);
					if (callback) { callback(block.data("block-data")); }
				}
			});
		}

		function bindBlockDrag(div, cellWidth, startDate, callback) {
			jQuery("div.ganttview-block", div).draggable({
				axis: "x",
				grid: [cellWidth, cellWidth],
				stop: function () {
					var block = jQuery(this);
					updateDataAndPosition(div, block, cellWidth, startDate);
					if (callback) { callback(block.data("block-data")); }
				}
			});
		}

		function updateDataAndPosition(div, block, cellWidth, startDate) {
			var container = jQuery("div.ganttview-slide-container", div);
			var scroll = container.scrollLeft();
			var offset = block.offset().left - container.offset().left - 1 + scroll;

			// Set new start date
			var hoursFromStart = Math.round(offset / cellWidth);
			var newStart = startDate.clone().addHours(hoursFromStart);
			block.data("block-data").start = newStart;

			// Set new end date
			var width = block.outerWidth();
			var numberOfHours = Math.round(width / cellWidth) - 1;
			block.data("block-data").end = newStart.clone().addHours(numberOfHours);
			jQuery("div.ganttview-block-text", block).text(numberOfHours + 1);

			// Remove top and left properties to avoid incorrect block positioning,
			// set position to relative to keep blocks relative to scrollbar when scrolling
			block.css("top", "").css("left", "")
				.css("position", "relative").css("margin-left", offset + "px");
		}

		return {
			apply: apply
		};
	}

	var ArrayUtils = {

		contains: function (arr, obj) {
			var has = false;
			for (var i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
			return has;
		}
	};

	var DateUtils = {

		hoursBetween: function (start, end) {
			if (!start || !end) { return 0; }
			start = Date.parse(start); end = Date.parse(end);
			if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
			var count = 0, date = start.clone();
			while (date.compareTo(end) == -1) { count = count + 1; date.addHours(1); }
			return count;
		},

		daysBetween: function (start, end) {
			if (!start || !end) { return 0; }
			start = Date.parse(start); end = Date.parse(end);
			if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
			var count = 0, date = start.clone();
			while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
			return count;
		},

		isWeekend: function (date) {
			return date.getDay() % 6 == 0;
		},

		getBoundaryDatesFromData: function (data, minDays) {
			var minStart = new Date(); maxEnd = new Date();
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					var start = Date.parse(data[i].series[j].start);
					var end = Date.parse(data[i].series[j].end)
					if (i == 0 && j == 0) { minStart = start; maxEnd = end; }
					if (minStart.compareTo(start) == 1) { minStart = start; }
					if (maxEnd.compareTo(end) == -1) { maxEnd = end; }
				}
			}

			// Insure that the width of the chart is at least the slide width to avoid empty
			// whitespace to the right of the grid
			if (DateUtils.daysBetween(minStart, maxEnd) < minDays) {
				maxEnd = minStart.clone().addDays(minDays);
			}

			return [minStart, maxEnd];
		}
	};

})(jQuery);