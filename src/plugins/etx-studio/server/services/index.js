'use strict';

const extractor = require('./extractor');
const elastic = require('./elastic');
const dynamo = require('./dynamo');

module.exports = {
  extractor,
  dynamo,
  elastic,
};
