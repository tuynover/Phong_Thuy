/**
 * Escapes special regex characters to prevent ReDoS (Regex Denial of Service) attacks
 * when constructing MongoDB $regex queries.
 * 
 * @param {string} string 
 * @returns {string}
 */
function escapeRegExp(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegExp;
