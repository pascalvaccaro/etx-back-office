'use strict';

const mysql = require('mysql');
const path = require('path');
const { Writable } = require('stream');
const { SQL_IMAGES_QUERY, SQL_NEWS_QUERY, siteIdToLocale } = require('./queries');
const { unserialize } = require('php-unserialize');

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

      let sql = SQL_IMAGES_QUERY;
      sql += `
      WHERE YEAR(biz_news.publicationDate) >= 2012
        AND  biz_photo.permalinks IS NOT NULL
        AND (biz_photo.title LIKE BINARY 'GENERIC:%' AND YEAR(biz_news.publicationDate) >= 2016)
        AND  biz_photo.credits NOT LIKE '%istock%'
        AND (
            (biz_photo.credits LIKE '%getty%' AND YEAR(biz_news.publicationDate) >= 2018)
          OR (biz_photo.credits LIKE '%shutterstock%' AND YEAR(biz_news.publicationDate) >= 2020)
          OR  biz_photo.credits LIKE '%unsplash%'
        )
      `;
      if (excludeExisting) {
        const existing = await uploadService.findMany({
          filters: {
            provider: 'wcm'
          }
        }).then(entries => entries
          .map(entry => entry.provider_metadata.wcmId)
          .filter(Boolean)
        );
        if (existing.length > 0) sql += ' AND biz_photo.id NOT IN (' + existing.join(', ') + ')';
      }
      if (query && typeof query === 'string') sql += query.startsWith(' ') ? query : ' ' + query;

      return sql + ';';
    },

    async buildArticleQuery(query, excludeExisting = true) {
      let sql = SQL_NEWS_QUERY;
      sql += `
      WHERE biz_news.workflowState NOT LIKE '%published%' 
        AND YEAR(biz_news.createdAt) >= 2022 
        AND MONTH(biz_news.createdAt) >= ${new Date().getMonth() - 1}
      `;
      if (excludeExisting) {
        const existing = await strapi.entityService.findMany('api::article.article', {
          populate: ['source', 'localizations']
        }).then(entries => entries
          .map(entry => entry.source?.[0]?.__component === 'providers.wcm' ? entry.source[0].externalId : null)
          .filter(Boolean)
        );
        if (existing.length > 0) sql += ' AND biz_news.id NOT IN (' + existing.map(str => `'${str}'`).join(', ') + ')';
      }
      if (query && typeof query === 'string') sql += query.startsWith(' ') ? query : ' ' + query;

      return sql + ';';
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

    async toArticle(row) {
      try {
        const externalId = row.newsId.toString();
        const locale = siteIdToLocale[row.siteId] ?? 'fr';
        let article = await strapi.entityService.findMany('api::article.article', {
          filters: { title: row.title },
          populate: 'source'
        })
          .then(results => results.find(r => r.source?.[0]?.externalId === externalId));

        if (!article || !article.id || !article.source.length || !article.source.find(s => s.externalId === externalId))
          article = await strapi.entityService.create('api::article.article', {
            data: {
              title: row.title,
              header: row.header,
              content: row.content ?? '<p></p>',
              createdAt: row.newsCreatedAt,
              updatedAt: row.newsUpdatedAt,
              publishedAt: row.publishedAt,
              locale,
              source: [{
                __component: 'providers.wcm',
                externalId,
                channels: [row.channel, ...Object.values(unserialize(row.channels))],
                lists: Object.values(unserialize(row.lists))
              }],
              signature: row.signature,
              // externalUrl: row.permalinks,
              tags: {
                international_FR: Boolean(+row.international_FR),
                international_EN: Boolean(+row.international_EN),
                france_FR: Boolean(+row.france),
              }
            }
          });

        return article;
      } catch (err) {
        strapi.log.error(err.message);
        return null;
      }
    },

    toArticles() {
      if (!uploadService || typeof uploadService.add !== 'function' || typeof uploadService.formatFileInfo !== 'function') return null;

      return async (row) => {
        const article = await this.toArticle(row);
        try {
          const ext = path.extname(row.name);
          const mimeType = ext === '.jpg' ? 'jpeg' : ext.slice(1);
          const url = new URL(
            `/relaxnews/${row.url.startsWith('/') ? row.url.slice(1) : row.url}`.replace('%format%', 'original'),
            'https://s3-eu-west-1.amazonaws.com'
          ).toString();
          const [width, height, size] = getDimensions(row);

          const fileInfo = uploadService.formatFileInfo({
            filename: row.name,
            type: `image/${mimeType}`,
            size: size * 1000,
          }, {
            alternativeText: row.legend,
            caption: [row.legend || '', row.credits || '', row.specialUses || ''].join(' :: '),
          }, article?.id ? {
            ref: 'api::article.article',
            refId: article.id,
            field: 'attachments'
          } : undefined);
          const file = await uploadService.add({
            ...fileInfo,
            legend: row.legend,
            credits: row.credits,
            specialUses: row.specialUses,
            url,
            provider: 'wcm',
            provider_metadata: {
              wcmId: row.photoId.toString(),
              publicationDate: row.publicationDate,
              keywords: row.keywords
            },
            createdAt: row.createdAt,
            updatedAt: row.modifiedAt,
            width,
            height,
          });
          return file;
        } catch (err) {
          strapi.log.error(err.message);
        }
        return article;
      };
    },

    async transfer(input, factory = () => async () => null) {
      const results = { attempt: 0, success: 0 };
      try {
        if (input.readable) {
          const transferrer = factory();
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
          const transferrer = factory(input);
          results.attempt = input.length;
          results.success = await Promise.all(input.map(transferrer))
            .then(results => results.filter(Boolean).length);
        } else if (input) {
          const transferrer = factory();
          results.attempt = 1;
          results.success = Number(await transferrer(input).then(Boolean));
        }
      } catch (err) {
        strapi.log.error(err.message);
      }

      return results;
    }
  };
};
