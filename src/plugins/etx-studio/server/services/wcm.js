'use strict';

const mysql = require('mysql');
const path = require('path');

/**
 * wcm service.
 */

module.exports = ({ strapi }) => {
  const uploadService = strapi.plugin('upload').service('upload');
  const wcmMySql = strapi.plugin('etx-studio').config('wcm.mysql', {});
  const connection = mysql.createConnection(wcmMySql);

  return {
    async search(query) {
      if (!uploadService || typeof uploadService.findMany !== 'function') return [];
      const existing = await uploadService.findMany({
        filters: {
          provider: 'wcm'
        }
      }).then(entries => entries
        .map(entry => entry.provider_metadata.wcmId)
        .filter(Boolean)
      );

      let sql = 'SELECT `id`, `title`, `formats`, `credits`, `keywords`, `original`, `permalinks`, `specialUses`, `createdAt`, `modifiedAt`, `publicationDate` FROM `RELAX_BIZ`.`biz_photo` WHERE `permalinks` IS NOT NULL';
      if (existing.length > 0) sql += ' AND `id` NOT IN (' + existing.join(', ') + ')';
      if (query && typeof query === 'string') sql += query;
      else sql += ' LIMIT 1';

      const { results } = await new Promise((resolve) => connection.query(sql, (error, results) => {
        if (error) strapi.log.error(error);
        resolve({ results });
      }));

      return results ?? [];
    },

    async transfer(images) {
      if (!uploadService || typeof uploadService.add !== 'function' || typeof uploadService.formatFileInfo !== 'function') return [];

      const results = await Promise.all(images
        .filter(result => typeof result.permalinks === 'string' && typeof result.original === 'string')
        .map(async result => {
          try {
            const ext = path.extname(result.original);
            const mimeType = ext === '.jpg' ? 'jpeg' : ext.slice(1);

            const url = new URL(
              `/relaxnews/${result.permalinks.startsWith('/') ? result.permalinks.slice(1) : result.permalinks}`.replace('%format%', 'original'),
              'https://s3-eu-west-1.amazonaws.com'
            ).toString();

            const formats = result.formats.slice(result.formats.indexOf('{')).split('}').find(s => s.includes('original')) ?? '';
            const [width, height, size] = ['width', 'height', 'weight'].map((attr, i, attrs) => {
              const args = [attr, attrs[i + 1]].filter(Boolean).map(arg => formats.indexOf(arg));
              const re = attr === 'weight' ? /(\d+) ko/i : /i:(\d+)/i;
              const [, match] = formats.slice(...args).match(re) ?? [];
              return match && !isNaN(match) ? +match : 0;
            });

            const file = await uploadService.formatFileInfo({
              filename: result.original,
              type: `image/${mimeType}`,
              size: size * 1000,
            }, {
              alternativeText: result.title,
              caption: [result.title, result.credits, result.specialUses].filter(Boolean).join(' :: '),
            });

            return uploadService.add({
              ...file,
              legend: result.title,
              credits: result.credits,
              specialUses: result.specialUses,
              url,
              provider: 'wcm',
              provider_metadata: {
                wcmId: result.id,
                publicationDate: result.publicationDate,
                keywords: result.keywords
              },
              createdAt: result.createdAt,
              updatedAt: result.modifiedAt,
              width,
              height,
            });
          } catch (err) {
            strapi.log.error(err);
            return null;
          }
        })
      );

      return results.filter(Boolean);
    }
  };
};
