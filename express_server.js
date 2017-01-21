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
  keys: ["sdfsdfsdg"]
}));

const generateRandomString = () => {
  return String(Math.random().toString(36).slice(2, 8));
};

const urlDatabase = {
  "b2xVn2": {
    "longURL": "http://www.lighthouselabs.ca",
    "author": "b2xVn2"
  },
  "9sm5xK": {
    "longURL": "http://www.google.com",
    "author": "9sm5xK"
  }
};

const usersDatabase = {};

const findUrlsByAuthor = function(database, cookie){
  result = {};

  for (url in database){
    if(database[url]["author"] === cookie){
      result[url] = {
        "longURL": database[url]["longURL"]
      };
    }
  }
  return result;
};

const checkLoginDetails = function(email, password, database){
  for(let user in database){
    if(database[user]["email"] === email){
      if(bcrypt.compareSync(password, database[user]["password"])){
        return database[user]["id"];
      }
    }
    }
  return;
};

app.get("/login", (request, response) => {
  if(request.session.user_id){
    response.redirect("/");
  }else{
    let email = (request.session.user_id) ? usersDatabase[request.session.user_id].email : "";
    response.render("urls_login", {
      email: email
    });
  }
});

app.post("/login", (request, response) => {

  let email = request.body.email;
  let password = request.body.password;
  let userID = checkLoginDetails(email, password, usersDatabase);

  if(userID){
    request.session.user_id = userID;
    response.redirect("/urls");
  }else{
    response.status(401).send("401 Forbidden. Please check <a href=\"/login\">Login</a> details and ensure you have created an account with us.");
  }

});

app.post("/logout", (request, response) =>{
  request.session = null;
  response.redirect("/login");
});

app.get("/", (request, response) => {
  if(request.session.user_id){
    response.redirect("/urls");
  }else{
    response.redirect("/login");
  }
});

app.get("/urls", (request, response) => {
  let email = (request.session.user_id) ? usersDatabase[request.session.user_id].email : "";
  let userDB = findUrlsByAuthor(urlDatabase, request.session.user_id);

  if(request.session.user_id){
    let templateVars = {
      urls: userDB,
      user_id: request.session.user_id,
      email: email
    };
    response.render("urls_index", templateVars);
  }else{
    response.status(401).send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
  }
});

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
      "author": request.session.user_id
    };
    response.redirect("http://localhost:8080/urls/" + shortUrl);
  }else{
    response.status(401).send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
  }
});

app.get("/urls/new", (request, response) => {

  let email = (request.session.user_id) ? usersDatabase[request.session.user_id].email : "";
  let userDB = findUrlsByAuthor(urlDatabase, request.session.user_id);

  if(request.session.user_id){

    let templateVars = {
      urls: userDB,
      user_id: request.session.user_id,
      email: email
    };

    response.render("urls_new", templateVars);
  }else{
    response.status(401).send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
  }
});

app.post("/urls/:id/delete", (request, response) => {
  if(!request.session.user_id){
    response.status(401).send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
  }
  if(urlDatabase[request.params.id]["author"] !== request.session.user_id){
    response.status(403).send("403 Forbidden.");
  }else{
    delete urlDatabase[request.params.id];
    response.redirect("http://localhost:8080/urls/");
  }
});

app.post("/urls/:id/update", (request, response) => {
  if(!request.session.user_id){
    response.status(401).send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
    return;
  }
  if(!request.body.longURL){
    response.redirect("/urls/" + request.params.id);
    return;
  }
  if(!urlDatabase[request.params.id]){
    response.status(404).send("404 Not found.");
    return;
  }
  if(urlDatabase[request.params.id]["author"] !== request.session.user_id){
    response.status(403).send("403 Forbidden.");
    return;
  }else{
    urlDatabase[request.params.id].longURL = request.body.longURL;
    response.redirect("http://localhost:8080/urls/" + request.params.id);
  }
});

app.get("/u/:shortURL", (request, response) => {
  if(!urlDatabase[request.params.shortURL]){
    response.status(404).send("404 Not found.");
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
  let email = (request.session.user_id) ? usersDatabase[request.session.user_id].email : "";
  let templateVars = {
    urls: urlDatabase,
    email: email
  };

  response.render("registration", templateVars);
});

app.post("/register", (request, response) =>{
  let userID = generateRandomString();
  let password = request.body.password;
  let hashedPassword = bcrypt.hashSync(password, 10);

  for(let user in usersDatabase){
    if(usersDatabase[user]["email"] === request.body.email){
      response.status(400).send("400 Bad Request. Email already exists in database.");
      return;
    }
  }
  if(!request.body.password || !request.body.email){
    response.status(400).send("400. Please enter a valid email adress and password.");
    return;
  }
  usersDatabase[userID] = {"id": userID, "email": request.body.email, "password": hashedPassword};
  request.session.user_id = userID;
  response.redirect("/urls");
});

app.get("/urls/:id", (request, response) => {

  let email = usersDatabase[request.session.user_id] ? usersDatabase[request.session.user_id].email : "";
  let userDB = findUrlsByAuthor(urlDatabase, request.session.user_id);

  //If user is logged in
  if(request.session.user_id){
    //If url exists
    if(urlDatabase[request.params.id]){
      //If url author matches cookie, render the page
      if(urlDatabase[request.params.id]["author"] === request.session.user_id){
        let templateVars = {
          urls: userDB,
          shortURL: request.params.id,
          longURL: urlDatabase[request.params.id].longURL,
          email: email
        };
        response.render("urls_show", templateVars);
      }else{
        response.status(403).send("403 Forbidden.");
      }
    }else{
      response.status(404).send("404 File not found.");
    }
  }else{
    response.status(401).send("401 Unauthorized. Please <a href=\"/login\">Login</a>");
  }
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
