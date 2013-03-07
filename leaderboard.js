var HUMILIATION_MODE = false;
var BIGWIN_THRESHOLD = 50;

Players = new Meteor.Collection("players");
Games = new Meteor.Collection("games");

if (Meteor.isClient) {
  Meteor.autorun(function () {
    ['players', 'games', 'user'].forEach(function(col) { Meteor.subscribe(col) });
  });

  Template.gameboard.games = function () {
    return Games.find({}, {sort: {date: -1}});
  };

  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1}});
  };

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.player.me = function () {
    return this.meteor_id === Meteor.userId() ? "me" : '';
  };

  Template.player.active = function () {
    var has_played = this.games_won + this.games_lost > 0;
    if (has_played) {
      var is_frequent = moment().subtract('days', 7).isBefore(this.date_lastgame);
      return is_frequent ? '' : 'inactive';
    }
    return 'inactive';
  };

  Template.player.humiliation_mode = function() {
    return HUMILIATION_MODE;
  }

  Template.player.timeago = function() {
    return this.date_lastgame ? moment(this.date_lastgame).fromNow() : '';
  }

  Template.game.timeago = function() {
    return moment(this.date).fromNow();
  }

  Template.game.bigwin = function() {
    return this.elodiff > BIGWIN_THRESHOLD ? "bigwin" : "";
  }

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    },
    'click .victory': function () {
      var player = Players.findOne(Session.get("selected_player"));
      var me = Players.findOne({meteor_id: Meteor.userId()});

      var points_winner = $('#winner_points_' + Session.get("selected_player")).val();
      var points_loser = $('#loser_points_' + Session.get("selected_player")).val();
      
      if (points_winner || points_loser) {
        if (isNormalInteger(points_winner) && isNormalInteger(points_loser)) {
            var wp = parseInt(points_winner);
            var lp = parseInt(points_loser);

            if (wp <= lp) {
              alert('Wrong results. Please try again.');
              return;
            }

            var elodiff = calculateElo(me.score, player.score, wp - lp);
        } else {
          alert('Wrong result format. Please try again.');
          return;
        }
      } else {
        var elodiff = calculateElo(me.score, player.score);
      }

      if (confirm('Do you confirm you victory against ' + player.name + '?')) {
        var now = new Date();
        Players.update(Session.get("selected_player"), {$set: {date_lastgame: now}, $inc: {score: -elodiff, games_lost: 1, points_scored: lp, points_conceded: wp}});
        Players.update({meteor_id: Meteor.userId()}, {$set: {date_lastgame: now}, $inc: {score: elodiff, games_won: 1, points_scored: wp, points_conceded: lp}});
        Games.insert({ winner: me, loser: player, date: now, elodiff: elodiff });
      }
    },
    'click .victory_advanced': function() {
      $('#result_' + Session.get("selected_player")).show();
    }
  });
}

if (Meteor.isServer) {
  Meteor.publish("games", function () {
    return Games.find({}, {sort: {date: -1}, limit: 30});
  });

  Meteor.publish("players", function () {
    return Players.find({});
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
                creation_date: new Date(),
                avatar_url: "http://graph.facebook.com/" + user.services.facebook.id + "/picture/?type=small"
            };
          Players.insert(me);
        };
      }
    }); 
  });

  function reset() {
    Players.remove({});
    Games.remove({});
  }

  function resetRanking() {
    Players.update({}, {$set: {score: 1000, games_won: 0, games_lost: 0, points_scored:0, points_conceded:0}}, {multi: true});
  }

  Meteor.startup(function() {
    // resetRanking();
    // reset();
  })
}
