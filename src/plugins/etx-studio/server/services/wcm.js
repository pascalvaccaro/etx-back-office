'use strict';

const mysql = require('mysql');
const path = require('path');
const { Writable } = require('stream');
const { unserialize } = require('php-unserialize');
const { parse } = require('node-html-parser');
const { SQL_IMAGES_QUERY, SQL_NEWS_QUERY, siteIdToLocale, sourceIdToPlatform, authorIdToEmail } = require('../utils/queries');

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
  const entries = Object.fromEntries(
    ['fr', 'en'].map(lang => [lang, existing.filter(entry => lang === entry.locale && entry.source.some(s => s.__component === 'providers.wcm'))])
  );
  return (sources, locale) => {
    const ids = sources.filter(Boolean).map(String);
    return locale in entries
      ? entries[locale]
        .filter(entry => ids.includes(
          entry.source?.find(s => s.__component === 'providers.wcm')?.externalId)
        )
        .map(entry => entry.id)
      : null;
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
      sql += ' ORDER BY biz_news.cId ASC, biz_news.id ASC';

      return sql + ';';
    },
    async buildArticleQuery(query, excludeExisting = true) {
      let sql = SQL_NEWS_QUERY;
      sql += `
      WHERE YEAR(biz_news.createdAt) >= 2022 AND MONTH(biz_news.createdAt) >= ${new Date().getMonth() - 1}
      `;
      if (excludeExisting) {
        const existing = await strapi.entityService.findMany('api::article.article', { populate: ['source'] })
          .then(entries => entries
            .map(entry => (entry.source ?? []).find(s => s.__component === 'providers.wcm')?.externalId)
            .filter(Boolean)
          );
        if (existing.length > 0) sql += ' AND biz_news.id NOT IN (' + existing.map(str => `'${str}'`).join(', ') + ')';
      }
      if (query && typeof query === 'string') sql += query.startsWith(' ') ? query : ' ' + query;
      sql += ' ORDER BY biz_news.cId ASC, biz_news.id ASC';

      return sql + ';';
    },

    async search(query, streamOptions) {
      if (!connection) throw new Error('[WCM] No connection');
      return new Promise((resolve, reject) => streamOptions
        ? resolve(connection.query(query).stream(streamOptions).on('error', reject))
        : connection.query(query, (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }));
    },

    async toArticle(row, relations = {}) {
      try {
        const externalId = row.newsId.toString();
        const correlatedId = (row.cId ?? '').toString();
        const locale = siteIdToLocale[row.siteId] ?? 'fr';
        const channels = [row.channel, ...Object.values(unserialize(row.channels) ?? {})].filter(Boolean);
        const lists = Object.values(unserialize(row.lists) ?? {}).filter(Boolean);

        const platform = sourceIdToPlatform[row.sourceId] ?? 'ETX Studio';
        const intents = typeof relations.toIntents === 'function' ? relations.toIntents(lists, locale) : [];
        const themes = typeof relations.toThemes === 'function' ? relations.toThemes(lists, locale) : [];
        const categories = typeof relations.toCategories === 'function' ? relations.toCategories(channels, locale) : [];
        const localizations = typeof relations.toLocalizations === 'function' ? relations.toLocalizations(correlatedId, locale) : [];
        const createdBy = typeof relations.toAuthor === 'function' ? relations.toAuthor(row.authorId) : null;

        const data = {
          title: row.title,
          header: parse(row.header)?.innerText ?? row.header,
          content: row.content ?? '<p></p>',
          main_category: categories[0] ?? null,
          categories,
          signature: row.signature,
          source: [{
            __component: 'providers.wcm',
            externalId,
            channels,
            lists,
            platform,
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
          createdBy,
          createdAt: row.newsCreatedAt,
          updatedAt: row.newsUpdatedAt,
          publishedAt: /published/i.test(row.status) ? row.publishedAt : null,
        };

        return strapi.entityService.create('api::article.article', {
          data,
          populate: ['localizations', 'source', 'tags', 'lists', 'attachments']
        });
      } catch (err) {
        strapi.log.error(err.message);
        process.env.NODE_ENV !== 'production' && strapi.log.error(err.stack);
        return null;
      }
    },
    async toFile(row, relations = {}) {
      if (!uploadService || typeof uploadService.add !== 'function' || typeof uploadService.formatFileInfo !== 'function') return null;

      try {
        const wcmId = (row.photoId ?? '').toString();
        if (!wcmId) return null;
        const original = await uploadService.findMany({ filters: { provider: 'wcm' }, populate: 'related' })
          .then(entries => entries.find(entry => entry.provider_metadata.wcmId === wcmId));
        const metas = typeof relations.toMetas === 'function'
          ? {
            ref: 'api::article.article',
            field: 'attachments',
            ...relations.toMetas(row)
          }
          : undefined;

        if (original && metas) {
          if (!(original.related ?? []).some(rel => rel.__type === metas.ref && rel.id === metas.refId))
            await strapi.entityService.update(metas.ref, metas.refId, {
              data: { attachments: [...(typeof relations.toAttachments === 'function' ? relations.toAttachments() : []), original.id] }
            });
          return original;
        }

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
        }, metas);

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
        strapi.entityService.findMany('api::category.category', { populate: 'source', locale: 'all' }),
        strapi.entityService.findMany('api::intent.intent', { populate: 'source', locale: 'all' }),
        strapi.entityService.findMany('api::theme.theme', { populate: 'source', locale: 'all' }),
      ]).then(results => results.map(getEntriesByWcmId));
      
      const articles = await strapi.entityService.findMany('api::article.article', { populate: ['source', 'attachments'], locale: 'all' });
      const toLocalizations = (correlatedId, locale) => correlatedId
        ? articles.filter(a => a.locale !== locale && a.source?.find(s => s.__component === 'providers.wcm')?.externalId === correlatedId)
        : [];
      const authors = await strapi.entityService.findMany('admin::user', { fields: ['id', 'email'] });
      const toAuthor = (authorId) => authorId 
        ? authors.find(author => authorIdToEmail[authorId] === author.email)?.id
        : null;

      return async (row) => {
        const externalId = row.newsId.toString();
        const locale = siteIdToLocale[row.siteId] ?? 'fr';
        const [existing] = getEntriesByWcmId(articles)([externalId], locale);
        
        const article = existing ? articles.find(a => a.id === existing) : await this.toArticle(row, { toIntents, toThemes, toCategories, toLocalizations, toAuthor });
        if (!existing && article) articles.push(article);

        const toMetas = article?.id ? () => ({ refId: article.id }) : undefined;
        const toAttachments = () => (article?.attachments ?? []).map(attachment => attachment.id);
        await this.toFile(row, { toMetas, toAttachments });

        return existing ? null : article;
      };
    },

    async transfer(input, factory = async () => async () => null) {
      const results = { attempt: 0, success: 0 };
      try {
        const transferrer = (await factory.call(this)).bind(this);
        if (input.readable) {
          await new Promise((resolve, reject) => input
            .pipe(new Writable({
              objectMode: true,
              async write(row, _, callback) {
                results.attempt += 1;
                results.success += Boolean(await transferrer(row));
                callback();
              },
            }))
            .on('error', reject)
            .on('finish', resolve)
          );
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
