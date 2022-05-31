const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const { readFileSync } = require('fs');
const _ = require('lodash');

const toName = (attachment, i = 0) => attachment.url.match(/[^/]+$/)[0] || `${attachment.sourceId}-image${i}.${attachment.mime.split('/')[1]}`;
const toTmpFilePath = name => path.join(os.tmpdir(), name);

/**
 * 
 * @param {File[][]} attachments 
 * @param {Function} findRefId 
 * @yields {{ files: File[], fileInfo: Object, metas: Object }}
 */
async function* transferFiles(attachments, findRefId) {
  for (const fileList of attachments) {
    if (!fileList.length) continue;
    const files = await Promise.all(fileList.map((file, i) =>{
      const name = toName(file, i);
      const filePath = toTmpFilePath(name);
      return axios.get(file.url, { responseType: 'arraybuffer' })
        .then(res => fs.writeFile(filePath, res.data))
        .then(() => ({
            name,
            path: filePath,
            type: file.mime,
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

function compile(data, templ = 'template.html') {
  const html = readFileSync(path.join(__dirname, templ));
  return _.template(html.toString())(data);
}

module.exports = {
  compile,
  transferFiles,
  removeFilesFromTmpFolder,
};
