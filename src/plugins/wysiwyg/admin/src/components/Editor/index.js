import React, { useReducer } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import Landscape from '@strapi/icons/Landscape';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { Editor as CustomEditor } from 'ckeditor5-custom-build';

import extraPlugins from './Adapter';
import MediaLib from './MediaLib';
import getTrad from '../../utils/getTrad';

const Wrapper = styled(Box)`
  .ck-editor__main {
    min-height: ${200 / 16}em;
    > div {
      min-height: ${200 / 16}em;
    }
    // Since Strapi resets css styles, it can be configured here (h2, h3, strong, i, ...)
  }
`;


const ReactEditor = ({ onChange, name, value, disabled }) => {
  const [mediaLibVisible, toggleMediaLib] = useReducer((state) => !state, false);

  const handleChangeAssets = (assets) => {
    const newValue = (value ?? '').concat(
      ...assets.map((asset) => {
        if (asset.mime.includes('image')) {
          return `<p><img src="${asset.url}" alt="${asset.alt}"></img></p>`;
        } else if (asset.mime.includes('audio')) {
        } else if (asset.mime.includes('video')) {
        }
        return '';
      })
    );

    onChange({ target: { name, value: newValue } });
    toggleMediaLib();
  };

  return (
    <Wrapper>
      <Button startIcon={<Landscape />} variant='secondary' fullWidth onClick={toggleMediaLib}>
        <FormattedMessage id={getTrad('toolbar.label')} />
      </Button>
      <CKEditor
        editor={CustomEditor}
        disabled={disabled}
        config={{
          extraPlugins
        }}
        data={value || ''}
        onReady={(editor) => editor.setData(value || '')}
        onChange={(event, editor) => {
          const value = editor.getData();
          onChange({ target: { name, value } });
        }}
      />
      <MediaLib isOpen={mediaLibVisible} onChange={handleChangeAssets} onToggle={toggleMediaLib} />
    </Wrapper>
  );
};

ReactEditor.defaultProps = {
  value: '',
  disabled: false,
};

ReactEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  disabled: PropTypes.bool,
};

export default ReactEditor;
