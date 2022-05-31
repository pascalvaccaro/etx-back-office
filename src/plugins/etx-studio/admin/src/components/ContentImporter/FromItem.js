import React, { useEffect, useMemo } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { LoadingIndicatorPage, useLibrary } from '@strapi/helper-plugin';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import { ContentLayout } from '@strapi/design-system/Layout';
import { Typography } from '@strapi/design-system/Typography';
import { Flex } from '@strapi/design-system/Flex';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Link } from '@strapi/design-system/Link';
import EmptyDocuments from '@strapi/icons/EmptyDocuments';
import Plus from '@strapi/icons/Plus';

import getTrad from '../../utils/getTrad';
import { useStore } from '../../store';

const FromItem = ({ url, disabled, hideExport = false }) => {
  const { formatMessage } = useIntl();
  const { state, dispatch } = useStore();
  const { components } = useLibrary();
  const Editor = components['richeditor'];

  const { preview: article, loading: isLoading, error } = useMemo(() => state, [state]);
  const externalUrl = useMemo(() => {
    try {
      return new URL(article?.externalUrl);
    } catch (err) {
      return null;
    }
  }, [article]);

  useEffect(() => {
    dispatch({ type: 'extract.html', payload: url });
  }, [url]);

  return isLoading ? (
    <LoadingIndicatorPage />
  ) : (
    <ContentLayout>
      {error ? (
        <EmptyStateLayout content={formatMessage({ id: getTrad('html.no-content') })} icon={<EmptyDocuments />} />
      ) : null}
      {article ? (
        <>
          <Box paddingBottom={4} paddingTop={4} background="neutral100">
            <Box paddingBottom={2} alignItems="center" justifyContent="space-between">
              <Flex paddingBottom={2} alignItems="center" justifyContent="space-between">
                <Box paddingRight={+hideExport} grow="1">
                  <Typography variant="alpha">{article.title}</Typography>
                </Box>
                {!hideExport && (
                  <Button icon={<Plus />} onClick={() => dispatch({ type: 'preview.export', payload: article })}>
                    <FormattedMessage id={getTrad('article.import')} defaultMessage="Importer cet article" />
                  </Button>
                )}
              </Flex>
              <Typography variant="epsilon" textColor="neutral600" ellipsis>
                {article.header}
              </Typography>
              {externalUrl ? <Link href={externalUrl.toString()} isExternal>
                <FormattedMessage
                  id={getTrad('preview.link')}
                  defaultMessage={`Voir l'article original sur ${externalUrl.hostname}`}
                  values={{ host: externalUrl.hostname }}
                />
              </Link> : null}
            </Box>
          </Box>
          <Editor
            value={article?.content}
            disabled={disabled}
            onChange={(e) => dispatch({ type: 'preview.set', payload: { ...article, content: e.target.value } })}
            name="preview"
          />
        </>
      ) : null}
    </ContentLayout>
  );
};

export default React.memo(FromItem, (prev, cur) => prev.url === cur.url);
