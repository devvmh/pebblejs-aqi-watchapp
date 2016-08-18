/**
 * AQI Pebble App
 * Pebble App Author: Devin Howard
 * All other credit to http://aqicn.org!
 */

var AqicnService = require('./AqicnService.js')
var View = require('./View.js')
var Model = require('./Model.js')

Model.setupConfigCallbacks();
View.renderCard({
  title: '   Current AQI',
  subtitle: '           ---',
  body: 'Loading...',
  scrollable: true
});
AqicnService.addSuccessListener(View.aqicnSuccessListener);
AqicnService.addErrorListener(View.aqicnErrorListener);
AqicnService.refresh();
