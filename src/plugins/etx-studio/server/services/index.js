'use strict';

const afp = require('./afp');
const extractor = require('./extractor');
const elastic = require('./elastic');
const dynamo = require('./dynamo');

module.exports = {
  afp,
  extractor,
  dynamo,
  elastic,
};
