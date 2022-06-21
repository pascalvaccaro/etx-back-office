'use strict';

const path = require('path');
const AWS = require('aws-sdk');

module.exports = {
  init(config) {
    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      ...config,
    });

    const upload = (file, customParams = {}) =>
      new Promise((resolve, reject) => {
        const createdAt = new Date();
        const filePath = path.join(
          'relaxnews',
          'illustration',
          'photo',
          String(createdAt.getFullYear()),
          String(createdAt.getMonth() + 1).padStart(2, '0'),
          String(createdAt.getDate()).padStart(2, '0')
        );
        
        S3.upload(
          {
            Key: `${filePath}/${file.hash}${file.ext}`,
            Body: file.stream || Buffer.from(file.buffer, 'binary'),
            ACL: 'public-read',
            ContentType: file.mime,
            ...customParams,
          },
          (err, data) => {
            if (err) {
              return reject(err);
            }

            // set the bucket file url
            file.url = data.Location;

            resolve();
          }
        );
      });

    return {
      uploadStream(file, customParams = {}) {
        return upload(file, customParams);
      },
      upload(file, customParams = {}) {
        return upload(file, customParams);
      },
      delete(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const url = new URL(file.url);
          const filePath = path.dirname(url.pathname).slice(1);
          S3.deleteObject(
            {
              Key: `${filePath}/${file.hash}${file.ext}`,
              ...customParams,
            },
            (err) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};