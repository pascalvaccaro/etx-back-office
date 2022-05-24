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
    path: '/search/:service',
    handler: 'importer.search',
    config: {
      auth: false,
      policies: [],
      description: 'Search for external articles'
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
