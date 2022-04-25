import axios from '../utils/axiosInstance';
import { prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';

const xmlToJS = (item, key, value = key, cb = (e) => e) => ({
  [key]: cb(item.querySelector(value)?.innerHTML || ''),
});

export const getArticlesFromRss = async (url) => {
  const res = await fetch(`http://localhost:8080/${url}`);
  const xml = await res.text();
  if (!res.ok) throw new Error(xml);

  const data = new DOMParser().parseFromString(xml, 'text/xml');
  return Array.from(data.querySelectorAll('item')).map((item) => ({
    ...xmlToJS(item, 'title', 'title', (t) => t.split(' - ')[0]),
    ...xmlToJS(item, 'header', 'description'),
    content: '',
    metadata: {
      ...xmlToJS(item, 'provider', 'source'),
      ...xmlToJS(item, 'publicationDate', 'pubDate', (t) => new Date(t)),
      ...xmlToJS(item, 'signature', 'author'),
      ...xmlToJS(item, 'externalId', 'guid'),
      ...xmlToJS(item, 'url', 'link'),
    }
  }));
};


export const getArticleFromHTML = async (url) => {
  if (!url || typeof url !== 'string') throw new Error('wrong URL');

  const res = await axios
    .get(prefixFileUrlWithBackendUrl(`/etx-content-importer/extract?url=${url}`))
    .then((res) => res.data)
    .catch(() => null);

  if (!res || typeof res !== 'object' || !res.title) throw new Error('wrong HTML');

  return {
    title: res.title,
    header: res.description || '',
    content: res.content || '<p></p>',
    // ...(res.image
    //   ? {
    //       medias: [{ file: { path: res.image } }],
    //     }
    //   : null),
    metadata: {
      provider: res.source,
      publicationDate: new Date(res.published),
      readtime: res.ttr || 0,
      signature: res.author || '',
      url,
    },
  };
};