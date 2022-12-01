const findUserByEmail = function(email, database) {
  for (let user in database) {
    //console.log('user:', [users[user]]);
    if (database[user].email === email) {
      return database[user].id;
    }
  }
  return false;
};

module.exports = { findUserByEmail };