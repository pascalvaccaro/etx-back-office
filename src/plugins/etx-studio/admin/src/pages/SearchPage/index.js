import React, { useCallback } from 'react';
import { prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';
import { Elasticsearch, Results, Facet } from 'react-elasticsearch';

const SearchPage = () => {
  const articles = useCallback((result) => (result?.data || []).map((article) => JSON.stringify(article, null, 2)), []);
  return (
    <Elasticsearch url={`${prefixFileUrlWithBackendUrl('/api/etx-studio')}`}>
      <Facet id="mainCategory" fields={['mainCategory']} placeholder="Main category" />
      <Results id="result" items={articles} />
    </Elasticsearch>
  );
};

export default SearchPage;