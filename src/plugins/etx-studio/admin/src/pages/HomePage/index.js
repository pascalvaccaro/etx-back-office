import React from 'react';
import { useIntl } from 'react-intl';
import { Layout, HeaderLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Box } from '@strapi/design-system/Box';
import { Tabs, Tab, TabGroup, TabPanels, TabPanel } from '@strapi/design-system/Tabs';

import FromJson from '../../components/ContentImporter/FromJson';
import getTrad from '../../utils/getTrad';
import { useStore } from '../../store';
import { AVAILABLE_PROVIDERS } from '../../lib/providers';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { dispatch } = useStore();

  return (
    <Layout>
      <Main>
        <HeaderLayout
          title={formatMessage({
            id: getTrad('plugin.title'),
            defaultMessage: 'Rechercher des contenus à importer',
          })}
        />

        <Box padding={8}>
          <TabGroup
            id="providers"
            label={formatMessage({
              id: getTrad('plugin.description'),
              defaultMessage: 'Explorer les différentes sources d\'information'
            })}
            onTabChange={index => dispatch({ type: 'provider.set', payload: AVAILABLE_PROVIDERS[index] })}
          >
            <Tabs>
              {AVAILABLE_PROVIDERS.map(provider => <Tab key={provider.serviceId}>{provider.name}</Tab>)}
            </Tabs>

            <TabPanels>
              {AVAILABLE_PROVIDERS.map(provider => (
                <TabPanel key={provider.serviceId}>
                  <Box color="neutral800" padding={4} background="neutral0">
                    <FromJson {...provider} />
                  </Box>
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>
        </Box>
      </Main>
    </Layout>
  );
};

export default HomePage;
