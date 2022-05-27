import React from 'react';
import ReactQuill, { Quill } from 'react-quill';
import Delta from 'quill-delta';
import styled from 'styled-components';
import { Box } from '@strapi/design-system/Box';
import 'react-quill/dist/quill.snow.css';

import OEmbedWrapper, { insertEmbedFromJson, fetchEmbed } from './Modules/Embed';

Quill.register(OEmbedWrapper, false);

const Wrapper = styled(Box)`
  .ql-editor {
    // Since Strapi resets css styles, it can be configured here (h2, h3, strong, i, ...)
    min-height: ${200 / 16}em;
    line-height: 18px;
    p {
      margin-bottom: 8px;
    }
    strong {
      font-weight: bold;
    }
    i, em {
      font-style: italic;
    }
    h1 {
      margin-bottom: 24px;
      font-size: 36px;
    }
    h2 {
      margin-bottom: 18px;
      font-size: 24px;
    }
    h3 {
      margin-bottom: 14px;
      font-size: 18px;
    }
    h4 {
      margin-bottom: 10px;
      font-size: 14px;
    }
    .ql-video {
      min-height: 240px;
      min-width: calc(240px * 16 / 9);
    }
  }
`;

const modules = {
  clipboard: {
    matchers: [
      [1, function (_, delta) {
        return new Delta(delta.filter(op => !op.insert.image));
      }]
    ]
  },
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, false] }],                 // header dropdown
      ['bold', 'italic', 'underline'],                  // toggled buttons
      ['blockquote'],                                   // blocks
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],    // lists
      [{ 'indent': '-1' }, { 'indent': '+1' }],         // outdent/indent
      // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],        // header dropdown
      ['link', 'image', 'video'],
      [{ 'align': [] }],                                // text align
      ['clean'],                                        // remove formatting
    ],
    handlers: {
      image: function (value) {
        if (!value) return;
        const { index = 0 } = this.quill.getSelection(true) || {};
        const { left, top } = this.quill.getBounds(index);

        const tooltip = this.quill.container.querySelector('.ql-tooltip');
        if (!tooltip) return;

        tooltip.dataset.mode = 'link';
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.classList.remove('ql-hidden');
        tooltip.classList.add('ql-editing');

        const action = tooltip.querySelector('.ql-action');
        const input = tooltip.querySelector('input');
        if (!action || !input) return;

        let url = ''; // https://twitter.com/ETX_Studio/status/1516059977844154376
        input.placeholder = 'Embed URL';
        input.style.borderColor = '#ccc';
        input.focus();
        input.oninput = (e) => (url = e.target.value);

        const handler = async (e) => {
          if (e.type === 'keydown' && e.key !== 'Enter') return;
          try {
            const embed = await fetchEmbed(url);
            insertEmbedFromJson.call({ quill: this.quill }, embed, index);
            this.quill.setSelection(index + 1);
          } catch (err) {
            alert(err.message);
          } finally {
            window.scrollBy(0, top);
            input.removeEventListener('keydown', handler);
            action.removeEventListener('click', handler);
          }
        };
        input.addEventListener('keydown', handler);
        action.addEventListener('click', handler, { once: true });
      }
    }
  }
};
const Editor = ({ value, onChange, disabled, name, scrollingContainer = document.body }) => {
  const handleChange = React.useCallback((val) => onChange({ target: { name, value: val } }), [name, onChange]);
  return (
    <Wrapper>
      <ReactQuill id={name} modules={modules} readOnly={disabled} value={value} theme="snow" onChange={handleChange} scrollingContainer={scrollingContainer} />
    </Wrapper>
  );
};

export default Editor;