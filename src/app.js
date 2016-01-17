/**
 * AQI pebble app
 * Author: Devin Howard
 * All credits to http://aqicn.org!
 */

var UI = require('ui');
var ajax = require('ajax');

var MINUTE = 60 * 1000;

var main = new UI.Card({
  title: '   Current AQI',
  subtitle: '           ---',
  body: 'Loading...',
  bodyColor: 'white',
  scrollable: true,
});

var AQICN = {
  aqi: {},
  cityname: 'beijing',  
  lang: null,
  n: 0,
  k: '',
  success: function(data) {
    AQICN.n += 1;
    var json = data.replace(/^.*{"cityname"/, '{"cityname"');
    json = json.replace(/\)\);$/, ''); //remove )); from end
    json = json.replace(/<[^>]*>/g, ''); //remove html tags
    AQICN.aqi = JSON.parse(json);
    AQICN.colors = AQICN.aqi.style.match(/background-color: (#.{6});color:(#.{6});.*/);
    main.hide();
    main = new UI.Card({
      title: '   Current AQI',
      subtitle: '          ' + AQICN.aqi.aqit,
      body: AQICN.aqi.cityname + "\n" + AQICN.aqi.date + "\nTemp: " + AQICN.aqi.temp + "\nToday: "  + AQICN.aqi.temptoday.replace(/\&ndash;/g, 'to').replace(/ ?\&deg;?/g, ''),
      backgroundColor: AQICN.colors[1],
      bodyColor: AQICN.colors[2],
      scrollable: true,
    });
    main.show();
    console.log(JSON.stringify(AQICN.aqi, null, 2));
  },
  error: function(err) {
    main.body('Failed to load data from server.');
    console.log('Ajax failed: ' + err);
  },
  getFeed: function() {
    var url = 'http://feed.aqicn.org/feed/' + AQICN.cityname + '/' + (AQICN.lang || '') + '/feed.v1.js?n=' + AQICN.n + AQICN.k;
    ajax({url: url}, AQICN.success, AQICN.error);
    setTimeout(AQICN.getFeed, 5 * MINUTE);
  },//getFeed
  showAttribution: function() {
    if (AQICN.aqi.attribution) {
      var attribution = new UI.Card({
        title: 'Attribution',
        body: AQICN.aqi.attribution,
        backgroundColor: AQICN.colors[1],
        bodyColor: AQICN.colors[2],
        scrollable: true,
      });
      attribution.show();
    }
  },//showAttribution
};//AQICN

/*
 * MAIN
 */

main.show();
main.on('click', 'select', function(e) {
  AQICN.showAttribution();
});
AQICN.getFeed();