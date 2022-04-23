module.exports = {
  routes: [
    {
      path: '/articles/:provider',
      method: 'POST',
      handler: 'article.createFromExternalProvider',
      config: {
        auth: false,
        policies: [
          'is-news-provider',
        ],
        description: 'Saves an article from an external source',
        tag: 'Article',
      },
    },
  ],
};
