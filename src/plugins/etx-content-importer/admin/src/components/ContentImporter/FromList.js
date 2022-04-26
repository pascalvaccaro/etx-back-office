import React, { useEffect, useCallback } from 'react';
import { FormattedDate, useIntl } from 'react-intl';
import {
  LoadingIndicatorPage,
  AnErrorOccurred,
  SearchURLQuery,
  useSelectionState,
  useQueryParams,
} from '@strapi/helper-plugin';
import { Table, Thead, Tbody, Tr, Td, Th, TFooter } from '@strapi/design-system/Table';
import { ActionLayout, ContentLayout } from '@strapi/design-system/Layout';
import { IconButton } from '@strapi/design-system/IconButton';
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Typography } from '@strapi/design-system/Typography';
import Write from '@strapi/icons/Write';
import Download from '@strapi/icons/Download';

import FromModal from './FromModal';
import Filters from '../Filters';
import SortPicker from '../SortPicker';
import getTrad from '../../utils/getTrad';
import { useStore } from '../../store';

const FromList = ({ url }) => {
  const { formatMessage } = useIntl();
  const [selected, { selectOne, selectAll }] = useSelectionState('id', []);
  const [{ query }, setQuery] = useQueryParams();
  const {
    state: { error, loading: isLoading, list, preview },
    dispatch,
  } = useStore();

  const handleChangeSort = useCallback(
    (value) => {
      setQuery({ sort: value });
    },
    [setQuery]
  );

  useEffect(() => {
    dispatch({ type: 'extract.rss', payload: url });
  }, [url]);

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

      {isLoading && !list.length ? (
        <LoadingIndicatorPage />
      ) : error ? (
        <AnErrorOccurred>{error}</AnErrorOccurred>
      ) : (
        <ContentLayout>
          <Table
            colCount={6}
            rowCount={list.length}
            footer={
              <TFooter onClick={() => dispatch({ type: 'list.export', payload: selected })} icon={<Download />}>
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
                  <Typography variant="sigma">Date</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Source</Typography>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {list.map((article) => {
                const isSelected = Boolean(selected.find((s) => s.title === article.title));
                return (
                  <Tr key={article.title}>
                    <Td>
                      <BaseCheckbox
                        value={isSelected}
                        onValueChange={() => selectOne(article)}
                        aria-label={'Select this article'}
                      />
                    </Td>
                    <Td>
                      <Flex>
                        <Typography textColor="neutral800">{article.title}</Typography>
                        <Box paddingLeft={1}>
                          <IconButton
                            icon={<Write />}
                            onClick={() => dispatch({ type: 'preview.set', payload: article })}
                          />
                        </Box>
                      </Flex>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">
                        <FormattedDate value={article.metadata.publicationDate.toDateString()} />
                      </Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">{article.metadata.provider}</Typography>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </ContentLayout>
      )}
      {preview ? (
        <FromModal
          {...preview}
          onSave={(payload) => dispatch({ type: 'preview.export', payload })}
          onClose={() => dispatch({ type: 'preview.unset' })}
        />
      ) : null}
    </>
  );
};

export default React.memo(FromList, (prev, cur) => prev.url !== cur.url);
