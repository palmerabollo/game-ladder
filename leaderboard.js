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
    return this.meteor_id === Meteor.userId();
  };

  Template.player.active = function () {
    return this.games_won + this.games_lost > 0 ? '' : 'inactive';
  };

  Template.game.timeago = function() {
    return moment(this.date).fromNow();
  }

  Template.leaderboard.events({
    'click .victory': function () {
      var result = prompt("Indique el resultado del partido. Puntos del ganador siempre a la izquierda. Ejemplo: 21-16","21-19");
      var points = result.split("-");
      if ((points.length == 2) && (isNormalInteger(points[0])) && (isNormalInteger(points[1])) && (points[0]>points[1])) {
          if (confirm('No hay vuelta atrás. ¿Deseas registrar una victoria de ' + result +'?')) {
            var me = Players.findOne({meteor_id: Meteor.userId()});

            if (!me) {
              me = {
                meteor_id: Meteor.userId(),
                name: Meteor.user().profile.name,
                score: DEFAULT_ELO,
                games_won: 0,
                games_lost: 0,
                points_scored:0,
                points_conceded:0,
                creation_date: new Date()
              };

              Players.insert(me);
            }

            var player = Players.findOne(Session.get("selected_player"));

            var elodiff = calculateElo(me.score, player.score, points);
            var winnerPoints = parseInt(points[0]);
            var loserPoints = parseInt(points[1]);

            Players.update(Session.get("selected_player"), {$inc: {score: -elodiff, games_lost: 1, points_scored:loserPoints, points_conceded:winnerPoints}});
            Players.update({meteor_id: Meteor.userId()}, {$inc: {score: elodiff,  games_won: 1, points_scored:winnerPoints, points_conceded:loserPoints}});
            Games.insert({ winner: me, loser: player, date: new Date() });
          }
      } else {
          //Jugará bien al ping pong, pero no sabe teclear. :)
          confirm('Los datos del resultado son incorrectos, Por favor inténtelo de nuevo.');
      }
    }
  });

  function isNormalInteger(str) {
      var n = ~~Number(str);
      return String(n) === str && n >= 0;
  }


  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });
} // end client

if (Meteor.isServer) {
  function resetRanking() {
    Players.update({}, {$set: {score: 1000, games_won: 0, games_lost: 0, points_scored:0, points_conceded:0}}, {multi: true});
  }

  function insertDemoData() {
    Players.insert({
      meteor_id: "foo",
      name: "Pedro Picapiedra",
      score: DEFAULT_ELO,
      games_won: 0,
      games_lost: 0,
      points_scored:0,
      points_conceded:0,
      creation_date: new Date()
    });
    Players.insert({
      meteor_id: "bar",
      name: "Pablo Marmol",
      score: DEFAULT_ELO,
      games_won: 0,
      games_lost: 0,
      points_scored:0,
      points_conceded:0,
      creation_date: new Date()
    });
    Players.insert({
      meteor_id: "mar",
      name: "Mario Bros",
      score: DEFAULT_ELO,
      games_won: 0,
      games_lost: 0,
      points_scored:0,
      points_conceded:0,
      creation_date: new Date()
    });
    Players.insert({
      meteor_id: "lui",
      name: "Luigi Bros",
      score: DEFAULT_ELO,
      games_won: 0,
      games_lost: 0,
      points_scored:0,
      points_conceded:0,
      creation_date: new Date()
    });
  }

  Meteor.startup(function() {
    // resetRanking()
    if (Players.find().count() === 0) {
      insertDemoData();
    }
  })
}
