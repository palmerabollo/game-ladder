var HUMILIATION_MODE = false;

Players = new Meteor.Collection("players");
Games = new Meteor.Collection("games");

if (Meteor.isClient) {
  Meteor.autorun(function () {
    Meteor.subscribe('players');
    Meteor.subscribe('games');
    Meteor.subscribe('user');
  });

  Template.gameboard.games = function () {
    return Games.find({}, {sort: {date: -1}});
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
    return this.meteor_id === Meteor.userId() ? "me" : '';
  };

  Template.player.avatar_url = function() {
    // TODO use hex_md5(email) when email is available
    return "http://www.gravatar.com/avatar/" + hex_md5(this._id) + "?d=identicon&s=20";
  }

  Template.player.active = function () {
    return this.games_won + this.games_lost > 0 ? '' : 'inactive';
  };

  Template.game.timeago = function() {
    return moment(this.date).fromNow();
  }

  Template.configuration.humiliation_mode = function() {
    return HUMILIATION_MODE;
  }

  Template.leaderboard.events({
    'click .victory': function () {
      var player = Players.findOne(Session.get("selected_player"));

      if (HUMILIATION_MODE) {
        // TODO use an html dialog instead of an ugly prompt.
        var result = prompt("Indique el resultado del partido. Puntos del ganador siempre a la izquierda. Ejemplo: 21-16","21-19");
        var points = result.split("-");
        if ((points.length == 2) && (isNormalInteger(points[0])) && (isNormalInteger(points[1])) && (points[0]>points[1])) {
          if (confirm('No hay vuelta atrás. ¿Deseas registrar una victoria de ' + result +'?')) {
            var me = Players.findOne({meteor_id: Meteor.userId()});

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
      } else {
        if (confirm('No hay vuelta atrás. ¿Deseas registrar una victoria contra ' + player.name + '?')) {
          var me = Players.findOne({meteor_id: Meteor.userId()});

          var elodiff = calculateElo(me.score, player.score);
          Players.update(Session.get("selected_player"), {$inc: {score: -elodiff, games_lost: 1}});
          Players.update({meteor_id: Meteor.userId()}, {$inc: {score: elodiff, games_won: 1}});

          Games.insert({ winner: me, loser: player, date: new Date() });
        }
      }
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });
}

if (Meteor.isServer) {
  Meteor.publish("games", function () {
    return Games.find({}, {sort: {date: -1}, limit: 20});
  });

  Meteor.publish("players", function () {
    return Players.find();
  });

  Meteor.autorun(function () {
    Meteor.publish("user", function() {
      if (this.userId) {
        var me = Players.findOne({meteor_id: this.userId});
        var user = Meteor.users.findOne({_id: this.userId});

        if (!me) {
          // XXX race conditions might arise
          me = {
                meteor_id: this.userId,
                name: user.profile.name,
                score: DEFAULT_ELO,
                games_won: 0,
                games_lost: 0,
                points_scored: 0,
                points_conceded: 0,
                creation_date: new Date()
            };
          Players.insert(me);
        };
      }
    }); 
  });

  function resetPlayers() {
    Players.remove({});
  }

  function resetRanking() {
    Players.update({}, {$set: {score: 1000, games_won: 0, games_lost: 0, points_scored:0, points_conceded:0}}, {multi: true});
  }

  function insertDemoData() {
    var createEmpty = function(name) {
      Players.insert({
        meteor_id: "id_" + name,
        name: name,
        score: DEFAULT_ELO,
        games_won: 0,
        games_lost: 0,
        points_scored: 0,
        points_conceded: 0,
        creation_date: new Date()
      });
    }

    createEmpty("Pedro Picapiedra");
    createEmpty("Pablo Marmol");
    createEmpty("Mario Bros");
    createEmpty("Luigi Bros");
  }

  Meteor.startup(function() {
    // resetRanking();
    // resetPlayers();

    if (Players.find().count() === 0) {
      insertDemoData();
    }
  })
}
