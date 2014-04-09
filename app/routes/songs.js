'use strict';

// Songs routes use songs controller
var songs = require('../controllers/songs');

module.exports = function(app) {
  app.get('/songs', songs.all);
  app.get('/songs/artists', songs.artists);
  app.get('/songs/albums', songs.albums);
  app.get('/songs/genres', songs.genres);
  app.get('/songs/count', songs.count);
  app.get('/cover/:hash', songs.sendCover);
  app.get('/songs/:songId', songs.show);
  app.put('/songs/multi', songs.updateMulti);
  app.put('/songs/:songId', songs.update);
  app.del('/songs/:songId', songs.destroy);

  // Finish with setting up the songId param
  app.param('songId', songs.song);
};

/* vim: set ts=2 sw=2 et ai: */
