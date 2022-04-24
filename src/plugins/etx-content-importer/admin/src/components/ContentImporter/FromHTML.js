import React, { useEffect, useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { prefixFileUrlWithBackendUrl, LoadingIndicatorPage } from '@strapi/helper-plugin';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import { ContentLayout } from '@strapi/design-system/Layout';
import { Typography } from '@strapi/design-system/Typography';
import { Flex } from '@strapi/design-system/Flex';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import EmptyDocuments from '@strapi/icons/EmptyDocuments';
import Plus from '@strapi/icons/Plus';

import getTrad from '../../utils/getTrad';
import axios from '../../utils/axiosInstance';
import Editor from '../../../../../wysiwyg/admin/src/components/Editor';

export const DEFAULT_EMPTY_CONTENT = "<p>Insérer le contenu de l'article</p>";

export const getArticleFromHTML = async (url) => {
  if (!url || typeof url !== 'string') throw new Error('wrong URL');

  const res = await axios
    .get(prefixFileUrlWithBackendUrl(`/etx-content-importer/extract?url=${url}`))
    .then((res) => res.data)
    .catch(() => null);

  if (!res || typeof res !== 'object' || !res.title) throw new Error('wrong HTML');

  return {
    title: res.title,
    header: res.description || '',
    content: res.content || DEFAULT_EMPTY_CONTENT,
    ...(res.image ? {
      medias: [{ file: { path: res.image }}]
    } : null),
    metadata: {
      provider: res.source,
      publicationDate: new Date(res.published),
      readtime: res.ttr || 0,
      signature: res.author || '',
    },
  };
};

const useHTMLExtractor = (url, initState) => {
  const [article, setArticle] = useState(initState);
  const [isLoading, loading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loading(true);
    getArticleFromHTML(url)
      .then((result) => setArticle(result))
      .catch((err) => setError(err.message))
      .finally(() => loading(false));
    setError(null);
  }, [url]);

  return { data: article, isLoading, error };
};

const FromHTML = ({ url, article, onLoad, onSubmit }) => {
  const { formatMessage } = useIntl();
  const { data, isLoading, error } = useHTMLExtractor(url, article);

  useEffect(() => {
    if (data && typeof onLoad === 'function') onLoad(data);
  }, [data, onLoad]);

  return isLoading ? (
    <LoadingIndicatorPage />
  ) : (
    <ContentLayout>
      {error ? (
        <EmptyStateLayout content={formatMessage({ id: getTrad('html.no-content') })} icon={<EmptyDocuments />} />
      ) : null}
      {data ? (
        <>
          <Box paddingBottom={4} paddingTop={4} background="neutral100">
            <Box paddingBottom={2} alignItems="center" justifyContent="space-between">
              <Flex paddingBottom={2} alignItems="center" justifyContent="space-between">
                <Typography variant="alpha">{data.title}</Typography>
                <Button icon={<Plus />} onClick={() => onSubmit(data)}>
                  <FormattedMessage id={getTrad('article.import')} defaultMessage="Importer cet article" />
                </Button>
              </Flex>
              <Typography variant="epsilon" textColor="neutral600" ellipsis>
                {data.header}
              </Typography>
            </Box>
          </Box>
          <Editor value={data.content} disabled onChange={() => undefined} name="preview" hideMediaLib />
        </>
      ) : null}
    </ContentLayout>
  );
};

export default React.memo(FromHTML, (prev, cur) => prev.url === cur.url);
