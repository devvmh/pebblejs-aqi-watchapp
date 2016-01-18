/**
 * AQI Pebble App
 * Pebble App Author: Devin Howard
 * All other credit to http://aqicn.org!
 */

var UI = require('ui');
var ajax = require('ajax');

var MINUTE = 60 * 1000;

var MainView = {
  card: null,
  renderCard: function(cardconfig) {
    if (MainView.card !== null) {
      MainView.card.hide();
    }
    MainView.card = new UI.Card(cardconfig);
    MainView.card.show();
    MainView.card.on('click', 'select', function(e) {
      Aqicn.showAttribution();
    });
  },//setupMainView
};

var Aqicn = {
  aqi: {},
  cityname: 'toronto',  
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
      scrollable: true,
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
  getFeed: function() {
    var url = 'http://feed.aqicn.org/feed/' + Aqicn.cityname + '/' + (Aqicn.lang || '') + '/feed.v1.js?n=' + Aqicn.n + Aqicn.k;
    ajax({url: url}, Aqicn.displayData, Aqicn.showError);
    setTimeout(Aqicn.getFeed, 5 * MINUTE);
  },//getFeed
  showAttribution: function() {
    if (Aqicn.aqi.attribution) {
      var attribution = new UI.Card({
        title: 'Attribution',
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
 * MAIN
 */

MainView.renderCard({
  title: '   Current AQI',
  subtitle: '           ---',
  body: 'Loading...',
  bodyColor: 'white',
  scrollable: true,
});
Aqicn.getFeed();
