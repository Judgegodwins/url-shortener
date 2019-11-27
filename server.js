'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();
const bodyParser = require('body-parser');

// Basic Configuration 
var port = process.env.PORT || 3000;

const dns = require('dns');
var url = require('url');
/** this project needs a db !! **/ 
var uri = 'mongodb+srv://Judge:456fg789%23%25%24@cluster0-3ldxj.mongodb.net/test?retryWrites=true&w=majority'
mongoose.connect(uri, {useNewUrlParser: true}, (err) => {
  if(err) console.log(err);
});

var Schema = mongoose.Schema;

var urlSchema = new Schema({
  original_url: {
    type: String,
    required: true,
    unique: true
  },
  short_url: {
    type: String,
    required: true,
    unique: true
  }
})

var Site = mongoose.model('Site', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', (req, res) => {
  var inputUrl, hostname
  
  try {
    inputUrl = new URL(req.body.url);
    hostname = inputUrl.hostname;
  } catch(error) {
    res.json({error: 'invalid URL'})
  }


  dns.lookup(hostname, (err, address, family) => {
    console.log('address: %j family: IPv%s', address, family);
    
    if(!address && !family) {
      res.json({error: 'invalid Hostname'});
    } else {
      checkOrSave(inputUrl, res);
    }
  })
  
})

function checkOrSave(inUrl, res, done) {
  Site.findOne({original_url: inUrl}).select({_id: 0, __v: 0}).exec((err, data) => {
    if(err) done(err);
    
    if(!data) {
      let site = new Site({
        original_url: inUrl,
        short_url: Math.floor(Math.random() * 9000) + 1
      });
      site.save((err, data) => {
        if(err) done(err);
        res.json({original_url: data.original_url, short_url: data.short_url});
      });
    } else {
      res.json(data);
    }
  })
}
app.get('/api/shorturl/:num', (req, res) => {

  Site.findOne({short_url: req.params.num}, (err, data) => {
    if(data) {
      res.redirect(data.original_url);
    } else {
      res.json({error: "No short url found for given input"});
    }
  })
  
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});