const express = require("express");
const cookieParser = require('cookie-parser');
const crypto = require("crypto");
const { clear } = require("console");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");

const app = express();
app.set("view engine", "ejs");

const PORT = 8080; // default port 8080

// DATABASE OBJECTS
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user3RandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

//just keeping these so that we have test people to run without having to constantly recreate them. Normally this would never be done
const password1 = "purple-monkey-dinosaur"; 
const hashedPassword1 = bcrypt.hashSync(password1, 10);
const password2 = "dishwasher-funk"; 
const hashedPassword2 = bcrypt.hashSync(password2, 10);
const password3 = "simple"; 
const hashedPassword3 = bcrypt.hashSync(password3, 10);

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: hashedPassword1,
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: hashedPassword2,
  },
  user3RandomID: {
    id: "user3RandomID",
    email: "user3@example.com",
    password: hashedPassword3,
  }
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
      if (bcrypt.compareSync(password, users[user].password)) {
        //console.log('user id: ', users[user].id);
        return users[user].id;
      }
    }
  }
  //console.log('no matched password found');
  return false;
};

const urlsForUser = function(id) {
  const newDatabase = {};
  for (let item in urlDatabase) {
    console.log('item:', item, 'user_id:', urlDatabase[item].userID, 'id.id:', id.id);
    if (urlDatabase[item].userID === id.id) {
      newDatabase[item] = urlDatabase[item].longURL; 

    }
  }
  return newDatabase;
};

// middleware pieces
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// EDGE CASE: may want to add in something to check if it starts with http:// or not, like: if (urlDatabase[shortName])

// DELETE (done as POST, but ideally done as DELETE due to browser limitations)
app.post("/urls/:id/delete", (req, res) => {
  // console.log(`${req.params.id} has been deleted.`); // Log the POST request body to the console
  // Update the edit and delete endpoints such that only the owner (creator) of the URL can edit or delete the link. 
  if (!req.cookies.user_id) {
    return res.status(400).send('BAD REQUEST:<br>Please login.<br><a href="/login">LOGIN</a>\n');
  } 
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
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[user_id] = { id: user_id, email: req.body.email, password: hashedPassword };
  res.cookie("user_id", users[user_id]); // I think this is async
  //console.log(users);
  return res.redirect("/urls");
});

// UPDATE (done as POST, but ideally done as PUT due to browser limitations)
app.post("/urls/:id", (req, res) => {
  //rewrite the entry in urlDatabase for the id passed using the body passed const id = req.params.id;
  // Update the edit and delete endpoints such that only the owner (creator) of the URL can edit or delete the link. 
  if (!req.cookies.user_id) {
    return res.status(400).send('BAD REQUEST:<br>Please login.<br><a href="/login">LOGIN</a>\n');
  } 
  urlDatabase[req.params.id.longURL] = req.body.longURL;
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
  if (!req.cookies.user_id) {
    res.status(403).send("ACCESS DENIED: You must be logged in to shorten URLs.\n");
  } else {
    const shortName = generateRandomString();
    console.log(shortName, req.body, req.cookies.user_id.id);
    urlDatabase[shortName] = { longURL: req.body.longURL, userID: req.cookies.user_id.id };
    //const templateVars = { id: shortName, longURL: urlDatabase[shortName].longURL };
    res.redirect("/urls");
  }
  //console.log(urlDatabase);
});

// The order of route definitions matters!
app.get("/", (req, res) => { // request and response
  res.send("Hello!");
});

app.get("/login", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { user_id: req.cookies["user_id"] };
    res.render("urls_login", templateVars);
  }
});

app.get("/register", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { user_id: req.cookies["user_id"] };
    res.render("urls_register", templateVars);
  }
});

app.get("/urls", (req, res) => {
  // Return HTML with a relevant error message at GET /urls if the user is not logged in.
  if (!req.cookies.user_id) {
    res.status(400).send('BAD REQUEST:<br>Please login to view your shortened URLs<br><a href="/login">LOGIN</a> or <a href="/register">REGISTER</a>\n');
  } else {
    // The GET /urls page should only show the logged in user's URLs. 
    const userUrlDatabase = urlsForUser(req.cookies.user_id);
    console.log('urls for user id:', userUrlDatabase);

    const templateVars = { user_id: req.cookies["user_id"], urls: userUrlDatabase };
    res.render("urls_index", templateVars);
}
});

app.get("/urls/new", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { user_id: req.cookies["user_id"] };
    res.render("urls_new", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  // Implement a relevant HTML error message if the id does not exist at GET /u/:id.
  if (!urlDatabase[req.params.id].longURL) {
    res.status(400).send("Bad Request: URL not found for that id.\n");
    res.redirect('/urls');
  }
  const longURL = urlDatabase[req.params.id].longURL;
  // console.log(longURL);
  res.redirect(longURL);
});

// EDGE CASE: what if cx requests a short URL with a non-existant id?
app.get("/urls/:id", (req, res) => {
  // Ensure the GET /urls/:id page returns a relevant error message to the user if they are not logged in.
  if (!req.cookies.user_id) {
    return res.status(400).send('BAD REQUEST:<br>Please login to view details of this shortened URL.<br><a href="/login">LOGIN</a> or <a href="/register">REGISTER</a>\n');
  } 
    // Ensure the GET /urls/:id page returns a relevant error message to the user if they do not own the URL.
  const userID = req.cookies.user_id;
  console.log('id:', req.params.id);
  const userUrlDatabase = urlsForUser(userID);
  console.log(userUrlDatabase, req.params.id);
  if (userUrlDatabase && (req.params.id in userUrlDatabase)) {
    const templateVars = { user_id: userID, id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
    return res.render("urls_show", templateVars);
  }
  return res.status(403).send("FORBIDDEN: You don't have permission to access this item.\n")
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