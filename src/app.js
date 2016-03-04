/**
 * AQI Pebble App
 * Pebble App Author: Devin Howard
 * All other credit to http://aqicn.org!
 */

var UI = require('ui');
var ajax = require('ajax');

var MINUTE = 60 * 1000;

var CITY_ARRAY_JSON = 'cityArrayJSON';
var DEFAULT_CITY_ARRAY = [
  'beijing',
  'hongkong',
  'shanghai',
  'suzhou',
  'xian'
];

// forward declarations... bleh.
var MainView = {},
    Aqicn = {};

var MainView = {
  card: null,
  cities: function() {
    var cityArray = localStorage.getItem(CITY_ARRAY_JSON);
    if (!cityArray) {
      localStorage.setItem(CITY_ARRAY_JSON, DEFAULT_CITY_ARRAY);
      return DEFAULT_CITY_ARRAY;
    } else {
      return JSON.parse(cityArray);
    }
  },
  changeCity: function(add) {
    var cities = this.cities();
    var cityIndex = cities.indexOf(Aqicn.cityname);
    if (cityIndex === -1) {
      Aqicn.cityname = cities[0];
      Aqicn.refresh();
      return;
    }
    cityIndex += add;
    if (cityIndex >= cities.length) cityIndex = 0;
    if (cityIndex < 0) cityIndex = cities.length - 1;
    Aqicn.cityname = cities[cityIndex];
    Aqicn.refresh();
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

var Aqicn = {
  aqi: {},
  cityname: 'beijing',  
  lang: null,
  n: 0,
  k: '',
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
    MainView.renderCard({
      title: '   Current AQI',
      subtitle: '          ' + Aqicn.aqi.aqit,
      body: Aqicn.createBody(),
      backgroundColor: Aqicn.bgColor(),
      titleColor: Aqicn.fgColor(),
      subtitleColor: Aqicn.fgColor(),
      bodyColor: Aqicn.fgColor(),
    });
  },
  showError: function(err) {
    MainView.renderCard({
      title: '   Current AQI',
      subtitle: '           ---',
      body: 'Failed to load data from server.',
      bodyColor: 'white',
      scrollable: true,
    });
    console.log('Ajax failed: ' + err);
  },
  refresh: function() {
    var url = 'http://feed.aqicn.org/feed/' + Aqicn.cityname + '/' + (Aqicn.lang || '') + '/feed.v1.js?n=' + Aqicn.n + Aqicn.k;
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

/*
 * SETTINGS
 */

Pebble.addEventListener('showConfiguration', function(e) {
  var cityArray = localStorage.getItem(CITY_ARRAY_JSON);
  if (!cityArray) {
    cityArray = JSON.stringify(DEFAULT_CITY_ARRAY);
  }
  cityArray = JSON.stringify(['beijing', 'toronto']);
  Pebble.openURL('https://www.devinhoward.ca/pebblejs/aqicn/config-page.html?cityArray=' + encodeURIComponent(cityArray));
});

Pebble.addEventListener('webviewclosed', function(e) {
  // Decode and parse config data as JSON
  var config_data = JSON.parse(decodeURIComponent(e.response));
  console.log('Config window returned: ', JSON.stringify(config_data));

  // Send settings to Pebble watchapp
  Pebble.sendAppMessage(config_data, function(){
    console.log('Sent config data to Pebble');  
  }, function() {
    console.log('Failed to send config data!');
  });
});

/*
 * MAIN
 */

MainView.renderCard({
  title: '   Current AQI',
  subtitle: '           ---',
  body: 'Loading...',
  bodyColor: 'white',
  scrollable: true,
});
Aqicn.refresh();
