// npm packages
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const cheerio = require("cheerio");
const axios = require("axios");
const logger = require("morgan");

const db = require('./models');

let PORT = 8080;

const app = express();

//Middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/");

// setup handlebars view main folder default
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// If deployed, use the deployed database. Otherwise use the local MongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

//Routes
app.get('/', function(req, res){
    res.render('index')
});

app.get('/scrape', function(req, res){
    // First, we grab the body of the html with request
    axios.get('').then(function(response){
        // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("").each(function(i, element) {
        // Save an empty result object
        var result ={};

    // Add the text and href of every link, and save them as properties of the result object
    result.title = $(this)
      .children("a")
      .attr("title");
    result.link = $(this)
      .children("a")
      .attr("href");
    result.img = $(this)
        .children("a")  
        .children("img")
        .atrr("src");
    
        db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    })

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.redirect("/articles");
   });
});







// Starting the server
app.listen(PORT, function(){
    console.log('Running on PORT: ' + PORT);
});





