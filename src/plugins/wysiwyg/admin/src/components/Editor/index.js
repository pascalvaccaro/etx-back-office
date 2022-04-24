import React, { useReducer, useState, useEffect, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Flex } from '@strapi/design-system/Flex';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Loader } from '@strapi/design-system/Loader';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import Landscape from '@strapi/icons/Landscape';
import Write from '@strapi/icons/Write';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import extraPlugins from './plugins';
import MediaLib from './MediaLib';
import getTrad from '../../utils/getTrad';

const useEditor = () => {
  const [editor, setEditor] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editor) return;
    import(/* webpackChunkName: "etx-studio-ck5-editor" */ 'ckeditor5-custom-build')
      .then((mod) => setEditor(() => mod.default))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [editor, setEditor, setError, setLoading]);

  return { editor, isLoading, error };
};

const Wrapper = styled(Box)`
  .ck-editor__main {
    min-height: ${200 / 16}em;
    > div {
      min-height: ${200 / 16}em;
    }
    // Since Strapi resets css styles, it can be configured here (h2, h3, strong, i, ...)
  }
`;
const UploadButton = styled(Button)`
  border-botton: 0;
  margin-bottom: -2px;
`;

const ReactEditor = ({ onChange, name, value, disabled, hideMediaLib = false }) => {
  const [mediaLibVisible, toggleMediaLib] = useReducer((state) => !state, false);
  const { editor, isLoading, error } = useEditor();

  const handleChangeAssets = useCallback(
    (assets) => {
      const newValue = (value ?? '').concat(
        ...assets.map((asset) => {
          if (asset.mime.includes('image')) {
            return `<p><img src="${asset.url}" alt="${asset.alt}"></img></p>`;
          }
          // else if (asset.mime.includes('audio')) {
          // } else if (asset.mime.includes('video')) {
          // }
          return '';
        })
      );

      onChange({ target: { name, value: newValue } });
      toggleMediaLib();
    },
    [onChange, toggleMediaLib]
  );

  if (isLoading)
    return (
      <Flex justifyContent="center">
        <Box>
          <Loader>...</Loader>
        </Box>
      </Flex>
    );

  return (
    <Wrapper>
      {!hideMediaLib && (
        <UploadButton startIcon={<Landscape />} variant="secondary" fullWidth onClick={toggleMediaLib}>
          <FormattedMessage id={getTrad('toolbar.label')} />
        </UploadButton>
      )}
      {error ? (
        <Box padding={8} background="neutral100">
          <EmptyStateLayout
            icon={<Write />}
            content={<FormattedMessage id="editor.missing" defaultMessage="Impossible de charger l'éditeur riche" />}
          />
        </Box>
      ) : editor ? (
        <CKEditor
          editor={editor}
          disabled={disabled}
          config={{
            extraPlugins,
          }}
          data={value || ''}
          onReady={(editor) => editor.setData(value || '')}
          onChange={(_, editor) => {
            const value = editor.getData();
            onChange({ target: { name, value } });
          }}
        />
      ) : null}
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
