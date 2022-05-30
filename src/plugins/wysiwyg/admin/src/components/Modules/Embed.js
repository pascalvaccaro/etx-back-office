import { Quill } from 'react-quill';
import axios, { isValidUrl } from '../../utils/axiosInstance';

const BlockEmbed = Quill.import('blots/block/embed');
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;

export default class OEmbedWrapper extends BlockEmbed {
  static create(value) {
    const { html, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = value;

    const node = super.create(html);
    const body = new DOMParser().parseFromString(html, 'text/html').body;

    node.setAttribute('srcdoc', body.innerHTML);
    node.setAttribute('frameborder', '0');
    node.setAttribute('allowfullscreen', false);
    node.setAttribute('scrolling', 'no');
    node.setAttribute('width', width);
    node.setAttribute('height', height);

    const resize$ = new MutationObserver((mutations) => mutations
      .filter(mutation => mutation.type === 'childList')
      .map(mutation => [...Array.from(mutation.addedNodes), mutation.previousSibling, mutation.nextSibling].filter(Boolean))
      .forEach(nodes => nodes.forEach(({ scrollHeight = 0, scrollWidth = 0 }) => {
        if (scrollHeight > 0 && scrollHeight !== node.height) node.setAttribute('height', scrollHeight + 16);
        if (scrollWidth > 0 && scrollWidth !== node.width) node.setAttribute('width', scrollWidth + 16);
      }))
    );

    node.addEventListener('load',
      () => {
        const { scrollHeight, scrollWidth } = node.contentWindow.document.body;
        node.setAttribute('width', scrollWidth);
        node.setAttribute('height', scrollHeight);
        resize$.observe(node.contentWindow.document.body, { childList: true });
      },
      { once: true }
    );

    return node;
  }
  length() {
    return 1;
  }

  static value(node) {
    const height = node.getAttribute('height') ?? node.scrollHeight ?? DEFAULT_HEIGHT;
    const width = node.getAttribute('width') ?? node.scrollWidth ?? DEFAULT_WIDTH;
    const html = new DOMParser().parseFromString(node.getAttribute('srcdoc') ?? '', 'text/html').body.innerHTML;
    return { html, width, height };
  }

  value() {
    const value = this.statics.value(this.domNode) ?? '';
    return value;
  }
}

//Name for Quill to find this embed under
OEmbedWrapper.blotName = 'oembed-wrapper';

//Tag to create by Quill
OEmbedWrapper.tagName = 'IFRAME';

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

export function insertEmbedFromJson(oEmbed, index) {
  const data = getOEmbedData(oEmbed);
  switch (oEmbed.type) {
    case 'photo':
      this.quill.insertEmbed(index, 'image', oEmbed.url, 'api');
      return true;
    case 'video':
    case 'rich':
      this.quill.insertEmbed(index, OEmbedWrapper.blotName, data, 'api');
      return true;
    default:
      return false;
  }
}

export const fetchEmbed = (url) => {
  if (!isValidUrl(url)) throw new Error('Invalid url');
  return axios.get(`/wysiwyg/oembed?url=${url}`).then(res => res.data);
};

