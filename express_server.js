const express = require("express");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const { generateRandomString, matchPassword, urlsForUser, getUserByEmail } = require("./helpers");
const methodOverride = require('method-override');

const app = express();
app.set("view engine", "ejs");

const PORT = 8080; // default port 8080

// middleware pieces
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['consuelabananahammock', 'faloolafilangi'],
  maxAge: 24 * 60 * 60 * 1000,
}));
app.use(morgan('dev'));
app.use(methodOverride('_method'))

// DATABASE OBJECTS
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user3RandomID",
    totalVisits: 0,
    uniqueVisitors: 0,
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
    totalVisits: 0,
    uniqueVisitors: 0,
  },
};

const visits = { b6UTxQ: {}, i3BoGr: {} }; // # of visits


//just keeping these so that we have test people to run without having to constantly recreate them. Normally this would never be done.
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



// EDGE CASE: may want to add in something to check if it starts with http:// or not, like: if (urlDatabase[shortName])

// DELETE (done as POST, but ideally done as DELETE due to browser limitations)
app.delete("/urls/:id", (req, res) => {
  // console.log(`${req.params.id} has been deleted.`); // Log the POST request body to the console
  // Update the edit and delete endpoints such that only the owner (creator) of the URL can edit or delete the link.
  //if (!req.cookies.user_id) {
  if (!req.session.id) {
    return res.status(400).send('BAD REQUEST:<br>Please login.<br><a href="/login">LOGIN</a>\n');
  }
  delete urlDatabase[req.params.id];
  return res.redirect("/urls");
});

// endpoint to handle registration form data
app.post("/register", (req, res) => {
  // If the e-mail or password are empty strings, send back a response with the 400 status code.
  if (req.body.email === "" || req.body.password === "") {
    return res.status(400).send('400 - Bad Request');
  }
  // If someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
  // console.log(users);
  const found = getUserByEmail(req.body.email, users);
  // console.log("found:", found);
  if (found) {
    // console.log("found:", found);
    return res.status(400).send('400 - Bad Request');
  }

  const user_id = generateRandomString();
  // console.log(user_id);
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[user_id] = { id: user_id, email: req.body.email, password: hashedPassword };
  
  // console.log(users[user_id]);
  //res.cookie("user_id", users[user_id]); // I think this is async
  req.session = users[user_id];
  // console.log('req.session:', req.session);
  console.log('user database:\n', users);
  return res.redirect("/urls");
});

// UPDATE (done as POST, but ideally done as PUT due to browser limitations)
app.put("/urls/:id", (req, res) => {
  //rewrite the entry in urlDatabase for the id passed using the body passed const id = req.params.id;
  // Update the edit and delete endpoints such that only the owner (creator) of the URL can edit or delete the link.
  //if (!req.cookies.user_id) {
  if (!req.session.id) {
    return res.status(400).send('BAD REQUEST:<br>Please login.<br><a href="/login">LOGIN</a>\n');
  }
  // console.log('urlDatabase:', urlDatabase);
  // console.log('req.params.id:', req.params.id);
  // console.log('urlDatabase[req.params.id].longURL:', urlDatabase[req.params.id].longURL, 'req.body.longURL:', req.body.longURL);
  urlDatabase[req.params.id].longURL = req.body.longURL;
  return res.redirect("/urls");
});

// add an endpoint to handle a POST to /login in your Express server
app.post("/login", (req, res) => {

  const emailFound = getUserByEmail(req.body.email, users);
  // console.log('email found:', emailFound);
  // console.log('req.session:', req.session);
  // If a user with that e-mail cannot be found, return a response with a 403 status code.
  if (!emailFound) {
    //console.log('email not matched')
    return res.status(403).send('403 - Forbidden');
  }

  //If a user with that e-mail address is located, compare the password given in the form with the existing user's password. If it does not match, return a response with a 403 status code.

  const passwordFound = matchPassword(req.body.email, req.body.password, users);

  if (!passwordFound) {
    //console.log('password not matched')
    return res.status(403).send('403 - Forbidden');
  }
  //console.log('user: ', users[passwordFound]);
  //res.cookie("user_id", users[passwordFound]); // I think this is async
  req.session = users[passwordFound];
  //console.log('Cookies: ', req.cookies); // so this is coming before the new value
  // console.log('req.session:', req.session);
  // console.log('req.session.id:', req.session.id);

  return res.redirect("/urls");
});

// add an endpoint to handle a POST to /logout in your Express server
app.post("/logout", (req, res) => {
  //res.clearCookie("user_id", req.body.user_id); // I think this is async
  req.session = null;
  //console.log('Cookies: ', req.cookies); // so this is coming before the new value
  // console.log('req.session:', req.session);
  return res.redirect("/login");
});

