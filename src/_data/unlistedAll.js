const unlisted = require("./unlisted.json");
const counterfeit = require("./counterfeit.json");
const oddities = require("./oddities.json");

module.exports = [
  ...unlisted,
  ...oddities,
  ...counterfeit
];
