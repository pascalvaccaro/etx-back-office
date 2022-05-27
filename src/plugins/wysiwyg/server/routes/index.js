module.exports = [
  {
    method: 'GET',
    path: '/oembed',
    handler: 'oembed.index',
    config: {
      policies: [],
    },
  },
];
