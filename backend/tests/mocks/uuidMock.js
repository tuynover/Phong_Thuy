const crypto = require('crypto');

module.exports = {
  v4: () => crypto.randomUUID(),
  v7: () => crypto.randomUUID(),
  validate: (str) => typeof str === 'string' && str.length === 36
};
