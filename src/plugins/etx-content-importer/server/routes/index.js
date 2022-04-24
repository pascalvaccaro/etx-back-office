module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: 'myController.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/extract',
    handler: 'myController.extract',
    config: {
      auth: false,
      policies: [],
      description: 'Extract article of a webpage'
    }
  }
];
