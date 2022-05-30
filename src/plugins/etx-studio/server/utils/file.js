const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const { readFileSync } = require('fs');
const _ = require('lodash');

const toName = (attachment, i = 0) => attachment.url.match(/[^/]+$/)[0] || `${attachment.sourceId}-image${i}.${attachment.mime.split('/')[1]}`;
const toTmpFilePath = name => path.join(os.tmpdir(), name);

async function* transferFiles(files, findRefId) {
  for (const attachments of files) {
    if (!attachments.length) continue;
    const files = await Promise.all(attachments.map((attachment, i) =>{
      const name = toName(attachment, i);
      const filePath = toTmpFilePath(name);
      return axios.get(attachment.url, { responseType: 'arraybuffer' })
        .then(res => fs.writeFile(filePath, res.data))
        .then(() => ({
            name,
            path: filePath,
            type: attachment.mime,
          }));
    }));
    const { fileInfo, refId } = attachments.reduce((acc, { sourceId, ...attachment }) => ({
      refId: acc.refId || findRefId(sourceId),
      fileInfo: acc.fileInfo.concat(attachment),
    }), { fileInfo: [] });
    const metas = { ref: 'api::article.article', refId, field: 'attachments' };

    yield { files, fileInfo, metas };
  }
}

async function removeFilesFromTmpFolder(files) {
  if (!Array.isArray(files)) files = [files];
  await Promise.all(files.map((file, i) => {
    const name = toName(file, i);
    const filePath = toTmpFilePath(name);
    return fs.unlink(filePath).catch(() => undefined);
  }));
}

function compile(data) {
  const html = readFileSync(path.join(__dirname, 'template.html'));
  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
  return _.template(html.toString())(data);
}

module.exports = {
  compile,
  transferFiles,
  removeFilesFromTmpFolder,
};
