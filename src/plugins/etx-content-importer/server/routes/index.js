module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: 'importer.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/extract',
    handler: 'importer.extract',
    config: {
      auth: false,
      policies: [],
      description: 'Extract article from a web resource'
    }
  }
];
