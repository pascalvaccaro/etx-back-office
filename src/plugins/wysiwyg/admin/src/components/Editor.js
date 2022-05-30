import React from 'react';
import ReactQuill, { Quill } from 'react-quill';
import Delta from 'quill-delta';
import styled from 'styled-components';
import { Box } from '@strapi/design-system/Box';
import 'react-quill/dist/quill.snow.css';

import OEmbedWrapper from './Modules/Embed';
import Toolbar from './Modules/Toolbar';
import Tooltip from './Modules/Tooltip';

Quill.register(OEmbedWrapper, false);

const Wrapper = styled(Box)`
  position: relative;
  .ql-editor {
    // Since Strapi resets css styles, it can be configured here (h2, h3, strong, i, ...)
    min-height: ${200 / 16}em;
    line-height: 18px;
    p {
      margin: 8px 0;
    }
    strong {
      font-weight: bold;
    }
    i, em {
      font-style: italic;
    }
    h1 {
      margin: 24px 0;
      font-size: 36px;
    }
    h2 {
      margin: 18px 0;
      font-size: 24px;
    }
    h3 {
      margin: 14px 0;
      font-size: 18px;
    }
    h4 {
      margin: 10px 0;
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
    container: '#toolbar',
    handlers: {},
  }
};
const Editor = ({ value, onChange, disabled, name, scrollingContainer = document.body }) => {
  const editorRef = React.useRef(null);
  const [show, setShow] = React.useState(false);

  const handleChange = React.useCallback((val) => {
    onChange({ target: { name, value: val } });
  }, [name, onChange]);

  modules.toolbar.handlers.oembed = (value) => setShow(value);
  const close = React.useCallback(() => setShow(false), []);

  return (
    <Wrapper>
      <Toolbar />
      <Tooltip show={show} close={close} ref={editorRef} />
      <ReactQuill ref={el => (editorRef.current = el)} id={name} modules={modules} readOnly={disabled} value={value} theme="snow" onChange={handleChange} scrollingContainer={scrollingContainer} />
    </Wrapper>
  );
};

export default Editor;