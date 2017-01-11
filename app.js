var path = require('path');
var http = require('http');
var express = require('express');
var Twitter = require('twitter');
var socketio = require('socket.io');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var User = {id:"hungrykirby"};
var base;
var passportConfig = {
  twitter: {
    consumerKey: process.env.CK,
    consumerSecret: process.env.CS,
    //callbackURL: "http://localhost:3000/auth/twitter/callback"
    callbackURL: 'https:\/\/delter.herokuapp.com/auth/twitter/callback'
  }
};


if ((base = process.env).PORT == null) {
  base.PORT = 3000;
}


passport.serializeUser(function(user, done) {
  return done(null, user);
});
passport.deserializeUser(function(obj, done) {
  return done(null, obj);
});
var twitter = null;
var twitterAuth = new TwitterStrategy(
  passportConfig.twitter,
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {
      //console.log(token);
      //console.log(tokenSecret);
      twitter = new Twitter({
        consumer_key: passportConfig.twitter.consumerKey,
        consumer_secret: passportConfig.twitter.consumerSecret,
        access_token_key: token,
        access_token_secret: tokenSecret
      });
      done(null, twitter);
      /*if(!req.user) { // confirm that user not loggedin
        User.findOne({ 'social.twitter.id': profile.id }, function (err, user) {
          if (err) return done(err);
          if (user) {
            return done(null, user);
          } else {
            var newUser = new User({
              social: {
                twitter: {
                  id: profile.id,
                  token: token,
                  username: profile.username,
                  image_url: profile.photos[0].value || ''
                }
              }
            });
            newUser.save(function (err) {
              if (err) return done(err);
              return done(null, newUser);
            });
          }
        });
      } else { // user exists and is loggedin
        var user = req.user; // pull the user out of the session
        // TODO: update the current users info
        return;
      }*/
    });
  }
);
passport.use(twitterAuth);


var app = express();
app.use(express.static(path.join(__dirname, 'img')));
app.use(session({
  secret: 'pikachu',
  resave: true,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
//app.use(methodOverride());
app.use(bodyParser.json());
//app.use(morgan('dev'));

/*passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    if (err) return done(err);
    return done(null, user);
  });
});*/

app.get('/', function(req, res) {
  var html, ref;
  html = "<script src=\"https://cdn.socket.io/socket.io-1.4.5.js\"></script>\n<script>io.connect().on('authorized',function(session){document.querySelector('pre').innerHTML=session})</script>\n<h1>Yakinikutter</h1>\n<pre></pre>";
  //console.log(html);
  if (((ref = req.session.passport) != null ? ref.user : void 0) == null) {
    html += '<a href="/auth/twitter">ログイン</a>';
  }
  return res.end(html);
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successRedirect: '/tweet',
  failureRedirect: '/failure'
}));
app.get('/failure', function(req, res) {
  return res.end('だめでした');
});

var upload_img = require('fs').readFileSync('./img/yakiniku.jpg');

app.get('/tweet', function (req, res) {
  //var upload_img;
  twitter.post('media/upload', {media: upload_img}, function(err, img){
    console.log(err);
    console.log(img);
    if(img == undefined || img.media_id_string == undefined) return;
    var options = {
      status:'焼肉',
      media_ids:img.media_id_string,
    };
    twitter.post('statuses/update', options, function(error, tweet, response) {
      if (!error) {
        console.log(tweet);
        return res.end(tweet.text);
      }else{
        console.log(error.message);
        return res.end('error');
      }
    });
  });
});
/*var cnt = 0;
app.get('/timeline', function (req, res) {
  cnt++;
  console.log(cnt);
  twitter.stream('user', {}, function(stream){
    stream.on('data', function(data){
      console.log(data.text);
    });
  });
  res.end('' + cnt);
});*/



var server = http.Server(app);
server.listen(process.env.PORT);
var io = socketio(server);

io.on('connect', function(client) {
  //console.log("nanikadete" + JSON.stringify(client.session, null, 2));
  return client.emit('authorized', JSON.stringify(client.session, null, 2));
});
