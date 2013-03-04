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

  Template.player.active = function () {
    return this.games_won + this.games_lost > 0 ? '' : 'inactive';
  };

  Template.player.humiliation_mode = function() {
    return HUMILIATION_MODE;
  }

  Template.game.timeago = function() {
    return moment(this.date).fromNow();
  }

  Template.leaderboard.events({
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

      if (confirm('Do you confirm you won against ' + player.name + '?')) {
        Players.update(Session.get("selected_player"), {$inc: {score: -elodiff, games_lost: 1, points_scored: lp, points_conceded: wp}});
        Players.update({meteor_id: Meteor.userId()}, {$inc: {score: elodiff,  games_won: 1, points_scored: wp, points_conceded: lp}});
        Games.insert({ winner: me, loser: player, date: new Date() });
      }
    },
    'click .victory_advanced': function() {
      $('#result_' + Session.get("selected_player")).show();
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

  function insertDemoData() {
    var createEmpty = function(name) {
      Players.insert({
        meteor_id: "demo_id_" + name,
        name: name,
        score: DEFAULT_ELO,
        games_won: 0,
        games_lost: 0,
        points_scored: 0,
        points_conceded: 0,
        creation_date: new Date(),
        avatar_url: "http://www.gravatar.com/avatar/HASH?s=50&d=identicon&r=PG"
      });
    }

    createEmpty("Mario Bros");
    createEmpty("Luigi Bros");
  }

  Meteor.startup(function() {
    // resetRanking();
    // reset();

    if (Players.find().count() === 0) {
      insertDemoData();
    }
  })
}
