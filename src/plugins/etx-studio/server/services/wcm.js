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

const getEntriesByWcmId = (existing) => {
  const entries = existing.filter(entry => entry.source.some(s => s.__component === 'providers.wcm'));
  const getLocalizedEntries = (locale = 'fr') => 
    locale === 'fr' ? entries : entries.reduce((acc, entry) => {
      const localized = entry.localizations.find(loc => loc.locale === locale);
      localized.source = entry.source;
      return [...acc, localized];
    }, []);

  return (sources, locale) => {
    const ids = sources.filter(Boolean).map(String);
    return getLocalizedEntries(locale)
      .filter(entry => ids.includes(
        entry.source.find(s => s.__component === 'providers.wcm')?.externalId)
      )
      .map(entry => entry.id);
  };
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
          filters: { provider: 'wcm' }
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
        const existing = await strapi.entityService.findMany('api::article.article', { populate: ['source'] })
          .then(entries => entries
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

    async toArticle(row, relations = {}) {
      try {
        const externalId = row.newsId.toString();
        const referentId = (row.cId ?? '').toString();
        const channels = [row.channel, ...Object.values(unserialize(row.channels) ?? {})].filter(Boolean);
        const lists = Object.values(unserialize(row.lists) ?? {}).filter(Boolean);
        
        const locale = siteIdToLocale[row.siteId] ?? 'fr';
        const intents = typeof relations.toIntents === 'function' ? relations.toIntents(lists, locale) : [];
        const themes = typeof relations.toThemes === 'function' ? relations.toThemes(lists, locale) : [];
        const categories = typeof relations.toCategories === 'function' ? relations.toCategories(channels, locale) : [];
        const articles = await strapi.entityService.findMany('api::article.article', {
          filters: { locale: 'all' },
          populate: { source: { filters: { externalId: { $in: [externalId, referentId].filter(Boolean) } }}}
        });
        const original = articles.find(a => a.source?.[0]?.externalId === externalId && a.locale === locale);
        if (original) return original;

        const localizations = referentId ? articles.filter(a => a.source?.[0].externalId === referentId && a.locale !== locale) : [];
        const data = {
          title: row.title,
          header: row.header,
          content: row.content ?? '<p></p>',
          categories,
          signature: row.signature,
          source: [{
            __component: 'providers.wcm',
            externalId,
            channels,
            lists
          }],
          tags: {
            international_FR: Boolean(+row.international_FR),
            international_EN: Boolean(+row.international_EN),
            france_FR: Boolean(+row.france),
          },
          lists: {
            intents,
            themes
          },
          locale,
          localizations, 
          createdAt: row.newsCreatedAt,
          updatedAt: row.newsUpdatedAt,
          publishedAt: row.publishedAt,
        };

        return strapi.entityService.create('api::article.article', {
            data,
            populate: ['localizations', 'source', 'tags', 'lists']
        });
      } catch (err) {
        strapi.log.error(err.message);
        return null;
      }
    },
    async toFile(row, relations = {}) {
      if (!uploadService || typeof uploadService.add !== 'function' || typeof uploadService.formatFileInfo !== 'function') return null;

      try {
        const wcmId = (row.photoId ?? '').toString();
        const original = await uploadService.findMany({
          filters: { provider: 'wcm' }
        }).then(entries => entries
          .find(entry => entry.provider_metadata.wcmId === wcmId)
        );
        if (!wcmId || original) return original;

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
        }, typeof relations.toMetas === 'function'
          ? {
            ref: 'api::article.article',
            field: 'attachments',
            ...relations.toMetas(row)
          }
          : undefined
        );

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
        return null;
      }
    },

    async toArticles() {
      const [toCategories, toIntents, toThemes] = await Promise.all([
        strapi.entityService.findMany('api::category.category', { populate: ['source', 'localizations'] }),
        strapi.entityService.findMany('api::intent.intent', { populate: ['source', 'localizations'] }),
        strapi.entityService.findMany('api::theme.theme', { populate: ['source', 'localizations'] }),
      ]).then(results => results.map(getEntriesByWcmId));

      return async (row) => {
        const article = await this.toArticle(row, { toIntents, toThemes, toCategories });
        const toMetas = article?.id ? () => ({ refId: article.id }) : undefined;
        await this.toFile(row, { toMetas });
        return article;
      };
    },

    async transfer(input, factory = async () => async () => null) {
      const results = { attempt: 0, success: 0 };
      try {
        const transferrer = (await factory.call(this)).bind(this);
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
      } catch (err) {
        strapi.log.error(err.message);
      }

      return results;
    }
  };
};
