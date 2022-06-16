import React from 'react';
import { Box } from '@strapi/design-system/Box';
import PivotTableUI from 'react-pivottable/PivotTableUI';
import 'react-pivottable/pivottable.css';

const sourceToPlatform = (source) => {
  if (source?.__component === 'providers.wcm') return source.platform;
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
    pillar: r.main_category?.pillar ?? null,
    category: r.main_category?.name ?? null,
    source: sourceToPlatform(r.source?.[0]) ?? 'ETX Studio',
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
        rows={['locale', 'pillar', 'category', 'author']}
        cols={['publishedAt', 'source']}
        {...state}
      />
    </Box>
  );
};

export default Stats;