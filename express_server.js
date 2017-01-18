const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (request, response) => {
  let templateVars = { urls: urlDatabase};
  response.render("urls_index", templateVars);
});

app.get("/urls/new", (request, response) => {
  response.render("urls_new");
});

app.post("/urls", (request, response) => {
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = request.body.longURL;
  response.redirect("http://localhost:8080/urls/" + shortUrl);
  console.log(urlDatabase);        // Respond with 'Ok' (we will replace this)
});

// app.get("/u/:shortURL", (request, response) => {
//   // let longURL = request.body.longURL;
//   console.log(request);
//   res.redirect(/urls/shortURL);

// });

app.get("/urls/:id", (request, response) => {
  if(urlDatabase.hasOwnProperty(request.params.id)){
    let templateVars = {
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


const generateRandomString = () => {
  return String((Math.floor(Math.random()* 1e10).toString(32)));
};
