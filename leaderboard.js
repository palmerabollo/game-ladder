var HUMILIATION_MODE = false;
var BIGWIN_THRESHOLD = 70;
var ONFIRE_THRESHOLD = 3;
var DAYS_INACTIVE_THRESHOLD = 7;

Players = new Meteor.Collection("players");
Games = new Meteor.Collection("games");

if (Meteor.isClient) {
  Meteor.startup(function () {
    plug_theme_switcher();
  });

  Meteor.autorun(function () {
    ['players', 'games', 'user'].forEach(function(col) { Meteor.subscribe(col) });
  });

  Handlebars.registerHelper("timeago", function(date) {
    return date ? moment(date).fromNow() : '';
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
      var is_frequent = moment().subtract('days', DAYS_INACTIVE_THRESHOLD).isBefore(this.date_lastgame);
      return is_frequent ? '' : 'inactive';
    }
    return 'inactive';
  };

  Template.player.humiliation_mode = function() {
    return HUMILIATION_MODE;
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
        Players.update(Session.get("selected_player"), {$set: {date_lastgame: now, consecutive_wins: 0}, $inc: {score: -elodiff, games_lost: 1, points_scored: lp, points_conceded: wp}});
        Players.update({meteor_id: Meteor.userId()}, {$set: {date_lastgame: now}, $inc: {score: elodiff, games_won: 1, points_scored: wp, points_conceded: lp, consecutive_wins: 1}});
        Games.insert({ winner: me, loser: player, date: now, elodiff: elodiff });
      }
    },
    'click .victory_advanced': function() {
      $('#result_ph_' + Session.get("selected_player")).show();
    }
  });

  Template.game.bigwin = function() {
    return this.elodiff > BIGWIN_THRESHOLD ? "bigwin" : "";
  }

  Template.game.onfire = function() {
    return this.winner.consecutive_wins > ONFIRE_THRESHOLD;
  }

  Template.game.trim = function(text) {
    return text.replace(/^(.{15}[^\s]*).*/, "$1");
  }

  Template.game.events({
    'click .comment': function () {
      $('#comment_ph_' + this._id).show();
    },
    'keypress .comment': function(event) {
      if (event.keyCode === 13) {
        var me = Players.findOne({meteor_id: Meteor.userId()});
        var text = $('#comment_' + this._id).val();
        if (text) {
          Games.update({_id: this._id}, { $push: {comments: {author: me, text: text, date_creation: new Date()} } }); 
        }
      }
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
                consecutive_wins: 0,
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
