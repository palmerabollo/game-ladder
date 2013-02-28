var DEFAULT_ELO = 1000;

Players = new Meteor.Collection("players");
Games = new Meteor.Collection("games");

if (Meteor.isClient) {
  Template.gameboard.games = function () {
    return Games.find({}, {sort: {date: -1}, limit: 20});
  };

  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var player = Players.findOne(Session.get("selected_player"));
    return player && player.name;
  };

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.player.me = function () {
    return false; // TODO disable "claim victory" against myself
  };

  Template.player.active = function () {
    return this.games_won + this.games_lost > 0 ? '' : 'inactive';
  };

  // http://www.thepoolclub.com/gs/elorank.php
  // http://gobase.org/studying/articles/elo/
  function elo(winner, loser) {
    var elodiff = DEFAULT_ELO - Math.round(1 / (1 + Math.pow(10, (loser - winner) / 400)) * DEFAULT_ELO);
    return elodiff;
  }

  Template.leaderboard.events({
    'click .victory': function () {
      if (confirm('No hay vuelta atrás. ¿Deseas registrar una victoria?')) {
        var me = Players.findOne({meteor_id: Meteor.userId()});

        if (!me) {
          me = {
            meteor_id: Meteor.userId(),
            name: Meteor.user().profile.name,
            score: DEFAULT_ELO,
            games_won: 0,
            games_lost: 0,
            creation_date: new Date()
          };

          Players.insert(me);
        }

        var player = Players.findOne(Session.get("selected_player"));
        
        var elodiff = elo(me.score, player.score);
        Players.update(Session.get("selected_player"), {$inc: {score: -elodiff, games_lost: 1}});
        Players.update({meteor_id: Meteor.userId()}, {$inc: {score: elodiff, games_won: 1}});

        Games.insert({ winner: me, loser: player, date: new Date() });
      }
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });
} // end client

if (Meteor.isServer) {
  function resetRanking() {
    Players.update({}, {$set: {score: 1000, games_won: 0, games_lost: 0}}, {multi: true});
  }

  function insertDemoData() {
    Players.insert({
      meteor_id: "foo",
      name: "Pedro Picapiedra",
      score: DEFAULT_ELO,
      games_won: 0,
      games_lost: 0,
      creation_date: new Date()
    });

    Players.insert({
      meteor_id: "bar",
      name: "Pablo Marmol",
      score: DEFAULT_ELO,
      games_won: 0,
      games_lost: 0,
      creation_date: new Date()
    });    
  }

  Meteor.startup(function() {
    if (Players.find().count() === 0) {
      insertDemoData();
    }
  })
}
