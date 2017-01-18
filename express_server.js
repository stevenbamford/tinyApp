const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const generateRandomString = () => {
  return String(Math.random().toString(36).slice(2,8));
};

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

app.post("/urls/new", (request, response) => {
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = request.body.longURL;
  response.redirect("http://localhost:8080/urls/" + shortUrl);
});

app.post("/urls/:id/delete", (request, response) => {
  delete urlDatabase[request.params.id]
  response.redirect("http://localhost:8080/urls/");
});

app.post("/urls/:id/update", (request, response) => {
  console.log(request.params);
   urlDatabase[request.params.id] = request.body.longURL;
   response.redirect("http://localhost:8080/urls/");
});


app.get("/u/:shortURL", (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);
 });

app.get("/urls/:id", (request, response) => {
  if(urlDatabase.hasOwnProperty(request.params.id)){
    let templateVars = {
      shortURL: request.params.id,
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


// app.get("/", (request, response) => {
//   response.end("Hello!");
// });

// app.get("/urls.json", (request, response) => {
//   response.json(urlDatabase);
// });

// app.get("/hello", (request, response) => {
//   response.end("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
