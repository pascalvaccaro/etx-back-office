
import React from 'react';

import { Field, FieldInput, FieldLabel } from '@strapi/design-system/Field';
import { Popover } from '@strapi/design-system/Popover';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Stack } from '@strapi/design-system/Stack';
import { prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';

import axios from '../../utils/axiosInstance';

const Facet = ({ name, serviceId, onChange }) => {
  const inputRef = React.useRef();
  const facetEndpoint = React.useMemo(() => {
    try {
      return prefixFileUrlWithBackendUrl(`/etx-studio/facets/${serviceId}`);
    } catch (err) {
      return null;;
    }
  }, [serviceId]);

  const [value, setValue] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);
  const [terms, setTerms] = React.useState([]);

  const fetchFacets = React.useCallback((search) => {
    if (search.length < 2 || !facetEndpoint) return setSuggestions([]);
    const facetParams = new URLSearchParams({ name, search });
    axios.get(facetEndpoint + '?' + facetParams.toString())
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

export default Facet;