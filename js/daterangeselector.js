/**
* @version: 1.0
* @author: Javier Negre
* @date: 2013-01-06
* @license: Licensed under Apache License v2.0. See http://www.apache.org/licenses/LICENSE-2.0
*/
/**
* This code is based on the work of Dan Grossman http://www.dangrossman.info/
* More info at http://www.dangrossman.info/2012/08/20/a-date-range-picker-for-twitter-bootstrap/
*/
!function ($) {

	var DateRangePicker = function (element, options, cb) {
		var hasOptions = typeof options == 'object'
		var localeObject;

		this.startDate = Date.today();
		this.endDate = Date.today();
		this.refDate = Date.today();
		this.tempDate = [this.startDate, this.endDate];
		// Default maximum date is today
		this.maxDate = Date.today();
		this.minDate = Date.today().set({ day: 1, month: 0, year: 1970 });
		this.changed = false;
		this.ranges = {};
		this.rangeActions = {};
		this.opens = 'right';
		this.cb = function () { };
		this.format = 'MM/dd/yyyy';
		this.locale = {
			applyLabel:"Apply",
			fromLabel:"From",
			toLabel:"To",
			allRangeLabel:"All",
			customRangeLabel:"Custom Range",
			daysOfWeek:['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr','Sa'],
			monthNames:['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			firstDay:0
		};
		this.allRange = false;
		this.allRangeEnabled = false;

		localeObject = this.locale;

		var twoMonthsAgoYear = (this.refDate.getMonth() < 2)
			? this.refDate.clone().addYears(-1).getFullYear()
			: this.refDate.getFullYear() ;
		this.leftCalendar = {
			month: Date.today().set({ day: 1, month: this.refDate.clone().addMonths(-2).getMonth(), year: twoMonthsAgoYear }),
			calendar: Array()
		};

		var oneMonthAgoYear = (this.refDate.getMonth() < 1)
			? this.refDate.clone().addYears(-1).getFullYear()
			: this.refDate.getFullYear() ;
		this.midCalendar = {
			month: Date.today().set({ day: 1, month: this.refDate.clone().addMonths(-1).getMonth(), year: oneMonthAgoYear }),
			calendar: Array()
		};

		this.rightCalendar = {
			month: Date.today().set({ day: 1, month: this.refDate.getMonth(), year: this.refDate.getFullYear() }),
			calendar: Array()
		};

		//element that triggered the date range picker
		this.element = $(element);

		if (this.element.hasClass('pull-right'))
			this.opens = 'left';

		if (this.element.is('input')) {
			this.element.on({
				click: $.proxy(this.show, this),
				focus: $.proxy(this.show, this),
				blur: $.proxy(this.hide, this)
			});
		} else {
			this.element.on('click', $.proxy(this.show, this));
		}

		if (hasOptions) {
			if(typeof options.locale == 'object') {
				$.each(localeObject, function (property, value) {
					localeObject[property] = options.locale[property] || value;
				});
			}
		}

		var DRPTemplate = '<div class="daterangepicker dropdown-menu">' +
				'<div class="calendarWrapper">' +
					'<div class="nav">' +
						'<div class="btn btn-mini navButton prevYear"><i class="icon-arrow-left"></i><i class="icon-arrow-left"></i></div>' +
						'<div class="btn btn-mini navButton prev"><i class="icon-arrow-left"></i></div>' +
						'<div class="btn btn-mini navButton today">today</div>' +
						'<div class="btn btn-mini navButton next"><i class="icon-arrow-right"></i></div>' +
						'<div class="btn btn-mini navButton nextYear"><i class="icon-arrow-right"></i><i class="icon-arrow-right"></i></div>' +
					'</div>' +
					'<div class="calendar left"></div>' +
					'<div class="calendar mid"></div>' +
					'<div class="calendar right"></div>' +
				'</div>' +
				'<div class="ranges">' +
					'<div class="range_inputs">' +
						'<div style="float: left">' +
							'<label for="daterangepicker_start">' + this.locale.fromLabel + '</label>' +
							'<input id="daterangepicker_start" class="date-input input-mini" type="text" name="daterangepicker_start" value="" placeholder="mmddyyyy" />' +
						'</div>' +
						'<div style="float: left; padding-left: 11px">' +
							'<label for="daterangepicker_end">' + this.locale.toLabel + '</label>' +
							'<input id="daterangepicker_end" class="date-input input-mini" type="text" name="daterangepicker_end" value="" placeholder="mmddyyyy" />' +
						'</div>' +
						'<button class="btn btn-small btn-success" disabled="disabled">' + this.locale.applyLabel + '</button>' +
					'</div>' +
					'<div class="range_presets"></div>' +
				'</div>' +
			'</div>';

		//the date range picker
		this.container = $(DRPTemplate).appendTo('body');

		if (hasOptions) {

			this.allRange = options.allRange || this.allRange;
			this.allRangeEnabled = options.allRangeEnabled || this.allRangeEnabled;

			if (typeof options.maxDate == 'string') {
				this.maxDate = Date.parse(options.maxDate, this.format);
			}
			if (typeof options.minDate == 'string') {
				this.minDate = Date.parse(options.minDate, this.format);
				if (this.minDate.isAfter(this.maxDate)) {
					this.minDate = this.maxDate;
				}
			}

			if (typeof options.ranges == 'object') {

				var list = '<ul>';
				for (var range in options.ranges) {

					if (options.ranges[range].type == 'enabled') {
						var start = options.ranges[range].dates[0];
						var end = options.ranges[range].dates[1];

						if (typeof start == 'string')
							start = Date.parse(start);
						if (typeof end == 'string')
							end = Date.parse(end);

						this.ranges[range] = [start, end];
						list += '<li class="range-enabled">' + range + '</li>';
					} else {
						var elId = 'range-' + range.replace(/\s/g, "-");
						var elClass = 'range-' + options.ranges[range].type;
						this.rangeActions[range] = options.ranges[range].action;
						this.rangeActions[range].id = elId;
						list += '<li id="' + elId + '" class="' + elClass + '">' + range + '</li>';
					}
				}

				if (this.allRange) {
					var idname = 'range-all-range';
					if (this.allRangeEnabled) {
						list += '<li id="' + idname + '" class="range-enabled">' + this.locale.allRangeLabel + '</li>';
					} else {
						list += '<li id="' + idname + '" class="range-upgrade">' +
								'<a href="' + options.allRangeLink + '">' +
									'<span class="li-text">' + this.locale.allRangeLabel + '</span>' +
									'<span class="upsell-btn-mini">Upgrade</span>' +
								'</a>' +
							'</li>';
					}
					this.ranges[this.locale.allRangeLabel] = [this.minDate, this.maxDate];
				}
				list += '</ul>';
				this.container.find('.range_presets').append(list);
			}

			if (typeof options.format == 'string')
				this.format = options.format;

			if (typeof options.startDate == 'string')
				this.startDate = Date.parse(options.startDate, this.format);

			if (typeof options.endDate == 'string')
				this.endDate = Date.parse(options.endDate, this.format);

			// update day names order to firstDay
			if (typeof options.locale == 'object') {
				if (typeof options.locale.firstDay == 'number') {
					this.locale.firstDay = options.locale.firstDay;
					var iterator = options.locale.firstDay;
					while (iterator > 0) {
						this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
						iterator--;
					}
				}
			}

			if (typeof options.opens == 'string')
				this.opens = options.opens;
		}

		if (typeof cb == 'function')
			this.cb = cb;

		this.container.addClass('opens' + this.opens);

		//event listeners
		this.container.on('mousedown', $.proxy(this.mousedown, this));
		this.container.find('.date-input').on('mousedown', $.proxy(this.inputDateFocus, this));
		this.container.find('.date-input').on('blur', $.proxy(this.inputDateBlurEvent, this));
		this.container.find('.calendarWrapper').on('click', '.prevYear', $.proxy(this.clickPrevYear, this));
		this.container.find('.calendarWrapper').on('click', '.prev', $.proxy(this.clickPrev, this));
		this.container.find('.calendarWrapper').on('click', '.today', $.proxy(this.clickToday, this));
		this.container.find('.calendarWrapper').on('click', '.next', $.proxy(this.clickNext, this));
		this.container.find('.calendarWrapper').on('click', '.nextYear', $.proxy(this.clickNextYear, this));
		this.container.find('.range_inputs').on('click', 'button', $.proxy(this.clickApply, this));

		this.container.find('.calendar').on('click', 'td', $.proxy(this.clickDate, this));
		this.container.find('.calendar').on('click', 'th.cal-month', $.proxy(this.clickMonth, this));
		this.container.find('.ranges ul li.range-enabled').on('click', $.proxy(this.clickRange, this));

		for (var range in this.rangeActions) {
			var el = $('#' + this.rangeActions[range].id);
			var elFn = this.rangeActions[range].func;
			el[elFn](this.rangeActions[range].options);
		}

		this.element.on('keyup', $.proxy(this.updateFromControl, this));

		this.updateView();
		this.updateCalendars();

	};

	DateRangePicker.prototype = {

		constructor: DateRangePicker,

		mousedown: function (e) {
			e.stopPropagation();
			e.preventDefault();
		},

		updateView: function () {

			this.setCalendarMonths();

			this.updateStartEndInputs(this.startDate, this.endDate);

			if (this.startDate.equals(this.endDate) || this.startDate.isBefore(this.endDate)) {
				this.container.find('button').removeAttr('disabled');
			} else {
				this.container.find('button').attr('disabled', 'disabled');
			}
		},

		updateFromControl: function () {
			if (!this.element.is('input')) return;

			var dateString = this.element.val().split(" - ");
			var start = Date.parseExact(dateString[0], this.format);
			var end = Date.parseExact(dateString[1], this.format);

			if (start == null || end == null) return;
			if (end.isBefore(start)) return;

			this.startDate = start;
			this.endDate = end;

			this.updateView();
			this.cb(this.startDate, this.endDate);
			this.updateCalendars();
		},

		notify: function () {
			this.updateView();

			var sDate = null;
			var eDate = null;
			if (this.isRangeChanging()) {
				sDate = this.tempDate[0];
				eDate = this.tempDate[0];
			} else {
				sDate = this.startDate;
				eDate = this.endDate;
			}
			if (this.element.is('input')) {
				this.element.val(sDate.toString(this.format) + ' - ' + eDate.toString(this.format));
			}
			this.updateStartEndInputs(sDate, eDate);
			this.cb(sDate, eDate);
		},

		move: function () {
			if (this.opens == 'left') {
				this.container.css({
					top: this.element.offset().top + this.element.outerHeight(),
					right: $(window).width() - this.element.offset().left - this.element.outerWidth(),
					left: 'auto'
				});
			} else {
				this.container.css({
					top: this.element.offset().top + this.element.outerHeight(),
					left: this.element.offset().left,
					right: 'auto'
				});
			}
		},

		show: function (e) {
			this.container.show();
			this.move();

			if (e) {
				e.stopPropagation();
				e.preventDefault();
			}

			if (this.isRangeChanging()) {
				var inputFocus = '_end';
				var inputBlur = '_start';
			} else {
				var inputFocus = '_start';
				var inputBlur = '_end';
			}
			$('#daterangepicker' + inputBlur).removeClass('input-selected');
			$('#daterangepicker' + inputFocus).addClass('input-selected');

			this.changed = false;

			$(document).on('mousedown', $.proxy(this.hide, this));
		},

		hide: function (e) {
			this.container.hide();
			$(document).off('mousedown', this.hide);

			if (this.changed)
				this.notify();
		},

		clickRange: function (e) {
			var label = e.target.innerHTML;
			var dates = this.ranges[label];

			this.startDate = dates[0];
			this.endDate = dates[1];

			this.setCalendarMonths();
			this.updateCalendars();

			this.changed = true;

			this.tempDate[0] = dates[0];
			this.tempDate[1] = dates[1];

			this.hide();
		},

		clickPrevYear: function (e) {
			this.refDate.addYears(-1).getMonth();
			this.setCalendarMonths();
			this.updateCalendars();
		},

		clickPrev: function (e) {
			this.refDate.addMonths(-1).getMonth();
			this.setCalendarMonths();
			this.updateCalendars();
		},

		clickToday: function (e) {
			this.refDate = Date.today();
			this.setCalendarMonths();
			this.updateCalendars();
		},

		clickNext: function (e) {
			this.refDate.addMonths(1).getMonth();
			this.setCalendarMonths();
			this.updateCalendars();
		},

		clickNextYear: function (e) {
			this.refDate.addYears(1).getMonth();
			this.setCalendarMonths();
			this.updateCalendars();
		},

		clickDate: function (e) {

			if ($(e.target).hasClass('disabled')) {
				return;
			}

			var rel = $(e.target).attr('rel');
			var row = rel.substr(1, 1);
			var col = rel.substr(3, 1);
			var cal = $(e.target).parents('.calendar');
			var calPos = null;

			if (cal.hasClass('left')) {
				calPos = 'leftCalendar';
			} else if (cal.hasClass('mid')) {
				calPos = 'midCalendar';
			} else {
				calPos = 'rightCalendar';
			}

			var date = this[calPos].calendar[row][col];

			if (this.isRangeChanging()) {
				this.setRangeDate('end', date);
				this.checkRangeDate(); // Checks range integrity
				this.startDate = this.tempDate[0];
				this.endDate = this.tempDate[1];
			} else {
				this.startDate = date;
				this.endDate = date;
				this.setRangeDate('start', date);
				this.setRangeChange();
			}
			this.updateCalendars();
			this.updateStartEndInputs(this.startDate, this.endDate);
			this.changed = true;

		},

		clickMonth: function (e) {
			var rel = $(e.target).attr('rel');
			var m = rel.substr(0, 2);
			var y = rel.substr(2, 4);

			var monthStart = Date.today().set({ day: 1, month: parseInt(m,10)-1, year: parseInt(y,10) });
			var monthEnd = monthStart.clone().moveToLastDayOfMonth();

			// Control that month is in within a valid range
			if (monthStart.isAfter(this.maxDate)
					|| monthEnd.isBefore(this.minDate)) {
				return; // Nothing happens
			}

			if (monthStart.isBefore(this.minDate)) {
				monthStart = this.minDate;
			}
			if (monthEnd.isAfter(this.maxDate)) {
				monthEnd = this.maxDate;
			}

			this.startDate = monthStart;
			this.tempDate[0] = monthStart;
			this.endDate = monthEnd;
			this.tempDate[1] = monthEnd;

			this.setCalendarMonths();
			this.updateCalendars();
			this.updateStartEndInputs(this.startDate, this.endDate);
			this.changed = true;

		},

		clickApply: function (e) {
			var focus = this.container.find(':focus');
			if (focus.length > 0) {
				this.inputDateBlur(focus);
			}

			if (this.isRangeChanging()) {
				this.startDate, this.endDate, this.tempDate[1] = this.tempDate[0];
				// The date has been already notified (.notify())
			} else {
				this.notify();
			}
			this.hide();
		},

		updateCalendars: function () {

			this.leftCalendar.calendar = this.buildCalendar(this.leftCalendar.month.getMonth(), this.leftCalendar.month.getFullYear());
			this.midCalendar.calendar = this.buildCalendar(this.midCalendar.month.getMonth(), this.midCalendar.month.getFullYear());
			this.rightCalendar.calendar = this.buildCalendar(this.rightCalendar.month.getMonth(), this.rightCalendar.month.getFullYear());
			this.container.find('.calendar.left').html(this.renderCalendar(this.leftCalendar.calendar));
			this.container.find('.calendar.mid').html(this.renderCalendar(this.midCalendar.calendar));
			this.container.find('.calendar.right').html(this.renderCalendar(this.rightCalendar.calendar));

		},

		buildCalendar: function (month, year) {

			var firstDay = Date.today().set({ day: 1, month: month, year: year });
			var lastMonth = firstDay.clone().add(-1).day().getMonth();
			var lastYear = firstDay.clone().add(-1).day().getFullYear();

			var daysInMonth = Date.getDaysInMonth(year, month);
			var daysInLastMonth = Date.getDaysInMonth(lastYear, lastMonth);

			var dayOfWeek = firstDay.getDay();

			//initialize a 6 rows x 7 columns array for the calendar
			var calendar = Array();
			for (var i = 0; i < 6; i++) {
				calendar[i] = Array();
			}

			//populate the calendar with date objects
			var startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
			if (dayOfWeek == 0)
				startDay = daysInLastMonth - 6 + this.locale.firstDay;

			var curDate = Date.today().set({ day: startDay, month: lastMonth, year: lastYear });
			for (var i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = curDate.clone().add(1).day()) {
				if (i > 0 && col % 7 == 0) {
					col = 0;
					row++;
				}
				calendar[row][col] = curDate;
			}

			return calendar;

		},

		renderCalendar: function (calendar) {

			var html = '<table>';
			html += '<thead>';
			html += '<tr>';
			html += '<th class="cal-month" rel="' + calendar[1][1].toString("MMyyyy") + '" colspan="7">' + calendar[1][1].toString("MMMM yyyy") + '</th>';
			html += '</tr>';

			html += '<tr>';

			$.each(this.locale.daysOfWeek, function (index, dayOfWeek) {
				html += '<th class="cal-week-day">' + dayOfWeek + '</th>';
			});

			html += '</tr>';
			html += '</thead>';
			html += '<tbody>';

			for (var row = 0; row < 6; row++) {
				html += '<tr>';
				for (var col = 0; col < 7; col++) {
					var cname = (calendar[row][col].getMonth() == calendar[1][1].getMonth()) ? '' : 'off';
					if (this.isRangeChanging()
						&& calendar[row][col].equals(this.tempDate[0])
						&& (cname != 'off')) {
						cname = 'active';
					} else if (!this.isRangeChanging()
						&& (calendar[row][col].equals(this.startDate) || calendar[row][col].equals(this.endDate))
						&& (cname != 'off')) {
						cname = 'active';
					} else if (!this.isRangeChanging()
						&& (cname != 'off')
						&& calendar[row][col].isAfter(this.startDate)
						&& calendar[row][col].isBefore(this.endDate)) {
						cname = 'within';
					} else if (calendar[row][col].isBefore(this.minDate) || calendar[row][col].isAfter(this.maxDate)) {
						cname = 'disabled';
					}
					var relAttr = 'r' + row + 'c' + col;
					html += '<td class="' + cname + '" rel="' + relAttr + '">' + calendar[row][col].getDate() + '</td>';
				}
				html += '</tr>';
			}

			html += '</tbody>';
			html += '</table>';

			return html;

		},

		setCalendarMonths: function () {
			var twoMonthsAgoYear = (this.refDate.getMonth() < 2)
				? this.refDate.clone().addYears(-1).getFullYear()
				: this.refDate.getFullYear() ;
			this.leftCalendar.month.set({ month: this.refDate.clone().addMonths(-2).getMonth(), year: twoMonthsAgoYear });
			var oneMonthAgoYear = (this.refDate.getMonth() < 1)
				? this.refDate.clone().addYears(-1).getFullYear()
				: this.refDate.getFullYear() ;
			this.midCalendar.month.set({ month: this.refDate.clone().addMonths(-1).getMonth(), year: oneMonthAgoYear });
			this.rightCalendar.month.set({ month: this.refDate.getMonth(), year: this.refDate.getFullYear() });
		},

		setRangeDate: function (type, date) {
			if (type == 'start') {
				var idx = 0;
				var inputFocus = '_end';
				var inputBlur = '_start';
			} else {
				var idx = 1;
				var inputFocus = '_start';
				var inputBlur = '_end';
			}
			this.tempDate[idx] = date;
			$('#daterangepicker' + inputBlur).removeClass('input-selected');
			$('#daterangepicker' + inputFocus).addClass('input-selected');
		},

		setRangeChange: function () {
			this.tempDate[1] = null;
		},

		isRangeChanging: function () {
			return (this.tempDate[1] == null);
		},

		checkRangeDate: function () {
			if (this.tempDate[0].isAfter(this.tempDate[1])) {
				var auxDate = this.tempDate[0];
				this.tempDate[0] = this.tempDate[1];
				this.tempDate[1] = auxDate;
			}
		},

		updateStartEndInputs: function (start, end) {
			this.container.find('input[name=daterangepicker_start]').val(start.toString(this.format));
			this.container.find('input[name=daterangepicker_end]').val(end.toString(this.format));
		},

		inputDateFocus: function (e) {
			$(e.target).val('');
			$(e.target).focus();

			// Disable range selection after focusing an input
			if (this.isRangeChanging()) {
				this.tempDate[0] = this.startDate;
				this.tempDate[1] = this.endDate;
			}

			var inputFocus = $(e.target).attr('id');
			var inputBlur = (inputFocus == 'daterangepicker_start')
				? 'daterangepicker_end'
				: 'daterangepicker_start';
			$('#' + inputBlur).removeClass('input-selected');
			$('#' + inputFocus).addClass('input-selected');
		},

		inputDateBlurEvent: function (e) {
			this.inputDateBlur($(e.target));
		},

		inputDateBlur: function (element) {
			var value = element.val();
			var dateFormats = ['MMddyyyy', 'M/d/yyyy', 'M-d-yyyy'];
			var startEnd = (element.attr('id') == 'daterangepicker_start')
				? 'startDate'
				: 'endDate';
			var inputDate = Date.parseExact(element.val(), dateFormats);

			if (value != ''
				&& inputDate != null) {

				if (inputDate.isBefore(this.minDate)) {
					inputDate = this.minDate;
				}
				else if (inputDate.isAfter(this.maxDate)) {
					inputDate = this.maxDate;
				}
				// else: inputDate whithin a valid range

				this[startEnd] = inputDate;
				if (this.startDate.isAfter(this.endDate)) {
					var auxDate = this.startDate;
					this.startDate = this.endDate;
					this.endDate = auxDate;
				}
			} else {
				inputDate = this[startEnd];
			}
			this.updateStartEndInputs(this.startDate, this.endDate);

			this.updateCalendars();
		}

	};

	$.fn.daterangepicker = function (options, cb) {
		this.each(function() {
			var el = $(this);
			if (!el.data('daterangepicker'))
				el.data('daterangepicker', new DateRangePicker(el, options, cb));
			});
		return this;
	};

} (window.jQuery);