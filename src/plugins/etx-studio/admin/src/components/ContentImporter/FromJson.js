
import React from 'react';
import { Field, FieldInput, FieldLabel } from '@strapi/design-system/Field';
import { Popover } from '@strapi/design-system/Popover';
import { Button } from '@strapi/design-system/Button';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Stack } from '@strapi/design-system/Stack';
import { prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';

import axios from '../../utils/axiosInstance';

const Facet = ({ name, serviceId, onChange }) => {
  const inputRef = React.useRef();
  const facetEndpoint = React.useMemo(() => {
    try {
      return new URL(prefixFileUrlWithBackendUrl(`/etx-studio/facets/${serviceId}`));
    } catch (err) {
      return null;;
    }
  }, [serviceId]);

  const [value, setValue] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);
  const [terms, setTerms] = React.useState([]);

  const fetchFacets = React.useCallback((search) => {
    setValue(search);
    if (search.length < 2 || !facetEndpoint) return setSuggestions([]);
    // @todo debounce this block
    facetEndpoint.searchParams.set('name', name);
    facetEndpoint.searchParams.set('search', search);
    axios.get(facetEndpoint.toString())
      .then(res => setSuggestions(res.data))
      .catch(err => console.error(err));
  }, [name, facetEndpoint]);

  const selectSuggestion = React.useCallback((suggestion) => () => {
    setTerms(v => [...v, suggestion]);
  }, []);
  const unselect = React.useCallback((term) => {
    setTerms(old => old.filter(t => t !== term));
  }, []);

  React.useEffect(() => {
    onChange({ [name]: terms });
  }, [name, terms]);

  return (
    <Box>
      <Field name={name}>
        <Stack spacing={1}>
          <FieldLabel>{name}</FieldLabel>
          <FieldInput ref={inputRef} type="text" value={value} onChange={e => fetchFacets(e.target.value)} />
          {suggestions.length > 0 ?
            (<Popover source={inputRef} spacing={16}>
              <ul style={{ width: 200 }}>
                {suggestions.map(suggestion =>
                  <Box as="li" color="neutral800" key={suggestion.name}>
                    <p onClick={selectSuggestion(suggestion)}>{suggestion.name}</p>
                  </Box>
                )}
              </ul>
            </Popover>) : null}
        </Stack>
      </Field>
      <Flex grow="1">
        {terms.map(v => <span key={v} onClick={unselect(v)}>{v}</span>)}
      </Flex>
    </Box>
  );
};

const FromJson = ({ serviceId, facets, queryBuilder }) => {
  const [query, setQuery] = React.useState(Object.keys(facets).filter(key => typeof key === 'string').map((facet) => ({ [facet]: [] })));
  const [results, setResults] = React.useState([]);
  const handleChange = React.useCallback((facet) => {
    console.log(facet);
    setQuery(old => ({ ...old, ...facet }));
  }, []);
  const renderElement = React.useCallback((el) => {
    switch (serviceId) {
      case 'afp':
        return <li key={el.uno}>{el.title}</li>;
      case 'samba':
        return <li key={el.id}>{el.title}</li>;
      default:
        return null;
    }
  }, []);

  const handleSubmit = React.useCallback(async () => {
    console.log(query);
    if (Object.values(query).some(facet => facet.length > 0)) {
      const results = await axios.post('/etx-studio/search/' + serviceId, queryBuilder(query));
      setResults(results);
    }
  }, [query, queryBuilder]);

  return (
    <Box>
      <Flex basis="100%" gap={1} alignItems="flex-start" direction="column">
        {facets.map(facet => <Facet key={facet} serviceId={serviceId} name={facet} onChange={handleChange} />)}
      </Flex>
      
      <Button variant="default" onClick={handleSubmit}>Search</Button>

      <div>
      </div>

      <ul>
        {results.map(renderElement)}
      </ul>
    </Box>
  );
};

export default FromJson;