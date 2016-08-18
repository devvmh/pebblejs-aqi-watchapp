/**
 * AQI Pebble App
 * Pebble App Author: Devin Howard
 * All other credit to http://aqicn.org!
 */

var ajax = require('ajax');
var Settings = require('settings');

var MINUTE = 60 * 1000;

var AqicnService = {
  aqi: {},
  lang: null,
  n: 0,
  k: '',
  successListeners: [],
  addSuccessListener: function(listener) {
    AqicnService.successListeners.push(listener);
  },
  updateSuccessListeners: function() {
    AqicnService.successListeners.forEach(function(listener, index) {
      listener(AqicnService);
    });
  },
  errorListeners: [],
  addErrorListener: function(listener) {
    AqicnService.errorListeners.push(listener);
  },
  updateErrorListeners: function() {
    AqicnService.errorListeners.forEach(function(listener, index) {
      listener(AqicnService);
    });
  },
  fgColor: function() {
    if (AqicnService.colors && AqicnService.colors.length > 2) {
      return AqicnService.colors[2];
    } else {
      return 'black';
    }
  },
  bgColor: function() {
    if (AqicnService.colors && AqicnService.colors.length > 2) {
      return AqicnService.colors[1];
    } else {
      return 'white';
    }
  },
  temptodayFormatted: function() {
    if (AqicnService.aqi.temptoday === null) return null;
    
    var output = AqicnService.aqi.temptoday;
    output = output.replace(/\&ndash;/g, 'to');
    output = output.replace(/ ?\&deg;?/g, '');
    return output;
  },
  createBody: function() {    
    var body = '';
    body += AqicnService.aqi.cityname;
    body += "\n" + AqicnService.aqi.date;
    body += "\nTemp: " + AqicnService.aqi.temp + ' C';
    if (AqicnService.aqi.temptoday !== null) {
      body += "\nToday: " + AqicnService.temptodayFormatted();
    }
    return body;
  },
  displayData: function(data) {
    AqicnService.n += 1;
    var json = data.replace(/^.*{"cityname"/, '{"cityname"');
    json = json.replace(/\)\);$/, ''); //remove )); from end
    json = json.replace(/<[^>]*>/g, ''); //remove html tags
    try {
      AqicnService.aqi = JSON.parse(json);
    } catch (err) {
      AqicnService.showError(err);
      setTimeout(AqicnService.refresh, 500);
      return;
    }
    AqicnService.colors = AqicnService.aqi.style.match(/background-color: (#.{6});color:(#.{6});.*/);
    console.log(JSON.stringify(AqicnService.aqi, null, 2));
    AqicnService.updateSuccessListeners();
  },
  showError: function(err) {
    AqicnService.updateErrorListeners();
    console.log('Ajax failed: ' + err);
  },
  refresh: function() {
    var city = Settings.option('cityName');
    var url = 'http://feed.aqicn.org/feed/' + city + '/' + (AqicnService.lang || '') + '/feed.v1.js?n=' + AqicnService.n + AqicnService.k;
    ajax({url: url}, AqicnService.displayData, AqicnService.showError);
    setTimeout(AqicnService.refresh, 5 * MINUTE);
  },//refresh
}; //AqicnService

module.exports = AqicnService;
