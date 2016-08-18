/**
 * AQI Pebble App
 * Pebble App Author: Devin Howard
 * All other credit to http://aqicn.org!
 */

var Settings = require('settings');

var Model = {
  DEFAULT_CITY_ARRAY: [
    'beijing',
    'hongkong',
    'shanghai',
    'toronto',
    'beijing/dongchengtiantan'
  ],
  ensureCityArrayExists: function() {
    if (! Settings.option('cityArray')) {
      Settings.option('cityArray', this.DEFAULT_CITY_ARRAY);
      Settings.option('cityName', this.DEFAULT_CITY_ARRAY[0]);
    }
  },
  setupConfigCallbacks: function() {
    this.ensureCityArrayExists();
    var cityArray = Settings.option('cityArray');
    var baseUrl = 'https://www.devinhoward.ca/pebblejs/aqicn/config-page.html';
    var url = baseUrl + '?cityArray=' + encodeURIComponent(JSON.stringify(cityArray));
    Settings.config(
      { url: url },
      function(e) {
        // console.log('opening configurable');
      },
      function(e) {
        // console.log('closed configurable');
        var cities = Settings.option('cityArray');
        if (cities.indexOf(Settings.option('cityName')) === -1) {
          Settings.option('cityName', cities[0]);
        }
        Model.setupConfigCallbacks(); //with new values
      }
    );
  },
  changeCity: function(add) {
    var cities = Settings.option('cityArray');
    var cityIndex = cities.indexOf(Settings.option('cityName'));
    if (cityIndex === -1) {
      Settings.option('cityName', cities[0]);
      return;
    }
    cityIndex += add;
    if (cityIndex >= cities.length) cityIndex = 0;
    if (cityIndex < 0) cityIndex = cities.length - 1;
    Settings.option('cityName', cities[cityIndex]);
  },
};

module.exports = Model;
