
var http = require('http');
var path = require('path');
var validurl = require('valid-url');
var randomstring = require('random-string');

var express = require('express');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/myurldatabase', 
  {server: {socketOptions: {socketTimeoutMS: 3000}}});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('database open');
});

var urlSchema = mongoose.Schema({
    shorturl: String,
    origurl: String
});

var UrlModel = mongoose.model('UrlShortener', urlSchema);

// var newurl = new UrlModel({ shorturl: "http://ide.c9.io/silgarth/fccurlshortnerproject/12341234", origurl: "http://google.com"});

// newurl.save(function(error, doc) {
//   if (error) {
//     console.log(error);
//   }
//   else {
//     console.log(doc);
//   }
// });

var app = express();
var server = http.createServer(app);

app.get(/^\/new\/(.*)/, function(req, res, next) {
  console.log(req.originalUrl);
  if (!validurl.isWebUri(req.params[0])) {
    res.status(400).send("Invalid URL in request");
  }
  else {
    var rs = randomstring().toLowerCase();
    var shorturl = req.headers["x-forwarded-proto"] + "://" + req.headers.host + "/" + rs;
    var newurl = new UrlModel({shorturl: rs, origurl: req.params[0]});
    newurl.save(function(err, doc) {
      if (err) {
        res.status(500).send("Unable to save URL");
      }
      else {
        res.header('Content-Type', 'application/json');
        var obj = { original_url : req.params[0], short_url : shorturl};
        res.send(JSON.stringify(obj));
      }
    });
  }
});

app.get('*', function (req, res, next) {
  var lookup = req.originalUrl.slice(1);

  UrlModel.find({shorturl: lookup}, function(err, doc) {
    if (err) {
      res.status(500).send('Error Looking up short URL: ' + lookup);
    }
    else if (doc.length === 0) {
      res.status(404).send('Url not found: ' + lookup);
    }
    else {
      res.redirect(doc[0].origurl);
    }
  });
  
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});
