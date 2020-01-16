var rocky = require('rocky');

var courses = [
  '2020-01-08',
  '2020-01-22',
  '2020-02-04',
  '2020-02-19',
  '2020-03-04',
  '2020-04-08',
  '2020-05-06'
];

var timetable = [
  {time: 400, text: "Wake up"},
  {time: 430, text: "Meditation"},
  {time: 630, text: "Breakfast"},
  {time: 800, text: "Group sitting"},
  {time: 900, text: "Meditation"},
  {time: 1100, text: "Lunch"},
  {time: 1200, text: "Interviews"},
  {time: 1300, text: "Meditation"},
  {time: 1430, text: "Group sitting"},
  {time: 1530, text: "Meditation"},
  {time: 1700, text: "Tea"},
  {time: 1800, text: "Group sitting"},
  {time: 1900, text: "Discourse"},
  {time: 2015, text: "Group sitting"},
  {time: 2100, text: "Questions"},
  {time: 2200, text: "Lights out"}
];

var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

Date.prototype.addMinutes = function(minutes) {
  var date = new Date(this.valueOf());
  date.setMinutes(date.getMinutes() + minutes); // timestamp
  return date; // Date object
}

// An object to cache our date & time values,
// to minimize computations in the draw handler.
var clock = {
  hours: '',
  minutes: '',
  weekday: '',
  date: '',
  month: ''
};

var vipassana = {
  day: -1,
  now: 0,
  next: 1,
  nextCourse: -1
}

function getWeekDay(day) {
  return weekdays[day];
}

function getIsoDate(date) {
  return new Date(date.toISOString().substring(0, 10));
}

function diffDates(date1, date2) {
  var diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}

function getCourseDay(date) {
  date = getIsoDate(date);
  if ((date < new Date(courses[0])) || (date > new Date(courses[courses.length]).addDays(11))) {
    return -1;
  }

  for (var i = 0; i < courses.length; i++) {
    var start = new Date(courses[i]);
    var end = new Date(courses[i]).addDays(11);
    if ((date >= start) && (date <= end)) {
      return diffDates(date, start);
    }
  }

  return -1;
}

function getNextCourseIndex(date) {
  date = getIsoDate(date);

  if (date > new Date(courses[courses.length]).addDays(11)) {
    // No new courses configured
    return -1;
  }

  for (var i = 0; i < courses.length; i++) {
    var start = new Date(courses[i]);
    if (date < start) {
      // First course
      if (i == 0) {
        return i;
      }

      var lastEnd = new Date(courses[i-1]).addDays(11);
      if (date > lastEnd) {
        return i;
      }
    }
  }

  return -1;
}

function currentActivityIndex(date) {
  date = date.addMinutes(5);
  var hours = date.toLocaleTimeString(undefined, {hour: '2-digit'});
  var minutes = date.toLocaleTimeString(undefined, {minute: '2-digit'});

  var time = parseInt(hours + minutes, 10);

  if ((time < timetable[0].time) || (time >= timetable[timetable.length - 1].time)) {
    return timetable.length - 1;
  }

  for (var i = 0; i < timetable.length; i++) {
    if (time < timetable[i].time) {
      return i-1;
    }
  }

  return timetable.length - 1;
}

function nextActivityIndex(date) {
  var currentIndex = currentActivityIndex(date);

  if (currentIndex == timetable.length - 1) {
    return 0;
  }

  return currentIndex + 1;
}

// Expects time as a number, 930 = 9:30, 1430 = 14:30
function formatTime(number) {
  var string = '' + number;

  if (string.length < 4) {
    string = '0' + string;
  }

  return string.substr(0, 2) + ':' + string.substr(2, 2);
}

rocky.on('draw', function(event) {
  // Get the CanvasRenderingContext2D object
  var ctx = event.context;

  var y = 0;

  // Clear the screen
  ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

  // Determine the width and height of the display
  var w = ctx.canvas.unobstructedWidth;
  var h = ctx.canvas.unobstructedHeight;

  // Set the text color
  ctx.fillStyle = 'white';

  // Center align the text
  ctx.textAlign = 'center';
  
  // Date
  ctx.font = '18px Gothic';
  ctx.fillText(clock.weekday + ' ' + clock.date, w / 2, -2, w);
  y+=10;

  // Display the time, in the middle of the screen
  ctx.font = '42px bold numbers Leco-numbers';
  ctx.fillText(clock.hours + ':' + clock.minutes, w / 2, y, w);

  // Vipassana
  // Day
  y+=52;
  ctx.fillStyle = 'grey';
  ctx.fillRect(0, y, w, 18);
  ctx.fillStyle = 'black';
  ctx.font = '18px bold Gothic';

  if (vipassana.day < 0) {
    ctx.fillText('No active course', w / 2, y - 4, w);

    ctx.fillStyle = 'white';

    y+=30;
    ctx.font = '18px Gothic';
    ctx.fillText('Next course', w / 2, y, w);
    y+=20;

    ctx.font = '24px bold Gothic';
    if (vipassana.nextCourse == -1) {
      ctx.fillText('Not configured', w / 2, y, w);
    } else {
      ctx.fillText(courses[vipassana.nextCourse], w / 2, y, w);
    }

    return;
  }
  
  ctx.fillText('Day ' + vipassana.day, w / 2, y - 4, w);
  y+=22;

  ctx.fillStyle = 'white';

  if ((vipassana.day > 0) && (vipassana.day <= 10)) {
    // Time
    ctx.font = '28px light numbers Leco-numbers';
    ctx.fillText(formatTime(timetable[vipassana.now].time), w / 2, y, w);
    y+=26;

    // Current
    ctx.font = '24px bold Gothic';
    ctx.fillText(timetable[vipassana.now].text, w / 2, y, w);
    y+=24;
    
    // Next
    ctx.font = '18px Gothic';
    ctx.fillText(formatTime(timetable[vipassana.next].time) + ' ' + timetable[vipassana.next].text, w / 2, h - 22, w);
  }
});

rocky.on('minutechange', function(event) {
  // Display a message in the system logs
  console.log("Another minute with your Pebble!");

  // Current date/time
  // https://developer.pebble.com/docs/rockyjs/Date/
  var d = event.date;

  clock.hours = d.toLocaleTimeString(undefined, {hour: '2-digit'});
  clock.minutes = d.toLocaleTimeString(undefined, {minute: '2-digit'});

  vipassana.now = currentActivityIndex(d);
  vipassana.next = nextActivityIndex(d);

  // Request the screen to be redrawn on next pass
  rocky.requestDraw();
});

rocky.on('daychange', function(event) {
  // Display a message in the system logs
  console.log("Another day with your Pebble!");

  var d = event.date;

  clock.weekday = getWeekDay(d.getDay());
  clock.date = d.toLocaleDateString(undefined, {day: 'numeric'});
  clock.month = d.toLocaleString(undefined, {month: 'long'});

  // Heavy calculation
  vipassana.day = getCourseDay(d);

  if (vipassana.day == -1) {
    vipassana.nextCourse = getNextCourseIndex(d);
  }

  // Request the screen to be redrawn on next pass
  rocky.requestDraw();
});
