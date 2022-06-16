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
    method: 'POST',
    path: '/search/:service',
    handler: 'importer.search',
    config: {
      auth: false,
      policies: [],
      description: 'Search for external articles'
    },
  },
  {
    method: 'POST',
    path: '/transfer/:service',
    handler: 'importer.transfer',
    config: {
      policies: [],
      description: 'Transfer external articles to the Back-office database'
    },
  },
  {
    method: 'GET',
    path: '/facets/:service',
    handler: 'importer.facets',
    config: {
      auth: false,
      policies: [],
      description: 'List a facet possible values for a given service'
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
  },
  {
    method: 'GET',
    path: '/preview/:id',
    handler: 'importer.preview',
    config: {
      auth: false,
      policies: [],
      description: 'Generate an HTML document for an article'
    }
  },
  {
    method: 'GET',
    path: '/transition/:service',
    handler: 'importer.transition',
    config: {
      policies: [],
      description: 'Import data & images from the original back-office'
    }
  }
];
