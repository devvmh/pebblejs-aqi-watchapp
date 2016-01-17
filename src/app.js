/**
 * AQI pebble app
 * Author: Devin Howard
 * All credits to http://aqicn.org!
 */

var UI = require('ui');
var ajax = require('ajax');

var main = new UI.Card({
  title: 'AQICN',
  icon: 'images/menu_icon.png',
  subtitle: '---',
  body: 'Press select to download data.',
  bodyColor: '#9a0036' // Hex colors
});

var AQICN = {
  aqi: {},
  cityname: 'beijing',  
  lang: null,
  n: 0,
  k: '',
  success: function(data) {
    this.n += 1;
    var json = data.replace(/^.*{"cityname"/, '{"cityname"');
    json = json.replace(/\)\);$/, ''); //remove )); from end
    json = json.replace(/<[^>]*>/g, ''); //remove html tags
    this.aqi = JSON.parse(json);
    main.subtitle(this.aqi.cityname + ' ' + this.aqi.aqit);
    main.body(this.aqi.attribution);
    console.log(JSON.stringify(this.aqi, null, 1));
  },
  error: function(err) {
    console.log('Ajax failed: ' + err);
  },
  getFeed: function() {
    var url = 'http://feed.aqicn.org/feed/' + this.cityname + '/' + (this.lang || '') + '/feed.v1.js?n=' + this.n + this.k;
    ajax({url: url}, this.success, this.error);
  }//getFeed
};//AQICN

/*
 * MAIN
 */

main.show();
main.on('click', 'select', function(e) {
  AQICN.getFeed();
});