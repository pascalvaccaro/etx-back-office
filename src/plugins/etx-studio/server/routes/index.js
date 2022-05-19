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
    path: '/search',
    handler: 'importer.search',
    config: {
      auth: false,
      policies: [],
      description: 'Search the Elastic Search index'
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
