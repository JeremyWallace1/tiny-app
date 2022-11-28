const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const crypto = require("crypto");

app.set("view engine", "ejs");

const generateRandomString = function() {
  let result = crypto.randomBytes(3).toString('hex');
  console.log(result);
  return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// a middleware piece
app.use(express.urlencoded({ extended: true }));

// EDGE CASE: may want to add in something to check if it starts with http:// or not, like: if (urlDatabase[shortName])


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

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  // console.log(longURL);
  res.redirect(longURL);
});

// EDGE CASE: what if cx requests a short URL with a non-existant id?
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
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