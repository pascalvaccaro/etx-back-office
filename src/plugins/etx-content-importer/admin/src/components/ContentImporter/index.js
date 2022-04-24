import React from 'react';
import { useHistory } from 'react-router-dom';

import FromHTML, { DEFAULT_EMPTY_CONTENT, getArticleFromHTML } from './FromHTML';
import FromRSS from './FromRSS';
import axios from '../../utils/axiosInstance';

const ContentImporter = ({ url, type }) => {
  const history = useHistory();

  const handleSubmit = async (payload) => {
    if (!payload || typeof payload !== 'object') return;
    const articles = Array.isArray(payload) ? payload : [payload];
    const results = await Promise.all(
      articles.map(async (incoming) => {
        const { id, title, content, publicationDate, url: link, provider = 'AFP', medias = [] } = incoming;
        const article = title && content ? incoming : await getArticleFromHTML(link).catch(() => null);
        return axios.post('/content-manager/collection-types/api::article.article?plugins[i18n][locale]=fr', {
          title: title || article?.title,
          header: article?.description || '',
          content: content || article?.content || DEFAULT_EMPTY_CONTENT,
          medias: [],
          metadata: {
            provider,
            externalId: id,
            publicationDate: publicationDate || new Date(article?.published),
            readtime: article?.ttr || 0,
            signature: article?.author || '',
          },
        });
      })
    );
    if (!results || !results.length) return;
    const [first] = results;
    if (first?.id) history.push(`/content-manager/collectionType/api::article.article/${first.id}`);
  };

  let FromComponent;
  switch (type) {
    case 'html':
      FromComponent = FromHTML;
      break;
    case 'rss':
    case 'xml':
      FromComponent = FromRSS;
      break;
    case 'json':
      FromComponent = () => null;
      break;
    default:
      FromComponent = () => null;
  }

  return <FromComponent url={url} onSubmit={handleSubmit} />;
};

export default ContentImporter;
