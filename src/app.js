/**
 * AQI Pebble App
 * Pebble App Author: Devin Howard
 * All other credit to http://aqicn.org!
 */

var UI = require('ui');
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
  showAttribution: function() {
    if (AqicnService.aqi.attribution) {
      var attribution = new UI.Card({
        title: '  Attribution',
        body: AqicnService.aqi.attribution,
        backgroundColor: AqicnService.bgColor(),
        bodyColor: AqicnService.fgColor(),
        titleColor: AqicnService.fgColor(),
        scrollable: true,
      });
      attribution.show();
    }
  },//showAttribution
};//AqicnService

var View = {
  card: null,
  changeCity: function(add) {
    var cities = Settings.option('cityArray');
    var cityIndex = cities.indexOf(Settings.option('cityName'));
    if (cityIndex === -1) {
      Settings.option('cityName', cities[0]);
      AqicnService.refresh();
      return;
    }
    cityIndex += add;
    if (cityIndex >= cities.length) cityIndex = 0;
    if (cityIndex < 0) cityIndex = cities.length - 1;
    Settings.option('cityName', cities[cityIndex]);
    AqicnService.refresh();
  },
  aqicnSuccessListener: function(aqicn) {
    View.renderCard({
      title: '   Current AQI',
      subtitle: '          ' + aqicn.aqi.aqit,
      body: aqicn.createBody(),
      backgroundColor: aqicn.bgColor(),
      titleColor: aqicn.fgColor(),
      subtitleColor: aqicn.fgColor(),
      bodyColor: aqicn.fgColor(),
    });
  },
  aqicnErrorListener: function(aqicn) {
    View.renderCard({
      title: '   Current AQI',
      subtitle: '           ---',
      body: 'Failed to load data from server.',
      bodyColor: 'white',
      scrollable: true,
    });
  },
  renderCard: function(cardconfig) {
    if (View.card !== null) {
      View.card.hide();
    }
    View.card = new UI.Card(cardconfig);
    View.card.show();
    View.card.on('click', 'select', function(e) {
      AqicnService.showAttribution();
    });
    View.card.on('click', 'up', function(e) {
      View.changeCity(-1);
    });
    View.card.on('click', 'down', function(e) {
      View.changeCity(1);
    });
  },//renderCard
};

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
  }
};

/*
 * MAIN
 */

Model.setupConfigCallbacks();
View.renderCard({
  title: '   Current AQI',
  subtitle: '           ---',
  body: 'Loading...',
  bodyColor: 'white',
  scrollable: true,
});
AqicnService.addSuccessListener(View.aqicnSuccessListener);
AqicnService.addErrorListener(View.aqicnErrorListener);
AqicnService.refresh();
