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
    axios.get('https://www.nytimes.com/').then(function(response){
        // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("div .collection").each(function(i, element) {
        // Save an empty result object
        var result ={};

        console.log(result);

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

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
    .then(function(dbArticle){
        var hbsObject = {
            articles: dbArticle
        };
        consloe.log('index', hbsObject);
    })
    .catch(function(err){
        res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get('/articles/:id', function(req, res){
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({_id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate('note')
    .then(function(dbArticle){
        // If we were able to successfully find an Article with the given id, send it back to the client
        consloe.log('dbArticle', dbArticle);
      res.json(dbArticle);
    })
     .catch(function (err) {
         // If an error occurred, send it to the client
         res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });








// Starting the server
app.listen(PORT, function(){
    console.log('Running on PORT: ' + PORT);
});





