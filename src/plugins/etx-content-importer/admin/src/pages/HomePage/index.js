import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Layout, HeaderLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Divider } from '@strapi/design-system/Divider';
import { Button } from '@strapi/design-system/Button';

import getTrad from '../../utils/getTrad';
import ContentImporter from '../../components/ContentImporter';
import UrlInput, { isValidUrl } from '../../components/UrlInput';

const AVAILABLE_TYPES = ['rss', 'html', 'json'];

const HomePage = () => {
  const { formatMessage } = useIntl();
  const [url, setUrl] = useState('');
  const [type, setType] = useState('');

  return (
    <Layout>
      <Main>
        <HeaderLayout
          title={formatMessage({
            id: getTrad('plugin.name'),
            defaultMessage: 'Content Importer',
          })}
        />

        <UrlInput value={url} onChange={(e) => setUrl(e.target.value)} />

        {isValidUrl(url) && (
          <>
            <Box paddingLeft={10} paddingRight={10}>
              <Flex justifyContent="space-around">
                {AVAILABLE_TYPES.map((contentType) => (
                  <Button
                    size="L"
                    key={contentType}
                    variant={contentType === type ? 'default' : 'secondary'}
                    onClick={() => setType(contentType)}
                  >
                    {contentType.toUpperCase()}
                  </Button>
                ))}
              </Flex>
            </Box>
            <Divider style={{ margin: '2rem 4rem' }} />
            {AVAILABLE_TYPES.includes(type) ? <ContentImporter url={url} type={type} /> : null}
          </>
        )}
      </Main>
    </Layout>
  );
};

export default HomePage;
