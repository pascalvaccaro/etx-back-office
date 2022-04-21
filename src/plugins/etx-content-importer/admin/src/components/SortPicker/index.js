import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { SimpleMenu, MenuItem } from '@strapi/design-system/SimpleMenu';
import getTrad from '../../utils/getTrad';

const SortPicker = ({ onChangeSort }) => {
  const { formatMessage } = useIntl();

  const filters = [
    { key: 'sort.published_at_desc', value: `publishedAt:DESC` },
    { key: 'sort.published_at_asc', value: `publishedAt:ASC` },
    { key: 'sort.title_asc', value: 'title:ASC' },
    { key: 'sort.title_desc', value: 'title:DESC' },
    { key: 'sort.provider_desc', value: `provider:DESC` },
    { key: 'sort.provider_asc', value: `provider:ASC` },
  ];

  return (
    <SimpleMenu
      variant="tertiary"
      label={formatMessage({
        id: getTrad('sort.label'),
        defaultMessage: 'Trier par',
      })}
    >
      {filters.map(filter => (
        <MenuItem key={filter.key} onClick={() => onChangeSort(filter.value)}>
          {formatMessage({ id: getTrad(filter.key) })}
        </MenuItem>
      ))}
    </SimpleMenu>
  );
};

SortPicker.propTypes = {
  onChangeSort: PropTypes.func.isRequired,
};

export default SortPicker;
