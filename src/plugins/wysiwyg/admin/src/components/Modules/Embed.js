import { Quill } from 'react-quill';
import axios from '../../utils/axiosInstance';

const BlockEmbed = Quill.import('blots/block/embed');
export default class OEmbedWrapper extends BlockEmbed {
  static create(value) {
    const { html, width, height = 320 } = value;

    const node = super.create(html);

    node.setAttribute('srcdoc', html);
    node.setAttribute('width', width);
    node.setAttribute('height', height);

    node.setAttribute('frameborder', '0');
    node.setAttribute('allowfullscreen', false);
    node.setAttribute('scrolling', 'no');
    let timeout;
    node.onload = function () {
      // Need to wait for the child iframe to load (as it is not in the node at first)
      timeout = setTimeout(() => {
        const iframe = node.contentWindow.document.querySelector('iframe');
        // There is no other way to set the final height as it is a cross-origin iframe
        const finalHeight = iframe 
          ? Number(iframe.style.height.slice(0, -2)) + 16
          : (node.contentWindow.document.documentElement.scrollHeight || 320);
        node.setAttribute('height', finalHeight);
      }, 1000);
    };
    node.onunload = function () {
      if (timeout) clearTimeout(timeout);
    };
    return node;
  }

  static value(node) {
    return node.getAttribute('srcdoc');
  }
}

//Name for Quill to find this embed under
OEmbedWrapper.blotName = 'oembed-wrapper';

//Tag to create by Quill
OEmbedWrapper.tagName = 'iframe';

export function insertEmbedFromJson(oEmbed, index) {
  switch (oEmbed.type) {
    case 'photo':
      this.quill.insertEmbed(index, 'image', oEmbed.url, 'api');
      return true;
    case 'video':
    case 'rich': {
      const data = getOEmbedData(oEmbed);
      this.quill.insertEmbed(index, OEmbedWrapper.blotName, data, 'api');
      return true;
    }
    default:
      return false;
  }
}

export const fetchEmbed = async (url) => {
  if (!isValidUrl(url)) throw new Error('Invalid url');
  const embed = await axios.get(`/wysiwyg/oembed?url=${url}`).then(res => res.data);
  return embed;
};

const isValidUrl = (potentialUrl) => {
  try {
    new URL(potentialUrl);
    return true;
  } catch (e) {
    return false;
  }
};
const getOEmbedData = (oEmbed) => {
  if (oEmbed.thumbnail_width && oEmbed.thumbnail_height) {
    return { html: oEmbed.html, height: oEmbed.thumbnail_height, width: oEmbed.thumbnail_width };
  }

  return {
    width: oEmbed.width || 500,
    height: oEmbed.height || 500,
    html: oEmbed.html || '',
  };
};

export function oembedPasteHandler(node, delta) {
  if (delta.ops && isValidUrl(node.dataset) && node.data.toLowerCase().indexOf('oembed') > -1) {
    const index = this.quill.getSelection(true).index;

    const formatParam = '&format=json';
    const sizeParam = '&maxwidth=1200&maxheight=800';

    fetch(node.data + formatParam + sizeParam, {
      headers: {
        Accept: 'application/json',
      },
    })
      .then((response) => response.json())
      .then((json) => insertEmbedFromJson(json, index))
      .then((removeOriginal) => {
        if (removeOriginal) this.quill.deleteText(index + 1, node.data.length);
      })
      .catch(() => {
        const targetUrl = new URL(node.data).searchParams.get('url');

        if (targetUrl && isValidUrl(targetUrl)) {
          this.quill.deleteText(index, node.data.length);
          this.quill.insertText(index, targetUrl);
        }
      });
  }

  return delta;
}