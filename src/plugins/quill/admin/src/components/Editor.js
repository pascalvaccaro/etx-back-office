import React from 'react';
import ReactQuill from 'react-quill';
import styled from 'styled-components';
import { Box } from '@strapi/design-system/Box';
import 'react-quill/dist/quill.snow.css';

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
  }
`;

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],                 // header dropdown
    ['bold', 'italic', 'underline'],                  // toggled buttons
    ['blockquote'],                                   // blocks
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],    // lists
    [{ 'indent': '-1' }, { 'indent': '+1' }],         // outdent/indent
    // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],        // header dropdown
    [{ 'align': [] }],                                // text align
    ['clean'],                                        // remove formatting
  ]
};
const Editor = ({ value, onChange, disabled, name }) => {
  const handleChange = React.useCallback((val) => onChange({ target: { name, value: val } }), [name, onChange]);
  return (
    <Wrapper>
      <ReactQuill modules={modules} readOnly={disabled} defaultValue={value} theme="snow" onChange={handleChange} />
    </Wrapper>
  );
};

export default Editor;