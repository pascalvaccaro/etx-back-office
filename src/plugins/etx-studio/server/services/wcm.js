'use strict';

const mysql = require('mysql');
const path = require('path');
const { Writable } = require('stream');

const getDimensions = (image) => {
  if (!image || !image.formats || typeof image.formats !== 'string') return [];

  const formats = image.formats.slice(image.formats.indexOf('{')).split('}').find(s => s.includes('original')) ?? '';
  return ['width', 'height', 'weight'].map((attr, i, attrs) => {
    const args = [attr, attrs[i + 1]].filter(Boolean).map(arg => formats.indexOf(arg));
    const re = attr === 'weight' ? /(\d+) ko/i : /i:(\d+)/i;
    const [, match] = formats.slice(...args).match(re) ?? [];
    return match && !isNaN(match) ? +match : 0;
  });
};

/**
 * wcm service.
 */

module.exports = ({ strapi }) => {
  const uploadService = strapi.plugin('upload').service('upload');
  const { mysqlConnection, enabled = true } = strapi.plugin('etx-studio').config('wcm', {});
  let connection;
  try {
    if (enabled) connection = mysql.createConnection(mysqlConnection);
  } catch (err) {
    connection = null;
  }

  return {
    async buildImageQuery(query, excludeExisting = true) {
      if (!uploadService || typeof uploadService.findMany !== 'function') return [];

      let sql = 'SELECT `id`, `title`, `formats`, `credits`, `keywords`, `original`, `permalinks`, `specialUses`, `createdAt`, `modifiedAt`, `publicationDate` FROM `RELAX_BIZ`.`biz_photo` WHERE `permalinks` IS NOT NULL';
      if (excludeExisting) {
        const existing = await uploadService.findMany({
          filters: {
            provider: 'wcm'
          }
        }).then(entries => entries
          .map(entry => entry.provider_metadata.wcmId)
          .filter(Boolean)
        );
        if (existing.length > 0) sql += ' AND `id` NOT IN (' + existing.join(', ') + ')';
      }
      if (query && typeof query === 'string') sql += query.startsWith(' ') ? query : ' ' + query;

      return sql;
    },
    async buildArticleQuery(query, excludeExisting = true) {
      let sql = 'SELECT * FROM `RELAX_BIZ`.`biz_news` WHERE `workflowState` LIKE \'draft%\'';
      if (excludeExisting) {
        const existing = await strapi.entityService.findMany('api::article.article', {
          populate: 'source'
        }).then(entries => entries
          .filter(entry => entry && entry.source && entry.source.length && entry.source.some(s => s.__component === 'providers.wcm'))
          .map(entry => entry.source.find(s => s.__component === 'providers.wcm')?.externalId)
          .filter(Boolean)
        );
        if (existing.length > 0) sql += ' AND `id` NOT IN (' + existing.map(str => `'${str}'`).join(', ') + ')';
      }
      if (query && typeof query === 'string') sql += query.startsWith(' ') ? query : ' ' + query;

      return sql;
    },
    async search(query, streamOptions) {
      if (!connection) throw new Error('[WCM] No connection');
      return streamOptions
        ? connection.query(query).stream(streamOptions)
        : new Promise((resolve, reject) => connection.query(query, (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }));
    },

    toArticles() {
      return async (news) => {
        const data = {
          locale: 'fr',
          title: news.title,
          header: news.chapo || '',
          content: news.content || '<p></p>',
          source: [{
            __component: 'providers.wcm',
            externalId: news.id.toString(),
            signature: news.signature,
          }],
          externalUrl: news.permalinks,
          lists: {
            international_FR: Boolean(+news.tagInternationalFR),
            international_EN: Boolean(+news.tagInternationalEN),
            france: Boolean(+news.tagFrance),
          },
          createdAt: news.createdAt,
          updatedAt: news.modifiedAt,
        };
        
        const article = await strapi.entityService.create('api::article.article', { data });
        return article;
      };
    },

    toAttachments() {
      if (!uploadService || typeof uploadService.add !== 'function' || typeof uploadService.formatFileInfo !== 'function') return null;

      return async (image) => {
        try {
          const ext = path.extname(image.original);
          const mimeType = ext === '.jpg' ? 'jpeg' : ext.slice(1);
          const url = new URL(
            `/relaxnews/${image.permalinks.startsWith('/') ? image.permalinks.slice(1) : image.permalinks}`.replace('%format%', 'original'),
            'https://s3-eu-west-1.amazonaws.com'
          ).toString();
          const [width, height, size] = getDimensions(image);

          const fileInfo = await uploadService.formatFileInfo(
            {
              filename: image.original,
              type: `image/${mimeType}`,
              size: size * 1000,
            }, {
            alternativeText: image.title,
            caption: [image.title || '', image.credits || '', image.specialUses || ''].join(' :: '),
          });
          const file = await uploadService.add({
            ...fileInfo,
            legend: image.title,
            credits: image.credits,
            specialUses: image.specialUses,
            url,
            provider: 'wcm',
            provider_metadata: {
              wcmId: image.id,
              publicationDate: image.publicationDate,
              keywords: image.keywords
            },
            createdAt: image.createdAt,
            updatedAt: image.modifiedAt,
            width,
            height,
          });
          return file;
        } catch (err) {
          strapi.log.error(err.message);
          return null;
        }
      };
    },

    async transfer(input, model) {
      const results = { attempt: 0, success: 0, model };
      const transferrer = (model === 'image' ? this.toAttachments() : this.toArticles());
      if (input.readable) {
        await new Promise((resolve) => input
          .pipe(new Writable({
            objectMode: true,
            async write(row, _, callback) {
              results.attempt += 1;
              results.success += Boolean(await transferrer(row));
              callback();
            },
          }))
          .on('finish', resolve));
      } else if (Array.isArray(input)) {
        results.attempt = input.length;
        results.success = await Promise.all(input.map(transferrer))
          .then(results => results.filter(Boolean).length);
      } else if (input) {
        results.attempt = 1;
        results.success = Number(await transferrer(input).then(Boolean));
      }

      return results;
    }
  };
};
