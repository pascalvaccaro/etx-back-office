import { Quill } from 'react-quill';
import axios from '../../utils/axiosInstance';
import { decode } from 'html-entities';

const BlockEmbed = Quill.import('blots/block/embed');
const DEFAULT_HEIGHT = 320;
const DEFAULT_WIDTH = 500;

export default class OEmbedWrapper extends BlockEmbed {
  static create(value) {
    const { html, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = value;

    const node = super.create(html);
    const height$ = new MutationObserver((mutations) => mutations
      .filter(mutation => mutation.type === 'childList')
      .map(mutation => [...Array.from(mutation.addedNodes), mutation.previousSibling, mutation.nextSibling].filter(Boolean))
      .forEach(nodes => nodes.forEach(({ scrollHeight = 0, scrollWidth = 0 }) => {
        if (scrollHeight > 0 && scrollHeight !== node.height) node.setAttribute('height', scrollHeight + 16);
        if (scrollWidth > 0 && scrollWidth !== node.width) node.setAttribute('width', scrollWidth);
      }))
    );

    node.addEventListener('load',
      () => {
        const { scrollHeight, scrollWidth } = node.contentWindow.document.body;
        node.setAttribute('width', Math.max(scrollWidth, width));
        node.setAttribute('height', Math.min(scrollHeight, height));
        height$.observe(node.contentWindow.document.body, { childList: true });
      },
      { once: true }
    );

    node.setAttribute('srcdoc', html);
    node.setAttribute('frameborder', '0');
    node.setAttribute('allowfullscreen', false);
    node.setAttribute('scrolling', 'no');

    return node;
  }

  static value(node) {
    const height = node.getAttribute('height') ?? node.scrollHeight ?? DEFAULT_HEIGHT;
    const width = node.getAttribute('width') ?? node.scrollWidth ?? DEFAULT_WIDTH;
    const html = decode(node.getAttribute('srcdoc')) || '';
    return { html, width, height };
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

export const fetchEmbed = (url) => {
  if (!isValidUrl(url)) throw new Error('Invalid url');
  return axios.get(`/wysiwyg/oembed?url=${url}`).then(res => res.data);
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
    width: oEmbed.width ?? DEFAULT_WIDTH,
    height: oEmbed.height ?? DEFAULT_HEIGHT,
    html: oEmbed.html ?? '',
  };
};
