const unlisted = require("./unofficial/unlisted.json");
const counterfeit = require("./unofficial/counterfeit.json");
const oddities = require("./unofficial/oddities.json");

module.exports = [
  ...unlisted,
  ...oddities,
  ...counterfeit
];
