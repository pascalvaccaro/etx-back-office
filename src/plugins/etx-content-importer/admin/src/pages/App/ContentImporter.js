import React, { useState, useEffect } from 'react'; // useState
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import {
  LoadingIndicatorPage,
  useFocusWhenNavigate,
  AnErrorOccurred,
  SearchURLQuery,
  useSelectionState,
  useQueryParams,
} from '@strapi/helper-plugin';
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import { Layout, HeaderLayout, ContentLayout, ActionLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Button } from '@strapi/design-system/Button';
import { IconButton } from '@strapi/design-system/IconButton';
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox';
import { Typography } from '@strapi/design-system/Typography';
import { VisuallyHidden } from '@strapi/design-system/VisuallyHidden';
import Plus from '@strapi/icons/Plus';
import Eye from '@strapi/icons/Eye';

import Filters from '../../components/Filters';
import SortPicker from '../../components/SortPicker';
import getTrad from '../../utils/getTrad';
import axios from '../../utils/axiosInstance';

const xmlToJS = (item, key, value = key, after = e => e) => ({ [key]: after(item.querySelector(value)?.innerHTML || "") });

const useRSSFeed = (url) => {
  const [items, setItems] = useState([]);
  const [isLoading, loading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (items.length > 0) return;
    loading(true);

    const getRss = async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("wrong");
      const xml = await res.text();
      const data = new DOMParser().parseFromString(xml, "text/xml");
      return Array.from(data.querySelectorAll("item")).map(item => ({
        ...xmlToJS(item, "id", "guid"),
        ...xmlToJS(item, "title", "title", t => t.split(" - ")[0]),
        ...xmlToJS(item, "url", "link"),
        ...xmlToJS(item, "provider", "source"),
        ...xmlToJS(item, "publicationDate", "pubDate", t => new Date(t)),
      }));
    };

    getRss().then(result => setItems(result)).catch(err => setError(err.message)).finally(() => loading(false));
    setError(null);
  }, [url]);

  return { data: { results: items, count: items.length }, isLoading, error };
};

export const ContentImporter = () => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const [{ query }, setQuery] = useQueryParams();
  const { data, isLoading, error } = useRSSFeed("http://localhost:8080/https://news.google.com/rss/search?q=source:AFP&um=1&ie=UTF-8&num=100&hl=fr&gl=FR&ceid=FR:fr");

  const handleChangeSort = value => {
    setQuery({ sort: value });
  };
  const [selected, { selectOne, selectAll }] = useSelectionState('guid', []);

  useFocusWhenNavigate();
  const loading = isLoading;
  const articles = data?.results;
  const articleCount = data?.count;
  // const isFiltering = Boolean(query._q || query.filters);

  const postArticle = async ({ id, title, publicationDate, url }) => {
    const { data } = await axios.post("/content-manager/collection-types/api::article.article?plugins[i18n][locale]=fr", {
      title,
      content: "<p>Insérer le contenu de l'article</p>",
      metadata: {
        provider: "AFP",
        externalId: id,
        publicationDate,
      }
    }).catch(console.error);
    if (data?.id) history.push(`/content-manager/collectionType/api::article.article/${data.id}`);
    window.open(url, "_blank", "popup");
  };

  return (
    <Layout>
      <Main aria-busy={false}>
        <HeaderLayout
          title={formatMessage({
            id: getTrad('plugin.name'),
            defaultMessage: 'Content Importer',
          })}
          primaryAction={
            <Button startIcon={<Plus />} onClick={console.log}>
              {formatMessage({
                id: getTrad('header.actions.import'),
                defaultMessage: 'Importer des contenus',
              })}
            </Button>
          }
        />

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

        <ContentLayout>
          {loading && <LoadingIndicatorPage />}
          {error && <AnErrorOccurred>{error}</AnErrorOccurred>}
          {/* {!canRead && <NoPermissions />} */}
          {articles && articles.length > 0 && (
            <Table colCount={6} rowCount={articleCount}>
              <Thead>
                <Tr>
                  <Th>
                    <BaseCheckbox
                      aria-label={formatMessage({
                        id: getTrad('bulk.select.label'),
                        defaultMessage: 'Select all articles',
                      })}
                      indeterminate={
                        articles?.length > 0 &&
                        selected.length > 0 &&
                        selected.length !== articles?.length
                      }
                      value={articles?.length > 0 && selected.length === articles?.length}
                      onChange={() => selectAll(articles)}
                    />
                  </Th>
                  <Th>
                    <Typography variant="sigma">Title</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Date</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Source</Typography>
                  </Th>
                  <Th>
                    <VisuallyHidden>Actions</VisuallyHidden>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {articles.map(article => {
                  const isSelected = Boolean(selected.find(s => s.id === article.id));
                  return (<Tr key={article.id}>
                    <Td>
                      <BaseCheckbox value={isSelected} onValueChange={() => selectOne(article)} aria-label={`Select this article`} />
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">{article.title}</Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">{article.publicationDate.toDateString()}</Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">{article.provider}</Typography>
                    </Td>
                    <Td>
                      <Flex>
                        <IconButton onClick={() => window.open(article.url, "_blank")} label="Visit" noBorder icon={<Eye />} />
                        <Box paddingLeft={1}>
                          <IconButton onClick={() => postArticle(article)} label="Import" noBorder icon={<Plus />} />
                        </Box>
                      </Flex>
                    </Td>
                  </Tr>)
                })}
              </Tbody>
            </Table>
          )}
        </ContentLayout>
      </Main>
    </Layout>
  );
};
