const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

app.use(express.static(__dirname + '/public'));

app.use(cookieSession({
  name: 'session',
  keys: ["sdfsdfsdg"],
}));

const generateRandomString = () => {
  return String(Math.random().toString(36).slice(2,8));
};

const urlDatabase = {
  "b2xVn2": {
    "longURL": "http://www.lighthouselabs.ca",
    "author": "b2xVn2"
  },
  "9sm5xK": {
    "longURL":"http://www.google.com",
    "author": "9sm5xK"
  }
}

const users = {};

const findUrlsByAuthor = function(database, cookie){
  result = {};

  for (url in database){
    if(database[url]["author"] === cookie){
      result[url] = {
        "longURL": database[url]["longURL"]
      }
    }
  }
  return result;
}

app.get("/", (request, response) => {
  response.redirect("/urls");
});

app.get("/urls", (request, response) => {
  let email = (request.session.user_id) ? users[request.session.user_id].email : "";
  let userDB = findUrlsByAuthor(urlDatabase, request.session.user_id);

  if(request.session.user_id){
  let templateVars = {
    urls: userDB,
    user_id: request.session.user_id,
    email: email,
  };
  response.render("urls_index", templateVars);
  }else{
    response.send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
  }
});

app.get("/urls/new", (request, response) => {

  let email = (request.session.user_id) ? users[request.session.user_id].email : "";
  let userDB = findUrlsByAuthor(urlDatabase, request.session.user_id);

  if (request.session.user_id){

    let templateVars = {
      urls: userDB,
      user_id: request.session.user_id,
      email: email
    };

    response.render("urls_new", templateVars);

  }else{
    response.send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
  }
});

//Add new URL
app.post("/urls", (request, response) => {

  if(request.session.user_id){
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
  urlDatabase[shortUrl] = {
    "longURL": request.body.longURL,
    "author": request.session.user_id,
  }
  response.redirect("http://localhost:8080/urls/" + shortUrl);
  }else{
    response.send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
  }
});

app.post("/urls/:id/delete", (request, response) => {
  delete urlDatabase[request.params.id]
  response.redirect("http://localhost:8080/urls/");
});

app.post("/urls/:id/update", (request, response) => {
  if(!request.body.longURL){
    response.redirect("/urls/" + request.params.id);
    return;
  }
  if(!urlDatabase[request.params.id]){
     response.send("404 Not found.");
     return;
  }
  if(!request.session.user_id){
    response.send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
    return;
  }
   if(urlDatabase[request.params.id]["author"] !== request.session.user_id){
     response.send("403 Forbidden.");
     return;
   }
  else{
   urlDatabase[request.params.id].longURL = request.body.longURL;
   response.redirect("http://localhost:8080/urls/");
  }
});

app.get("/u/:shortURL", (request, response) => {
  if(!urlDatabase[request.params.shortURL]){
    response.send("404 Not found.");
  }else{
    let longURL = urlDatabase[request.params.shortURL].longURL;
    response.redirect(longURL);
  }
 });

app.get("/register", (request, response) =>{
  if(request.session.user_id){
    response.redirect("/");
    return;
  }
  let email = (request.session.user_id) ? users[request.session.user_id].email : "";
  let templateVars = {
    urls: urlDatabase,
    email: email
  }

  response.render("registration", templateVars);
});

//Check to see that user has been added to users objects after registration
 app.get("/users", (request, response) => {
   response.json(users);
 });

app.post("/register", (request, response) =>{
  let userID = generateRandomString();
  let password = request.body.password;
  let hashedPassword = bcrypt.hashSync(password, 10);

  for(let user in users){
    if(users[user]["email"] === request.body.email){
      response.statusCode = 400;
      response.send("400 Bad Request. Email already exists in database.");
      return;
    }
  }
    if(!request.body.password || !request.body.email){
      response.statusCode = 400;
      response.send("400. Please enter a valid email adress and password.");
      return;
    }
    users[userID] = {"id": userID, "email":request.body.email, "password":hashedPassword};
    request.session.user_id = userID;
    response.redirect("/urls");
});

app.get("/urls/:id", (request, response) => {

  if(request.session.user_id){
    let email = users[request.session.user_id] ? users[request.session.user_id].email : "";
    let userDB = findUrlsByAuthor(urlDatabase, request.session.user_id);
    if(urlDatabase.hasOwnProperty(request.params.id)){
      let templateVars = {
        urls: userDB,
        shortURL: request.params.id,
        longURL: urlDatabase[request.params.id].longURL,
        email: email
      }
      response.render("urls_show", templateVars);
    }else{
      response.render("urls_show", {
        shortURL: "URL not in database",
        longURL: "URL not in database",
        email: email
      });
    }
  }else{
      response.send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
    }
});

app.get("/login", (request, response) => {
let email = (request.session.user_id) ? users[request.session.user_id].email : "";
  response.render("urls_login", {
    email: email
  });
});

app.post("/login", (request, response) =>{
  let email = request.body.email;
  let password = request.body.password;

  for(let user in users){
    if(users[user]["email"] === email){
      if(bcrypt.compareSync(password, users[user]["password"])){
          request.session.user_id = users[user]["id"];
          response.redirect("/urls");
          return;
      }else{
        response.send("401 Forbidden. Incorrect password");
        return;
      }
    }
  }
  response.send("403 Forbidden. User not found");
});

app.post("/logout", (request, response) =>{
  request.session = null;
  response.redirect("/login");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
