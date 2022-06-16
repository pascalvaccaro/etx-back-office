'use strict';
const axios = require('axios');

/**
 * samba service.
 */

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

module.exports = ({ strapi }) => {
  const credentials = {};
  const { email, password, domain: SAMBA_DOMAIN } = strapi.plugin('etx-studio').config('samba', {});

  const authenticate = async () => {
    if (!credentials.access_token ||
      !credentials.expires_at ||
      new Date(credentials.expires_at).getTime() < new Date().getTime()
    ) {
      await axios.post(new URL('/api/v1/auth/login', SAMBA_DOMAIN).toString(), { email, password }, { headers: defaultHeaders })
        .then(res => res.data)
        .then(res => Object.assign(credentials, res))
        .catch(() => undefined);
    }
    return { Authorization: `${credentials.token_type || 'Bearer'} ${credentials.access_token || ''}` };
  };

  const querify = (body) => {
    return body;
  };

  return {
    async listFacet(query) {
      const { name, search, lang = 'fr' } = query;
      const endpoint = new URL('/api/v1/content/complete', SAMBA_DOMAIN);
      endpoint.searchParams.append('lang', lang);
      endpoint.searchParams.append('q', search);
      endpoint.searchParams.append('size', 20);
      endpoint.searchParams.append('type', name);

      const response = await axios.get(endpoint.toString(), {
        headers: {
          ...defaultHeaders,
          ...(await authenticate()),
        }
      }).then(res => res.data);
      return response.status === 'ok' ? response.data[name] : [];
    },
    async search(body) {
      const endpoint = new URL('/api/v1/content/search', SAMBA_DOMAIN);
      const query = querify(body);
      endpoint.searchParams = new URLSearchParams(query);

      const response = await axios.get(endpoint.toString(), {
        headers: {
          ...defaultHeaders,
          ...(await authenticate()),
        }
      }).then(res => res.data);

      return (response.status === 'ok') ? response : { data: [], meta: { count: 0 }, status: 'error' };
    },

    toAttachments(news) {
      const allAttachments = news.map(newsItem => newsItem.images.map((image) => ({
        name: image.title,
        caption: `${image.description} :: ${image.credits} :: ${image.special_uses}`,
        alternativeText: '',
        mime: 'image/jpg',
        url: image.source,
        sourceId: newsItem.id,
      }))).flat();

      return article => allAttachments.filter(attachment => attachment.sourceId === article.source[0].externalId);
    },
    async toArticles(news, user) {
      const categoryNames = news.map(newsItem => newsItem.categories);
      const toCategories = await strapi.service('api::category.category').findThenGetByNames(categoryNames);

      return (newsItem) => ({
        title: newsItem.title,
        header: newsItem.header,
        content: newsItem.content,
        externalUrl: newsItem.source,
        signature: newsItem.signature,
        main_category: toCategories([newsItem.mainCategory])[0],
        categories: toCategories(newsItem.categories),
        source: [{
          __component: 'providers.samba',
          externalId: newsItem.id,
          audioUrl: newsItem.object_url,
          terms: newsItem.terms,
        }],
        tags: {
          international_FR: Boolean(+news.tagInternationalFR),
          international_EN: Boolean(+news.tagInternationalEN),
          france_FR: Boolean(+news.tagFrance),
        },
        lists: {
          intents: newsItem.terms.filter(term => term.isIntent).map((intent) => ({ code: intent.type, name: intent.name })),
          themes: newsItem.terms.filter(term => term.isTheme).map((intent) => ({ code: intent.type, name: intent.name })),
        },
        createdBy: user.id,
        updatedBy: user.id,
        updatedAt: new Date(newsItem.update_date),
        publishedAt: new Date(newsItem.publication_date)
      });
    },

    toLocales() {
      return (newsItem) => (newsItem.lang || 'fr').slice(0, 2);
    }
  };
};
