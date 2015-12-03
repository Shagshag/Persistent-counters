var counters = {};

function counterName(counter, name) {
    if (counter.name != name) {
        counter.name = name;
        saveCounters();
    }
}

function counterStart(counter) {
    if (counter.pause == 1) {
        counter.date_start = Date.now();
        counter.pause = 0;
        saveCounters();
    }
}

function counterStop(counter) {
    if (counter.pause == 0) {
        counter.offset = counter.offset + Date.now() - counter.date_start;
        counter.pause = 1;
        saveCounters();
    }
}

function counterReset(counter) {
    counter.date_start = Date.now();
    counter.offset = 0;
    saveCounters();
}

function counterDelete(counter) {
    delete counters[counter.id];
    saveCounters();
}

function counterOffset(counter, offset) {
    if (counter.pause == 1 && counter.offset != offset) {
        counter.offset = offset;
        saveCounters();
    }
}

function getCounterTime(counter) {
    var milliseconds = counter.offset;
    if (!counter.pause) {
        milliseconds = milliseconds + Date.now() - counter.date_start;
    }
    var seconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds - minutes * 60;
    var hours = Math.floor(minutes / 60);
    minutes = minutes - hours * 60;
    var days = Math.floor(hours / 24);
    hours = hours - days * 24;

    return {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}

function getDefaultCounter() {
    var now = Date.now();
    var id = 'counter' + now;
    return {
        id: id,
        date_start: now,
        offset: 0,
        pause: 1,
        name: '',
    };
}

/* Storage */

function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return false;
    }
}

function getCounters() {
    counters = {};
    if (localStorage.getItem('counters')) {
        counters = JSON.parse(localStorage.getItem('counters'));
    }

    if ($.isEmptyObject(counters))
    {
        var counter = getDefaultCounter();
        counters[counter.id] = counter;
    }
}

function saveCounters() {
    localStorage.setItem('counters', JSON.stringify(counters));
}

/* Display */

function nameCounter() {
    var $line = $(this).parents('tr');
    counterName(counters[$line.prop('id')], $(this).val());
    counterUpdateButtons(counters[$line.prop('id')]);
}

function startCounter() {
    var $line = $(this).parents('tr');
    counterStart(counters[$line.prop('id')]);
    counterUpdateButtons(counters[$line.prop('id')]);
}

function stopCounter() {
    var $line = $(this).parents('tr');
    counterStop(counters[$line.prop('id')]);

    var time = getCounterTime(counters[$line.prop('id')]);
    $('input.days', $line).val(time.days);
    $('input.hours', $line).val(time.hours);
    $('input.minutes', $line).val(time.minutes);
    $('input.seconds', $line).val(time.seconds);
    counterUpdateButtons(counters[$line.prop('id')]);
}

function resetCounter() {
    if (confirm(document.l10n.getSync('confirm_reset'))) {
        var $line = $(this).parents('tr');
        counterReset(counters[$line.prop('id')]);

        $('input.days', $line).val(0);
        $('input.hours', $line).val(0);
        $('input.minutes', $line).val(0);
        $('input.seconds', $line).val(0);
        counterUpdateButtons(counters[$line.prop('id')]);
    }
}

function deleteCounter() {
    if (confirm(document.l10n.getSync('confirm_delete'))) {
    var $line = $(this).parents('tr');
        counterDelete(counters[$line.prop('id')]);
        $line.remove();

        if ($.isEmptyObject(counters))
        {
            $('#main .add_counter').trigger('click');
        } else {
            var ids = Object.keys(counters);
            if (ids.length == 1) {
                counterUpdateButtons(counters[ids[0]]);
            }
        }
    }
}

function offsetCounter() {
    var $line = $(this).parents('tr');
    var offset = 1000 * (
        parseInt($('input.seconds', $line).val()) +
        60 * parseInt($('input.minutes', $line).val()) +
        3600 * parseInt($('input.hours', $line).val()) +
        86400 * parseInt($('input.days', $line).val())
    );
    counterOffset(counters[$line.prop('id')], offset);
    counterUpdateButtons(counters[$line.prop('id')]);
}

function addCounter() {
    var counter = getDefaultCounter();
    counters[counter.id] = counter;
    counterInitDisplay(counter);
    saveCounters();
}

function countersInitDisplay() {
    for (var id in counters) {
        counterInitDisplay(counters[id]);
    };
    setInterval(countersUpdateDisplay, 500);
}

function counterInitDisplay(counter) {
    var $line = $('#model').clone();

    $line.prop('id', counter.id);
    $('.name', $line).val(counter.name);
    if (counter.pause == 1) {
        $('.stop_counter, .time_value', $line).addClass('hide');
        $('.start_counter, time input', $line).removeClass('hide');

        var time = getCounterTime(counter);
        $('input.days', $line).val(time.days);
        $('input.hours', $line).val(time.hours);
        $('input.minutes', $line).val(time.minutes);
        $('input.seconds', $line).val(time.seconds);
    } else {
        $('.start_counter, time input', $line).addClass('hide');
        $('.stop_counter, .time_value, .reset_counter, .delete_counter', $line).removeClass('hide');
    }
    $line.appendTo($('#counters')).removeClass('hide');

    counterUpdateButtons(counter);
    counterUpdateDisplay(counter);
}

function counterUpdateButtons(counter) {
    var $line = $('#' + counter.id);
    if (counter.pause == 1) {
        $('.stop_counter, .time_value', $line).addClass('hide');
        $('.start_counter, time input', $line).removeClass('hide');

        var time = getCounterTime(counter);
        if (time.days + time.hours + time.minutes + time.seconds == 0) {
            $('.reset_counter', $line).addClass('hide');
            if ((counter.name == '') && Object.keys(counters).length == 1) {
                $('.delete_counter', $line).addClass('hide');
            } else {
                $('.delete_counter', $line).removeClass('hide');
            }
        } else {
            $('.reset_counter, .delete_counter', $line).removeClass('hide');
        }
    } else {
        $('.stop_counter, .time_value, .reset_counter, .delete_counter', $line).removeClass('hide');
        $('.start_counter, time input', $line).addClass('hide');
    }

    if (Object.keys(counters).length > 1) {
        $('#main .delete_counter').removeClass('hide');
    }
}

function countersUpdateDisplay() {
    for (var id in counters) {
        counterUpdateDisplay(counters[id]);
    };
}

function counterUpdateDisplay(counter) {
    var time = getCounterTime(counter);
    var $line = $('#' + counter.id);
    $('span.days span.time_value', $line).text(time.days);
    $('span.hours span.time_value', $line).text(time.hours);
    $('span.minutes span.time_value', $line).text(time.minutes);
    $('span.seconds span.time_value', $line).text(time.seconds);
    $('time', $line).attr('datetime', time.days + 'd ' + time.hours + 'h ' + time.minutes + 'm ' + time.seconds + 's');
}

/* Start */

if (storageAvailable('localStorage'))
{
    $(document).ready(function() {
        $('#alert_nojs').addClass('hide');
        $('#main')
            .removeClass('hide')
            .on('change', '.name', nameCounter)
            .on('change', 'time input', offsetCounter)
            .on('click', '.start_counter', startCounter)
            .on('click', '.stop_counter', stopCounter)
            .on('click', '.reset_counter', resetCounter)
            .on('click', '.delete_counter', deleteCounter)
            .on('click', '.add_counter', addCounter);
        getCounters();
        document.l10n.ready(countersInitDisplay);
    });
}
