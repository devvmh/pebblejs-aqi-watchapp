/**
 * AQI Pebble App
 * Pebble App Author: Devin Howard
 * All other credit to http://aqicn.org!
 */

var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');

var MINUTE = 60 * 1000;

var Aqicn = {
  aqi: {},
  lang: null,
  n: 0,
  k: '',
  successListeners: [],
  addSuccessListener: function(listener) {
    Aqicn.successListeners.push(listener);
  },
  updateSuccessListeners: function() {
    Aqicn.successListeners.forEach(function(listener, index) {
      listener(Aqicn);
    });
  },
  errorListeners: [],
  addErrorListener: function(listener) {
    Aqicn.errorListeners.push(listener);
  },
  updateErrorListeners: function() {
    Aqicn.errorListeners.forEach(function(listener, index) {
      listener(Aqicn);
    });
  },
  fgColor: function() {
    if (Aqicn.colors && Aqicn.colors.length > 2) {
      return Aqicn.colors[2];
    } else {
      return 'black';
    }
  },
  bgColor: function() {
    if (Aqicn.colors && Aqicn.colors.length > 2) {
      return Aqicn.colors[1];
    } else {
      return 'white';
    }
  },
  temptodayFormatted: function() {
    if (Aqicn.aqi.temptoday === null) return null;
    
    var output = Aqicn.aqi.temptoday;
    output = output.replace(/\&ndash;/g, 'to');
    output = output.replace(/ ?\&deg;?/g, '');
    return output;
  },
  createBody: function() {    
    var body = '';
    body += Aqicn.aqi.cityname;
    body += "\n" + Aqicn.aqi.date;
    body += "\nTemp: " + Aqicn.aqi.temp + ' C';
    if (Aqicn.aqi.temptoday !== null) {
      body += "\nToday: " + Aqicn.temptodayFormatted();
    }
    return body;
  },
  displayData: function(data) {
    Aqicn.n += 1;
    var json = data.replace(/^.*{"cityname"/, '{"cityname"');
    json = json.replace(/\)\);$/, ''); //remove )); from end
    json = json.replace(/<[^>]*>/g, ''); //remove html tags
    Aqicn.aqi = JSON.parse(json);
    Aqicn.colors = Aqicn.aqi.style.match(/background-color: (#.{6});color:(#.{6});.*/);
    console.log(JSON.stringify(Aqicn.aqi, null, 2));
    Aqicn.updateSuccessListeners();
  },
  showError: function(err) {
    Aqicn.updateErrorListeners();
    console.log('Ajax failed: ' + err);
  },
  refresh: function() {
    var city = Settings.option('cityName');
    var url = 'http://feed.aqicn.org/feed/' + city + '/' + (Aqicn.lang || '') + '/feed.v1.js?n=' + Aqicn.n + Aqicn.k;
    ajax({url: url}, Aqicn.displayData, Aqicn.showError);
    setTimeout(Aqicn.refresh, 5 * MINUTE);
  },//refresh
  showAttribution: function() {
    if (Aqicn.aqi.attribution) {
      var attribution = new UI.Card({
        title: '  Attribution',
        body: Aqicn.aqi.attribution,
        backgroundColor: Aqicn.bgColor(),
        bodyColor: Aqicn.fgColor(),
        titleColor: Aqicn.fgColor(),
        scrollable: true,
      });
      attribution.show();
    }
  },//showAttribution
};//Aqicn

var MainView = {
  card: null,
  changeCity: function(add) {
    var cities = Settings.option('cityArray');
    var cityIndex = cities.indexOf(Settings.option('cityName'));
    if (cityIndex === -1) {
      Settings.option('cityName', cities[0]);
      Aqicn.refresh();
      return;
    }
    cityIndex += add;
    if (cityIndex >= cities.length) cityIndex = 0;
    if (cityIndex < 0) cityIndex = cities.length - 1;
    Settings.option('cityName', cities[cityIndex]);
    Aqicn.refresh();
  },
  aqicnSuccessListener: function(aqicn) {
    MainView.renderCard({
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
    MainView.renderCard({
      title: '   Current AQI',
      subtitle: '           ---',
      body: 'Failed to load data from server.',
      bodyColor: 'white',
      scrollable: true,
    });
  },
  renderCard: function(cardconfig) {
    if (MainView.card !== null) {
      MainView.card.hide();
    }
    MainView.card = new UI.Card(cardconfig);
    MainView.card.show();
    MainView.card.on('click', 'select', function(e) {
      Aqicn.showAttribution();
    });
    MainView.card.on('click', 'up', function(e) {
      MainView.changeCity(-1);
    });
    MainView.card.on('click', 'down', function(e) {
      MainView.changeCity(1);
    });
  },//renderCard
};

/*
 * SETTINGS
 */
var ConfigurationModule = {
  DEFAULT_CITY_ARRAY: [
    'beijing',
    'hongkong',
    'shanghai',
    'suzhou',
    'xian'
  ],
  ensureCityArrayExists: function() {
    if (! Settings.option('cityArray')) {
      Settings.option('cityArray', this.DEFAULT_CITY_ARRAY);
      Settings.option('cityName', this.DEFAULT_CITY_ARRAY[0]);
    }
  },
  setupConfigCallbacks: function() {
    var cityArray = Settings.option('cityArray') || ;
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
        ConfigurationModule.setupConfigCallbacks(); //with new values
      }
    );
  }
};

/*
 * MAIN
 */

ConfigurationModule.ensureCityArrayExists();
ConfigurationModule.setupConfigCallbacks();
MainView.renderCard({
  title: '   Current AQI',
  subtitle: '           ---',
  body: 'Loading...',
  bodyColor: 'white',
  scrollable: true,
});
Aqicn.addSuccessListener(MainView.aqicnSuccessListener);
Aqicn.addErrorListener(MainView.aqicnErrorListener);
Aqicn.refresh();
