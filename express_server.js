const express = require("express");
const cookieParser = require('cookie-parser');
const crypto = require("crypto");
//const { clear } = require("console");
const morgan = require('morgan');

const app = express();
app.set("view engine", "ejs");

const PORT = 8080; // default port 8080

// DATABASE OBJECTS
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// HELPER FUNCTIONS
const generateRandomString = function() {
  let result = crypto.randomBytes(3).toString('hex');
  //console.log(result);
  return result;
};

const findUserByEmail = function(value) {
  for (let user in users) {
    //console.log('user:', [users[user]]);
    if (users[user].email === value) {
      return users[user].id;
    }
  }
  return false;
};

const matchPassword = function(email, password) {
  for (let user in users) {
    if (users[user].email === email) {
      //console.log('user email:', users[user].email, 'user password:', users[user].password);
      if (users[user].password === password) {
        //console.log('user id: ', users[user].id);
        return users[user].id;
      }
    }
  }
  //console.log('no matched password found');
  return false;
};

// middleware pieces
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// EDGE CASE: may want to add in something to check if it starts with http:// or not, like: if (urlDatabase[shortName])

// DELETE (done as POST, but ideally done as DELETE due to browser limitations)
app.post("/urls/:id/delete", (req, res) => {
  // console.log(`${req.params.id} has been deleted.`); // Log the POST request body to the console
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// endpoint to handle registration form data
app.post("/register", (req, res) => {
  // If the e-mail or password are empty strings, send back a response with the 400 status code.
  if (req.body.email === "" || req.body.password === "") {
    return res.status(400).send('400 - Bad Request');
  }
  // If someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
  const found = findUserByEmail(req.body.email);

  if (found) {
    return res.status(400).send('400 - Bad Request');
  }

  const user_id = generateRandomString();
  users[user_id] = { id: user_id, email: req.body.email, password: req.body.password };
  res.cookie("user_id", users[user_id]); // I think this is async
  //console.log(users);
  return res.redirect("/urls");
});

// UPDATE (done as POST, but ideally done as PUT due to browser limitations)
app.post("/urls/:id", (req, res) => {
  //rewrite the entry in urlDatabase for the id passed using the body passed const id = req.params.id;
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// add an endpoint to handle a POST to /login in your Express server
app.post("/login", (req, res) => {

  const emailFound = findUserByEmail(req.body.email);

  // If a user with that e-mail cannot be found, return a response with a 403 status code.
  if (!emailFound) {
    //console.log('email not matched')
    return res.status(403).send('403 - Forbidden');
  }

  //If a user with that e-mail address is located, compare the password given in the form with the existing user's password. If it does not match, return a response with a 403 status code.

  const passwordFound = matchPassword(req.body.email, req.body.password);

  if (!passwordFound) {
    //console.log('password not matched')
    return res.status(403).send('403 - Forbidden');
  }
  //console.log('user: ', users[passwordFound]);
  res.cookie("user_id", users[passwordFound]); // I think this is async
  //console.log('Cookies: ', req.cookies); // so this is coming before the new value
  res.redirect("/urls");
});

// add an endpoint to handle a POST to /logout in your Express server
app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.body.user_id); // I think this is async
  //console.log('Cookies: ', req.cookies); // so this is coming before the new value
  res.redirect("/login");
});

app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the POST request body to the console
  const shortName = generateRandomString();
  urlDatabase[shortName] = req.body.longURL;
  //console.log(urlDatabase);
  const templateVars = { id: shortName, longURL: urlDatabase[shortName] };
  res.render("urls_show", templateVars);
});

// The order of route definitions matters!
app.get("/", (req, res) => { // request and response
  res.send("Hello!");
});

app.get("/login", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"], urls: urlDatabase };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"], urls: urlDatabase };
  res.render("urls_register", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  // console.log(longURL);
  res.redirect(longURL);
});

// EDGE CASE: what if cx requests a short URL with a non-existant id?
app.get("/urls/:id", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});