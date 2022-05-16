import React from 'react';

import { useStore } from '../../store';
import FromItem, {  } from './FromItem';
import FromList from './FromList';

const ContentImporter = ({ url }) => {
  const { state: { list = [], preview }} = useStore();

  if (preview && !list.length) return <FromItem url={preview.metadata.url} />;
  if (list.length > 0) return <FromList url={url} />;
  
  return null;
};

export default React.memo(ContentImporter, (prev, cur) => prev.url === cur.url);
