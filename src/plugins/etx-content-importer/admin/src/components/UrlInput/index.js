import React from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@strapi/design-system/Box';
import { TextInput } from '@strapi/design-system/TextInput';
import { Tooltip } from '@strapi/design-system/Tooltip';
import Information from '@strapi/icons/Information';

import getTrad from '../../utils/getTrad';

export const isValidUrl = (url) =>
  // eslint-disable-next-line no-useless-escape
  /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm.test(url);

const UrlInput = ({ ...props }) => {
  const { formatMessage } = useIntl();

  return (
    <Box padding={10}>
      <TextInput
        placeholder="https://..."
        name="url"
        error={isValidUrl(props.value) ? null : formatMessage({ id: getTrad('url-input.error') })}
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

export default UrlInput;