app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the POST request body to the console
  //if (!req.cookies.user_id) {
  if (!req.session.id) {
    return res.status(403).send("ACCESS DENIED: You must be logged in to shorten URLs.\n");
  } else {
    const shortName = generateRandomString();
    //console.log(shortName, req.body, req.cookies.user_id.id);
    //urlDatabase[shortName] = { longURL: req.body.longURL, userID: req.cookies.user_id.id };
    urlDatabase[shortName] = { longURL: req.body.longURL, userID: req.session.id };
    //const templateVars = { id: shortName, longURL: urlDatabase[shortName].longURL };
    return res.redirect("/urls");
  }
  //console.log(urlDatabase);
});

// The order of route definitions matters!
app.get("/", (req, res) => { // request and response
  return res.send("Hello!");
});

app.get("/login", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  //if (req.cookies.user_id) {
  if (req.session.id) {
    // console.log('req.session:', req.session);
    return res.redirect("/urls");
  } else {
    //const templateVars = { user_id: req.cookies["user_id"] };
    const templateVars = { user_id: req.session };
    return res.render("urls_login", templateVars);
  }
});

app.get("/register", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  //if (req.cookies.user_id) {
  if (req.session.id) {
    return res.redirect("/urls");
  } else {
    //const templateVars = { user_id: req.cookies["user_id"] };
    const templateVars = { user_id: req.session };
    return res.render("urls_register", templateVars);
  }
});

app.get("/urls", (req, res) => {
  // Return HTML with a relevant error message at GET /urls if the user is not logged in.
  //if (!req.cookies.user_id) {
  if (!req.session.id) {
    return res.status(400).send('BAD REQUEST:<br>Please login to view your shortened URLs<br><a href="/login">LOGIN</a> or <a href="/register">REGISTER</a>\n');
  } else {
    // The GET /urls page should only show the logged in user's URLs.
    //const userUrlDatabase = urlsForUser(req.cookies.user_id);
    // console.log("cookie:", req.session, "\nusers:", users);
    const userUrlDatabase = urlsForUser(req.session, urlDatabase);
    // console.log('urls for user id:', userUrlDatabase);
    //const templateVars = { user_id: req.cookies["user_id"], urls: userUrlDatabase };
    const templateVars = { user_id: req.session, urls: userUrlDatabase };
    return res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  //if (!req.cookies.user_id) {
  if (!req.session.id) {
    return res.redirect("/login");
  } else {
    //const templateVars = { user_id: req.cookies["user_id"] };
    const templateVars = { user_id: req.session };
    return res.render("urls_new", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  // Implement a relevant HTML error message if the id does not exist at GET /u/:id.
  const siteId = req.params.id;
  if (!urlDatabase[req.params.id].longURL) {
    return res.status(400).send("Bad Request: URL not found for that id.\n");
  }
  // console.log(req.cookies.visitorId);
  if (req.cookies.visitorId === undefined) {
    const randNum = generateRandomString();
    res.cookie('visitorId', randNum);
    res.cookie(siteId, siteId);
    urlDatabase[siteId].uniqueVisitors += 1;
  } else if (req.cookies[siteId] === undefined) {
    res.cookie(siteId, siteId);
    urlDatabase[siteId].uniqueVisitors += 1;
  }

  const visitId = req.cookies.visitorId;
  const longURL = urlDatabase[siteId].longURL;

  urlDatabase[siteId].totalVisits += 1;

  // console.log("Number of visits to shortURLs:", urlDatabase);
  // console.log("total visits to this shortURL:",siteId, urlDatabase[siteId]['totalVisits']);
  // console.log("Number of visits by:", [visitId], "to", siteId, "=", urlDatabase[siteId][visitId]);

  return res.redirect(longURL);
});

// EDGE CASE: what if cx requests a short URL with a non-existant id?
app.get("/urls/:id", (req, res) => {
  // Ensure the GET /urls/:id page returns a relevant error message to the user if they are not logged in.
  //if (!req.cookies.user_id) {
  if (!req.session.id) {
    return res.status(400).send('BAD REQUEST:<br>Please login to view details of this shortened URL.<br><a href="/login">LOGIN</a> or <a href="/register">REGISTER</a>\n');
  }
  // Ensure the GET /urls/:id page returns a relevant error message to the user if they do not own the URL.
  //const userID = req.cookies.user_id;
  const userID = req.session;
  // console.log('id:', req.params.id);
  const userUrlDatabase = urlsForUser(userID, urlDatabase);
  // console.log('userUrlDatabase:', userUrlDatabase, 'id:', req.params.id);
  if (userUrlDatabase && (req.params.id in userUrlDatabase)) {
    const templateVars = { user_id: userID, id: req.params.id, longURL: urlDatabase[req.params.id].longURL, totalVisits: urlDatabase[req.params.id].totalVisits, uniqueVisitors: urlDatabase[req.params.id].uniqueVisitors };
    return res.render("urls_show", templateVars);
  }
  return res.status(403).send("FORBIDDEN: You don't have permission to access this item.\n");
});

app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  return res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  return console.log(`Example app listening on port ${PORT}!`);
});