import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Layout, HeaderLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { IconButton } from '@strapi/design-system/IconButton';
import { Divider } from '@strapi/design-system/Divider';
import Cross from '@strapi/icons/Cross';

import getTrad from '../../utils/getTrad';
import ContentImporter from '../../components/ContentImporter';
import { UrlInput, ContentTypeInput, isValidUrl } from '../../components/UrlInput';

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

        <UrlInput value={url} onChange={(e) => setUrl(e.target.value)} endAction={<IconButton noBorder icon={<Cross />} onClick={() => setUrl('')} />} />

        {isValidUrl(url) && (
          <>
            <ContentTypeInput url={url} type={type} onChange={change => setType(change)} allowedTypes={AVAILABLE_TYPES} />
            <Divider style={{ margin: '2rem 4rem' }} />
            {AVAILABLE_TYPES.includes(type) ? <ContentImporter url={url} type={type} /> : null}
          </>
        )}
      </Main>
    </Layout>
  );
};

export default HomePage;
