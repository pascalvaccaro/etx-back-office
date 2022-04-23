module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: 'ckeditor.index',
    config: {
      auth: false,
      description: 'Display the Editor Builder',
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/update',
    handler: 'ckeditor.update',
    config: {
      description: 'Save a new custom build',
      policies: [],
    },
  },
];
