const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

const generateRandomString = () => {
  return String(Math.random().toString(36).slice(2,8));
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

app.get("/", (request, response) => {
  response.redirect("/urls");
});

app.get("/urls", (request, response) => {
  let templateVars = {
    urls: urlDatabase,
    username: request.cookies["username"]
  };
  response.render("urls_index", templateVars);
});

app.get("/urls/new", (request, response) => {
  response.render("urls_new",
    {username: request.cookies["username"]});
});

//Add new URL
app.post("/urls", (request, response) => {
  let shortUrl = generateRandomString();
  if(!request.body.longURL){
    response.redirect("http://localhost:8080/urls/new");
    return;
  }
  for(let key in urlDatabase){
     if(urlDatabase[key] === request.body.longURL){
      response.redirect("http://localhost:8080/urls/" + key);
      return;
     }
  }
  urlDatabase[shortUrl] = request.body.longURL;
  response.redirect("http://localhost:8080/urls/" + shortUrl);
});

app.post("/urls/:id/delete", (request, response) => {
  delete urlDatabase[request.params.id]
  response.redirect("http://localhost:8080/urls/");
});

app.post("/urls/:id/update", (request, response) => {
   urlDatabase[request.params.id] = request.body.longURL;
   response.redirect("http://localhost:8080/urls/");
});

app.get("/u/:shortURL", (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);
 });

app.get("/register", (request, response) =>{
  response.render("registration", {
    username: request.cookies["username"]
  });
});

app.post("/register", (request, response) =>{
  let userID = generateRandomString();
  // console.log(userID);
  for(let user in users){
    if(users[user]["email"] === request.body.email){
      response.statusCode = 400;
      response.send("Error code 400. Email already exists in database.");
      return;
    }
  }
    if(!request.body.password || !request.body.email){
      response.statusCode = 400;
      response.send("Error code 400. Please enter a valid email adress and password.");
      return;
    }
    users[userID] = {"id": userID, "email":request.body.email, "password":request.body.password};
    response.cookie("user_id", userID);
    response.redirect("/urls");
});

app.get("/urls/:id", (request, response) => {
  if(urlDatabase.hasOwnProperty(request.params.id)){
    let templateVars = {
      shortURL: request.params.id,
      longURL: urlDatabase[request.params.id],
      username: request.cookies["username"]
    }
    response.render("urls_show", templateVars);
  }else{
    response.render("urls_show", {
    shortURL: "URL not in database",
    longURL: "URL not in database",
    username: request.cookies["username"]
    });
  }
});

app.post("/login", (request, response) =>{
  response.cookie("username", request.body.username);
  console.log(request.body.username);
  response.redirect("/urls");
});

app.post("/logout", (request, response) =>{
  response.clearCookie("username");
  response.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
