'use strict';

const afp = require('./afp');
const extractor = require('./extractor');
const elastic = require('./elastic');
const dynamo = require('./dynamo');
const samba = require('./samba');
const wcm = require('./wcm');

module.exports = {
  afp,
  extractor,
  dynamo,
  elastic,
  samba,
  wcm,
};
