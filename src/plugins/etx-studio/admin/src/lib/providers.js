import { prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';
import axios from '../utils/axiosInstance';

const fetchFacets = ({ name, serviceId }) => {
  const facetEndpoint = prefixFileUrlWithBackendUrl(`/etx-studio/facets/${serviceId}`);
  const facetParams = new URLSearchParams();
  facetParams.set('name', name);

  return async (search, offset) => {
    if (!search || search.length < 2 || !facetEndpoint) return { values: [], hasMore: false };
    facetParams.set('offset', offset);
    facetParams.set('search', search);
    const facets = await axios.get(facetEndpoint + '?' + facetParams.toString())
      .then(res => res.data)
      .catch(err => console.error(err));

    return {
      values: (facets ?? []).map(facet => ({
        title: facet.name ?? facet.toString(),
        value: facet.name ?? facet.toString(),
      })),
      hasMore: false
    };
  };
};

const commonFields = {
  lang: {
    label: 'Langue',
    type: 'select',
    valueSources: ['value'],
    operators: ['equal', 'not_equal'],
    defaultOperator: 'equal',
    fieldSettings: {
      listValues: [
        { fr: 'Français' },
        { en: 'English' },
      ]
    }
  },
  created: {
    label: 'Created',
    type: 'date',
    valueSources: ['value'],
    operators: ['equal', 'greater', 'greater_or_equal', 'less', 'less_or_equal', 'between'],
    defaultOperator: 'between',
  },
};

const toMultiSelectField = (name, serviceId) => ({
  [name]: {
    label: name.slice(0, 1).toUpperCase() + name.slice(1),
    type: 'multiselect',
    valueSources: ['value'],
    operators: ['multiselect_equals', 'multiselect_not_equals'],
    defaultOperator: 'multiselect_equals',
    fieldSettings: {
      showSearch: true,
      useAsyncSearch: true,
      useLoadMore: true,
      asyncFetch: fetchFacets({ name, serviceId }),
    }
  }
});

export const AVAILABLE_PROVIDERS = [
  {
    serviceId: 'afp',
    name: 'AFP',
    fields: {
      ...commonFields,
      ...toMultiSelectField('keyword', 'afp'),
    }
  },
  {
    serviceId: 'samba',
    name: 'ETX Studio',
    fields: ['brands', 'concepts', 'terms', 'publishers', 'categories', 'people']
      .reduce((acc, label) => ({
        ...acc,
        ...toMultiSelectField(label, 'samba'),
      }), commonFields),
  },
  {
    serviceId: 'wcm',
    name: 'WCM (Articles)',
    fields: {
      title: {
        label: 'Titre',
        type: 'text',
        valueSources: ['value'],
        defaultOperator: 'starts_with',
        operators: ['starts_with', 'like'],
      },
      publicationDate: {
        label: 'Date de publication',
        type: 'date',
        valueSources: ['value'],
        defaultOperator: 'between',
        operators: ['between', 'not_between', 'less', 'greater'],
        // defaultValue: ''
      },
      workflowState: {
        label: 'Statut',
        type: 'select',
        valueSources: ['value'],
        fieldSettings: {
          listValues: ['draft', 'published']
        }
      }
    }
  },
  {
    serviceId: 'wcm',
    name: 'WCM (Images)',
    fields: {
      title: {
        label: 'Titre',
        type: 'text',
        valueSources: ['value'],
        defaultOperator: 'starts_with',
        operators: ['starts_with', 'like'],
      },
      publicationDate: {
        label: 'Date de publication',
        type: 'date',
        valueSources: ['value'],
        defaultOperator: 'less',
        operators: ['between', 'not_between', 'less', 'greater'],
        // defaultValue: ''
      },
      credits: {
        label: 'Crédits',
        type: 'text',
        valueSources: ['value'],
        defaultOperator: 'starts_with',
        operators: ['starts_with', 'like']
      }
    }
  }
];
