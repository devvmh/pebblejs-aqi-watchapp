/**
 * AQI Pebble App
 * Pebble App Author: Devin Howard
 * All other credit to http://aqicn.org!
 */

var UI = require('ui');
var Settings = require('settings');
var AqicnService = require('./AqicnService.js')
var Model = require('./Model.js')

var View = {
  card: null,
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
      body: 'Network failed! Refreshing now. If problem persists, restart the watchapp.',
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
      View.showAttribution(AqicnService.aqi);
    });
    View.card.on('click', 'up', function(e) {
      Model.changeCity(-1);
      AqicnService.refresh();
    });
    View.card.on('click', 'down', function(e) {
      Model.changeCity(1);
      AqicnService.refresh();
    });
  },//renderCard
  showAttribution: function(aqi) {
    if (aqi.attribution) {
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
};

module.exports = View;
