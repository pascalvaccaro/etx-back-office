import React from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Button } from '@strapi/design-system/Button';
import { TextInput } from '@strapi/design-system/TextInput';
import { Tooltip } from '@strapi/design-system/Tooltip';
import Information from '@strapi/icons/Information';

import getTrad from '../../utils/getTrad';

export const isValidUrl = (url) =>
  // eslint-disable-next-line no-useless-escape
  /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm.test(url);

export const UrlInput = ({ ...props }) => {
  const { formatMessage } = useIntl();

  return (
    <Box background="neutral0" padding={10}>
      <TextInput
        placeholder="https://..."
        name="url"
        error={!props.value || isValidUrl(props.value) ? null : formatMessage({ id: getTrad('url-input.error') })}
        hint={formatMessage({ id: getTrad('url-input.hint') })}
        label={formatMessage({ id: getTrad('url-input.label') })}
        labelAction={
          <Tooltip description={formatMessage({ id: getTrad('url-input.tooltip') })}>
            <button
              aria-label="Information about the url"
              style={{
                border: 'none',
                padding: 0,
                background: 'transparent',
              }}
            >
              <Information aria-hidden={true} />
            </button>
          </Tooltip>
        }
        {...props}
      />
    </Box>
  );
};

export const ContentTypeInput = ({ url, type, onChange, allowedTypes = [] }) => {
  React.useEffect(() => {
    if (!type && url) fetch(url).then(async res => {
      if (!res.ok) throw new Error(await res.text());
      const ct = res.headers.get('Content-Type');
      if (ct.includes('html')) onChange('html');
      if (ct.includes('xml') || type.includes('rss')) onChange('rss');
      if (ct.includes('json')) onChange('json');
    }).catch(console.error);
  }, [type, url, onChange]);

  return (
    <Box background="neutral0" paddingLeft={10} paddingRight={10}>
      <Flex justifyContent="space-around">
        {allowedTypes.map((contentType) => (
          <Button
            size="L"
            key={contentType}
            variant={contentType === type ? 'default' : 'secondary'}
            onClick={() => onChange(contentType)}
          >
            {contentType.toUpperCase()}
          </Button>
        ))}
      </Flex>
    </Box>
  );
};
