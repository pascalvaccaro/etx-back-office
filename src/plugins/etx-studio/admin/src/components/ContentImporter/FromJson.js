import React from 'react';
import { Query, Builder, Utils as QbUtils } from 'react-awesome-query-builder';
import AntdConfig from 'react-awesome-query-builder/lib/config/antd';

import { Button } from '@strapi/design-system/Button';
import { Box } from '@strapi/design-system/Box';

import axios from '../../utils/axiosInstance';

import 'antd/dist/antd.css';
import 'react-awesome-query-builder/lib/css/styles.css';

const baseQuery = { id: QbUtils.uuid(), type: 'group' };

const FromJson = ({ serviceId, fields, queryValue = baseQuery, container }) => {
  const config = React.useMemo(() => ({
    ...AntdConfig,
    fields,
  }), [fields]);
  const [state, setState] = React.useState({
    tree: QbUtils.checkTree(QbUtils.loadTree(queryValue), config),
    config,
  });
  const [results, setResults] = React.useState([]);

  const handleChange = React.useCallback((tree, config) => {
    setState(prev => ({ ...prev, tree, config }));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!QbUtils.isValidTree(state.tree)) return;

    const json = QbUtils.jsonLogicFormat(state.tree, state.config);
    if (!json || json.errors?.length) return console.error(json.errors);

    await axios
      .post('/etx-studio/search/' + serviceId, json)
      .then(res => Array.isArray(res.data) ? setResults(res.data) : undefined)
      .catch(err => console.error(err));
  }, [state]);

  const renderResult = React.useCallback(() => typeof container === 'function' ?
    container({ results, refetch: handleSubmit }) : (
      <ul>
        {results.map((el) => {
          switch (serviceId) {
            case 'afp':
              return <li key={el.uno}>{el.title}</li>;
            case 'samba':
            case 'wcm':
              return <li key={el.id}>{el.title}</li>;
            default:
              return null;
          }
        })}
      </ul>
    ), [serviceId, container, results, handleSubmit]);

  const renderBuilder = React.useCallback((props) => (
    <div className="query-builder-container">
      <div className="query-builder qb-lite">
        <Builder {...props} />
        <Button onClick={handleSubmit}>Search</Button>
      </div>
    </div>
  ), [handleSubmit]);

  return (
    <Box>
      <Query {...config} value={state.tree} onChange={handleChange} renderBuilder={renderBuilder}>
        <div className="query-builder-result">
        </div>
      </Query>
      {renderResult()}
    </Box>
  );
};

export default FromJson;