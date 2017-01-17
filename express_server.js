var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (request, response) => {
  var templateVars = { urls: urlDatabase};
  response.render("urls_index", templateVars);
});

app.get("/urls/:id", (request, response) => {
  if(urlDatabase.hasOwnProperty(request.params.id)){
    var templateVars = {
      shortURL: "http://" + request.params.id +".com",
      longURL: urlDatabase[request.params.id]
    }
    response.render("urls_show", templateVars);
  }else{
    response.render("urls_show", {
    shortURL: "URL not in database",
    longURL: "URL not in database"
    });
  }
});

app.get("/urls/new", (request, response) => {
  response.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  respond.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/", (request, response) => {
  response.end("Hello!");
});

app.get("/urls.json", (request, response) => {
  response.json(urlDatabase);
});

app.get("/hello", (request, response) => {
  response.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});