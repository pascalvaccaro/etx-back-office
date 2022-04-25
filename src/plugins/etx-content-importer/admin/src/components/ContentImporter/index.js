import React from 'react';

import FromItem, {  } from './FromItem';
import FromList from './FromList';

const ContentImporter = ({ url, type }) => {
  let FromComponent;
  switch (type) {
    case 'html':
      FromComponent = FromItem;
      break;
    case 'rss':
    case 'xml':
      FromComponent = FromList;
      break;
    case 'json':
      FromComponent = () => null;
      break;
    default:
      FromComponent = () => null;
  }

  return <FromComponent url={url} />;
};

export default ContentImporter;
