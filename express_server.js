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
app.use(methodOverride('_method'));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user3RandomID",
    totalVisits: 0,
    uniqueVisitors: 0,
    visitorsLog: [[]],
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
    totalVisits: 0,
    uniqueVisitors: 0,
    visitorsLog: [[]],
  },
};

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
//    I made it do http:// as value in the form so it starts with that. Not perfect, but all I had the brainpower for at the moment.
// DELETE (done as POST, but ideally done as DELETE due to browser limitations)
app.delete("/urls/:id", (req, res) => {
  // Update the edit and delete endpoints such that only the owner (creator) of the URL can edit or delete the link.
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
  const found = getUserByEmail(req.body.email, users);
  if (found) {
    return res.status(400).send('400 - Bad Request');
  }

  const user_id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[user_id] = { id: user_id, email: req.body.email, password: hashedPassword };
  
  req.session = users[user_id];
  return res.redirect("/urls");
});

// UPDATE (done as POST, but ideally done as PUT due to browser limitations)
app.put("/urls/:id", (req, res) => {
  //rewrite the entry in urlDatabase for the id passed using the body passed const id = req.params.id;
  // Update the edit and delete endpoints such that only the owner (creator) of the URL can edit or delete the link.
  if (!req.session.id) {
    return res.status(400).send('BAD REQUEST:<br>Please login.<br><a href="/login">LOGIN</a>\n');
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  return res.redirect("/urls");
});

// add an endpoint to handle a POST to /login in your Express server
app.post("/login", (req, res) => {

  const emailFound = getUserByEmail(req.body.email, users);
  // If a user with that e-mail cannot be found, return a response with a 403 status code.
  if (!emailFound) {
    return res.status(403).send('403 - Forbidden');
  }

  //If a user with that e-mail address is located, compare the password given in the form with the existing user's password. If it does not match, return a response with a 403 status code.

  const passwordFound = matchPassword(req.body.email, req.body.password, users);

  if (!passwordFound) {
    return res.status(403).send('403 - Forbidden');
  }
  req.session = users[passwordFound];

  return res.redirect("/urls");
});

// add an endpoint to handle a POST to /logout in your Express server
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/login");
});

app.post("/urls", (req, res) => {
  if (!req.session.id) {
    return res.status(403).send("ACCESS DENIED: You must be logged in to shorten URLs.\n");
  } else {
    const shortName = generateRandomString();
    urlDatabase[shortName] = { longURL: req.body.longURL, userID: req.session.id, totalVisits: 0, uniqueVisitors: 0, visitorsLog: [[]], };
    return res.redirect("/urls");
  }
});

// The order of route definitions matters!
app.get("/", (req, res) => { // request and response
  return res.send("Hello!");
});

app.get("/login", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  if (req.session.id) {
    return res.redirect("/urls");
  } else {
    const templateVars = { user_id: req.session };
    return res.render("urls_login", templateVars);
  }
});

app.get("/register", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  if (req.session.id) {
    return res.redirect("/urls");
  } else {
    const templateVars = { user_id: req.session };
    return res.render("urls_register", templateVars);
  }
});

app.get("/urls", (req, res) => {
  // Return HTML with a relevant error message at GET /urls if the user is not logged in.
  if (!req.session.id) {
    return res.status(400).send('BAD REQUEST:<br>Please login to view your shortened URLs<br><a href="/login">LOGIN</a> or <a href="/register">REGISTER</a>\n');
  } else {
    // The GET /urls page should only show the logged in user's URLs.
    const userUrlDatabase = urlsForUser(req.session, urlDatabase);
    const templateVars = { user_id: req.session, urls: userUrlDatabase };
    return res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  // if user is logged in, GET /login should redirect to GET /urls
  if (!req.session.id) {
    return res.redirect("/login");
  } else {
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
  let visitorId = req.cookies.visitorId || generateRandomString(); // short-circuit evaluation
  if (req.cookies.visitorId === undefined) {
    res.cookie('visitorId', visitorId);
    res.cookie(siteId, siteId);
    urlDatabase[siteId].uniqueVisitors += 1;
  } else if (req.cookies[siteId] === undefined) {
    res.cookie(siteId, siteId);
    urlDatabase[siteId].uniqueVisitors += 1;
  }

  const longURL = urlDatabase[siteId].longURL;

  urlDatabase[siteId].totalVisits += 1;
  const timeStamp = Date();
  console.log(timeStamp, req.cookies.siteId, visitorId);
  urlDatabase[siteId].visitorsLog.push([timeStamp, visitorId]);

  return res.redirect(longURL);
});

// EDGE CASE: what if cx requests a short URL with a non-existant id?
app.get("/urls/:id", (req, res) => {
  // Ensure the GET /urls/:id page returns a relevant error message to the user if they are not logged in.
  if (!req.session.id) {
    return res.status(400).send('BAD REQUEST:<br>Please login to view details of this shortened URL.<br><a href="/login">LOGIN</a> or <a href="/register">REGISTER</a>\n');
  }
  // Ensure the GET /urls/:id page returns a relevant error message to the user if they do not own the URL.
  const userID = req.session;
  const userUrlDatabase = urlsForUser(userID, urlDatabase);
  if (userUrlDatabase && (req.params.id in userUrlDatabase)) {
    const templateVars = { user_id: userID, id: req.params.id, longURL: urlDatabase[req.params.id].longURL, totalVisits: urlDatabase[req.params.id].totalVisits, uniqueVisitors: urlDatabase[req.params.id].uniqueVisitors, visitorsLog: urlDatabase[req.params.id].visitorsLog };
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