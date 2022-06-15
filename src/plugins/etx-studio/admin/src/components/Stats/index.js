import React from 'react';
import { Box } from '@strapi/design-system/Box';
import PivotTableUI from 'react-pivottable/PivotTableUI';
import 'react-pivottable/pivottable.css';

const providerToSource = {
  'providers.wcm': 'ETX Studio',
  'providers.afp': 'AFP',
  'providers.samba': 'ETX Studio'
};

const toDay = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDay()).padStart(2, '0')}`;
  } catch (err) {
    return null;
  }
};
const toList = (list) => (list ?? []).map(item => item.name).filter(Boolean).join(', ');

const Stats = ({ results = [], refetch = () => undefined, ...props }) => {
  const [state, setState] = React.useState(props);
  const data = React.useMemo(() => results.map((r) => ({
    locale: (r.locale ?? 'fr').toUpperCase(),
    parent: r.main_category?.parent?.name ?? null,
    category: r.main_category?.name ?? null,
    source: providerToSource[r.source?.[0]?.__component] ?? null,
    intents: toList(r.lists?.intents),
    themes: toList(r.lists?.themes),
    author: r.createdBy ? r.createdBy.firstname + ' ' + r.createdBy.lastname : r.signature,
    publishedAt: toDay(r.publishedAt),
  })), [results]);
  const isEmpty = React.useMemo(() => data.length === 0, [data]);

  React.useEffect(() => {
    if (isEmpty) refetch();
  }, [isEmpty]);

  return (
    <Box>
      <PivotTableUI
        data={data}
        onChange={s => setState(s)}
        rows={['locale', 'parent', 'category', 'author']}
        cols={['publishedAt', 'source']}
        {...state}
      />
    </Box>
  );
};

export default Stats;