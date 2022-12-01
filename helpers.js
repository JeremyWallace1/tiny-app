const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// HELPER FUNCTIONS
const generateRandomString = function() {
  let result = crypto.randomBytes(3).toString('hex');
  //console.log(result);
  return result;
};


const matchPassword = function(email, password, database) {
  for (let user in database) {
    if (database[user].email === email) {
      //console.log('user email:', users[user].email, 'user password:', users[user].password);
      if (bcrypt.compareSync(password, database[user].password)) {
        //console.log('user id: ', users[user].id);
        return database[user].id;
      }
    }
  }
  //console.log('no matched password found');
  return false;
};

const urlsForUser = function(id, database) {
  const newDatabase = {};
  for (let item in database) {
    // console.log('item:', item, 'user_id:', urlDatabase[item].userID, 'id.id:', id.id);
    if (database[item].userID === id.id) {
      newDatabase[item] = database[item].longURL;

    }
  }
  return newDatabase;
};

const getUserByEmail = function(email, database) {
  for (let user in database) {
    //console.log('user:', [users[user]]);
    if (database[user].email === email) {
      console.log('user id that was found:', database[user].id);
      return database[user].id;
    }
  }
  return;
};

module.exports = { generateRandomString, matchPassword, urlsForUser, getUserByEmail };