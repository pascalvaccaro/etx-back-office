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
    async buildQuery(query, excludeExisting = true) {
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
    async search(query, streamOptions) {
      if (!connection) throw new Error('[WCM] No connection');
      return streamOptions
        ? connection.query(query).stream(streamOptions)
        : new Promise((resolve, reject) => connection.query(query, (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }));
    },

    async transfer(images) {
      if (!uploadService || typeof uploadService.add !== 'function' || typeof uploadService.formatFileInfo !== 'function' || !images) return null;
      
      const toFile = async (image) => {
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

      const results = { attempt: 0, success: 0 };
      if (images.readable) {
        await new Promise((resolve) => images
          .pipe(new Writable({
            objectMode: true,
            async write(row, _, callback) {
              results.attempt += 1;
              results.success += Boolean(await toFile(row));
              callback();
            },
          }))
          .on('finish', resolve));
      } else if (Array.isArray(images)) {
        results.attempt = images.length;
        results.success = await Promise.all(images.map(toFile))
          .then(results => results.filter(Boolean).length);
      } else if (images) {
        results.attempt = 1;
        results.success = Number(await toFile(images).then(Boolean));
      }

      return results;
    }
  };
};
