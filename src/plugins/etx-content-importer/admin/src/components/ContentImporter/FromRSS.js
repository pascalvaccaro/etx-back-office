import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FormattedDate, useIntl } from 'react-intl';
import {
  LoadingIndicatorPage,
  useFocusWhenNavigate,
  AnErrorOccurred,
  SearchURLQuery,
  useSelectionState,
  useQueryParams,
} from '@strapi/helper-plugin';
import { Table, Thead, Tbody, Tr, Td, Th, TFooter } from '@strapi/design-system/Table';
import { GridLayout, ActionLayout, ContentLayout } from '@strapi/design-system/Layout';
import { Flex } from '@strapi/design-system/Flex';
import { Box } from '@strapi/design-system/Box';
import { IconButton } from '@strapi/design-system/IconButton';
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox';
import { Tooltip } from '@strapi/design-system/Tooltip';
import { Typography } from '@strapi/design-system/Typography';
import { VisuallyHidden } from '@strapi/design-system/VisuallyHidden';
import Eye from '@strapi/icons/Eye';
import ExternalLink from '@strapi/icons/ExternalLink';
import Download from '@strapi/icons/Download';

import Filters from '../Filters';
import SortPicker from '../SortPicker';
import getTrad from '../../utils/getTrad';
import HTMLPreview from './FromHTML';

const xmlToJS = (item, key, value = key, cb = (e) => e) => ({
  [key]: cb(item.querySelector(value)?.innerHTML || ''),
});
const getArticlesFromRss = async (url) => {
  const res = await fetch(`http://localhost:8080/${url}`);
  if (!res.ok) throw new Error('wrong URL');
  const xml = await res.text();
  const data = new DOMParser().parseFromString(xml, 'text/xml');
  return Array.from(data.querySelectorAll('item')).map((item) => ({
    ...xmlToJS(item, 'id', 'guid'),
    ...xmlToJS(item, 'title', 'title', (t) => t.split(' - ')[0]),
    ...xmlToJS(item, 'url', 'link'),
    ...xmlToJS(item, 'provider', 'source'),
    ...xmlToJS(item, 'publicationDate', 'pubDate', (t) => new Date(t)),
  }));
};

const useRSSFeed = (url) => {
  const [items, setItems] = useState([]);
  const [isLoading, loading] = useState(false);
  const [error, setError] = useState(null);
  const count = useMemo(() => items.length, [items]);

  useEffect(() => {
    if (items.length > 0) return;
    loading(true);

    getArticlesFromRss(url)
      .then((result) => setItems(result))
      .catch((err) => setError(err.message))
      .finally(() => loading(false));
    setError(null);
  }, [url]);

  return { data: { items, count }, isLoading, error, setItems };
};

const Articles = ({ list = [], onClickPreview, onSubmit }) => {
  const { formatMessage } = useIntl();
  const [selected, { selectOne, selectAll }] = useSelectionState('id', []);

  return (
    <Table
      colCount={6}
      rowCount={list.length}
      footer={
        <TFooter onClick={() => onSubmit(selected)} icon={<Download />}>
          {formatMessage({ id: getTrad('list.import'), defaultMessage: 'Importer les articles sélectionnés' })}
        </TFooter>
      }
    >
      <Thead>
        <Tr>
          <Th>
            <BaseCheckbox
              aria-label={formatMessage({
                id: getTrad('bulk.select.label'),
                defaultMessage: 'Select all articles',
              })}
              indeterminate={list.length > 0 && selected.length > 0 && selected.length !== list.length}
              value={list.length > 0 && selected.length === list.length}
              onChange={() => selectAll(list)}
            />
          </Th>
          <Th>
            <Typography variant="sigma">Title</Typography>
          </Th>
          <Th>
            <VisuallyHidden>Actions</VisuallyHidden>
          </Th>
          <Th>
            <Typography variant="sigma">Date</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">Source</Typography>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {list.map((article) => {
          const isSelected = Boolean(selected.find((s) => s.id === article.id));
          return (
            <Tr key={article.id}>
              <Td>
                <BaseCheckbox
                  value={isSelected}
                  onValueChange={() => selectOne(article)}
                  aria-label={'Select this article'}
                />
              </Td>
              <Td>
                <Tooltip description={article.title}>
                  <Typography textColor="neutral800">{article.title.slice(0, 50)}...</Typography>
                </Tooltip>
              </Td>
              <Td>
                <Flex>
                  <IconButton onClick={() => onClickPreview(article.url)} label="Preview" noBorder icon={<Eye />} />
                  <IconButton
                    onClick={() => window.open(article.url, '_blank')}
                    label="Visit"
                    noBorder
                    icon={<ExternalLink />}
                  />
                </Flex>
              </Td>
              <Td>
                <Typography textColor="neutral800">
                  <FormattedDate value={article.publicationDate.toDateString()} />
                </Typography>
              </Td>
              <Td>
                <Typography textColor="neutral800">{article.provider}</Typography>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

const FromRSS = ({ url, onSubmit }) => {
  const { formatMessage } = useIntl();
  const [{ query }, setQuery] = useQueryParams();
  const { data, isLoading, error, setItems } = useRSSFeed(
    url
    // 'https://news.google.com/rss/search?q=source:AFP&um=1&ie=UTF-8&num=100&hl=fr&gl=FR&ceid=FR:fr'
  );

  const articles = useMemo(() => data?.items || [], [data]);
  const handleChangeSort = (value) => {
    setQuery({ sort: value });
  };
  const [previewUrl, setPreviewUrl] = useState('');

  useFocusWhenNavigate();
  const onDonePreviewing = useCallback(
    (article) => {
      setItems((items) =>
        items.map((item) =>
          item.title === article.title
            ? {
                ...item,
                ...article,
              }
            : item
        )
      );
    },
    [setItems]
  );

  return (
    <>
      <ActionLayout
        startActions={
          <>
            <SortPicker onChangeSort={handleChangeSort} />
            <Filters />
          </>
        }
        endActions={
          <SearchURLQuery
            label={formatMessage({
              id: getTrad('search.label'),
              defaultMessage: 'Rechercher un article',
            })}
          />
        }
      />

      {isLoading ? (
        <LoadingIndicatorPage />
      ) : error ? (
        <AnErrorOccurred>{error}</AnErrorOccurred>
      ) : (
        <ContentLayout>
          <GridLayout>
            <Articles list={articles} onClickPreview={(url) => setPreviewUrl(url)} onSubmit={onSubmit} />
            <Box>
              <HTMLPreview url={previewUrl} onLoad={onDonePreviewing} />
            </Box>
          </GridLayout>
        </ContentLayout>
      )}
    </>
  );
};

export default React.memo(FromRSS, (prev, cur) => prev.url !== cur.url);
