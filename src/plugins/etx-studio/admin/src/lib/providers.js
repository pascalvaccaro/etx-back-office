import { prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';
import stats from '../components/Stats';
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
        value: facet.id ?? facet.name ?? facet.toString(),
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
        { all: '*' },
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

const toMultiSelectField = ({ name, serviceId, type = 'multiselect', label = name }) => ({
  [name]: {
    label: label.slice(0, 1).toUpperCase() + label.slice(1),
    type,
    valueSources: ['value'],
    operators: [`${type}_equals`, `${type}_not_equals`],
    defaultOperator: `${type}_equals`,
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
      ...toMultiSelectField({ name: 'keyword', serviceId: 'afp' }),
    }
  },
  {
    serviceId: 'samba',
    name: 'ETX Studio',
    fields: ['brands', 'concepts', 'terms', 'publishers', 'categories', 'people']
      .reduce((acc, name) => ({
        ...acc,
        ...toMultiSelectField({ name, serviceId: 'samba' }),
      }), commonFields),
  },
  {
    serviceId: 'stats',
    name: 'Statistiques',
    fields: {
      publishedAt: {
        label: 'Date de publication',
        type: 'date',
        valueSources: ['value'],
        operators: ['greater_or_equal'],
        defaultOperator: 'greater_or_equal',
        defaultValue: new Date(2022, 0, 1).toISOString(),
      },
      ...toMultiSelectField({ name: 'createdBy', serviceId: 'stats', label: 'Auteur', type: 'select' }),
    },
    container: stats,
  },
  // {
  //   serviceId: 'wcm',
  //   name: 'WCM (Articles)',
  //   fields: {
  //     title: {
  //       label: 'Titre',
  //       type: 'text',
  //       valueSources: ['value'],
  //       defaultOperator: 'starts_with',
  //       operators: ['starts_with', 'like'],
  //     },
  //     publicationDate: {
  //       label: 'Date de publication',
  //       type: 'date',
  //       valueSources: ['value'],
  //       defaultOperator: 'between',
  //       operators: ['between', 'not_between', 'less', 'greater'],
  //       // defaultValue: ''
  //     },
  //     workflowState: {
  //       label: 'Statut',
  //       type: 'select',
  //       valueSources: ['value'],
  //       fieldSettings: {
  //         listValues: ['draft', 'published']
  //       }
  //     }
  //   }
  // },
  // {
  //   serviceId: 'wcm',
  //   name: 'WCM (Images)',
  //   fields: {
  //     title: {
  //       label: 'Titre',
  //       type: 'text',
  //       valueSources: ['value'],
  //       defaultOperator: 'starts_with',
  //       operators: ['starts_with', 'like'],
  //     },
  //     publicationDate: {
  //       label: 'Date de publication',
  //       type: 'date',
  //       valueSources: ['value'],
  //       defaultOperator: 'less',
  //       operators: ['between', 'not_between', 'less', 'greater'],
  //       // defaultValue: ''
  //     },
  //     credits: {
  //       label: 'Crédits',
  //       type: 'text',
  //       valueSources: ['value'],
  //       defaultOperator: 'starts_with',
  //       operators: ['starts_with', 'like']
  //     }
  //   }
  // }
];
