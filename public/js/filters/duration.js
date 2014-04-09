/**
 * Created by manuel on 29/03/14.
 */
'use strict';

var convertSeconds = function(seconds) {
  var i = 0, out = [], value;
  var times = [
    {text: 'seconds', value: 0, divider: 60},
    {text: 'minutes', value: 0, divider: 60},
    {text: 'hours', value: 0, divider: 24},
    {text: 'days', value: 0, divider: 7},
    {text: 'weeks', value: 0, divider: 4},
    {text: 'months', value: 0, divier: 12},
    {text: 'years', value: 0, divider: 0}
  ];
  while (seconds > times[i].divider && i < times.length) {
    value = Math.floor(seconds % times[i].divider);
//    console.log(times[i].text, 'value: '+ value);
    seconds /= times[i].divider;
    if (value > 0) {
      out.unshift(value + ' ' + times[i].text);
    }
    else if (i+1 < times.length && seconds < times[i+1].divider) {
      //console.log('divider next: ' + times[i+1].divider, seconds);
      out.unshift(Math.floor(seconds * times[i].divider) + ' ' + times[i].text);
      seconds = 0;
    }
//    console.log(value + ' ' + times[i].text);
//    console.info(seconds);
    ++i;
  }
  if (seconds > 0) {
    value = Math.floor(seconds);
    if (value > 0) {
      out.unshift(value + ' ' + times[i].text);
    }
//    console.log(times[i].value + ' ' + times[i].text);
  }
  return out.join(' ');
};

angular.module('musicCollection.filters')
  .filter('duration', function() {
    return function(input, long) {
      if (input <= 0 || input === undefined) {
        return 'N/A';
      }
      long = long || false;
      var out;
      if (long) {
        out = convertSeconds(input);
      } else {
        out = (input > 60) ? Math.floor(input / 60) + ':' : '0:';
        var remaining = Math.floor(input % 60);
        if (remaining < 10) {
          out += '0' + remaining.toString();
        } else {
          out += remaining.toString();
        }
      }

      return out;
    };
  });
