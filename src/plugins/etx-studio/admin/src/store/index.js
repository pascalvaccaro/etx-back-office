import React from 'react';
import { getArticleFromHTML, getArticlesFromRss } from '../lib/ml';
import axios from '../utils/axiosInstance';

const defaultState = {
  list: [],
  preview: {},
  provider: 'AFP',
  loading: false,
  error: null,
};
const store = React.createContext({
  state: defaultState,
  dispatch: () => undefined,
});

const reducer = (state, action) => {
  const { dispatch, type, payload } = action;
  const { list, preview } = state;
  const throwError = (err) => dispatch({ type: 'error', payload: err?.message ?? err.toString() });
  const createArticle = (body) =>
    axios
      .post(`/content-manager/collection-types/api::article.article?plugins[i18n][locale]=${body.locale || 'fr'}`, body)
      .then((res) => res.data)
      .catch(throwError);

  switch (type) {
    case 'error':
      // eslint-disable-next-line no-console
      console.error('[REDUCER:ERROR]', payload);
      return {
        ...state,
        error: true,
      };
    case 'provider.set':
      return {
        ...state,
        loading: false,
        error: null,
        provider: payload,
      };
    case 'list.set':
      return {
        ...state,
        loading: false,
        error: null,
        list: payload,
      };
    case 'list.export': {
      const ids = payload.map((item) => item.title);
      Promise.all(payload.map(createArticle)).then(() =>
        dispatch({ type: 'list.set', payload: list.filter((item) => !ids.includes(item.title)) })
      );
      return {
        ...state,
        loading: true,
        error: null,
      };
    }
    case 'preview.set': {
      const { title = payload.title } = list.find((item) => item.externalUrl === payload.externalUrl) || {};
      const newPreview = {
        ...payload,
        title,
      };
      return {
        list: list.map((item) => (item.title === title ? newPreview : item)),
        loading: false,
        error: null,
        preview: newPreview,
      };
    }
    case 'preview.unset':
      return {
        ...state,
        loading: false,
        error: null,
        preview: null,
      };
    case 'preview.next':
    case 'preview.prev': {
      if (!preview) return {
        ...state,
        loading: false,
      };
      const adjuster = type === 'preview.next' ? 1 : -1;
      const index = list.findIndex(item => item.externalUrl === preview.externalUrl) + adjuster;
      if (index < 0 || index >= list.length) return {
        ...state,
        preview: null,
        loading: false,
      };
      const target = list[index];
      return {
        ...state,
        loading: !target.content,
        error: null,
        preview: target,
      };
    }
    case 'preview.export':
      createArticle(payload).then(() =>
        dispatch({ type: 'list.set', payload: list.filter((item) => item.title !== payload.title) })
      );
      return {
        ...state,
        preview: null,
        loading: true,
        error: null,
      };
    case 'extract.html': {
      const incoming = list.find(item => item.externalUrl === payload);
      const empty = !incoming?.content;
      if (empty)
        getArticleFromHTML(payload)
          .then((result) => dispatch({ type: 'preview.set', payload: result }))
          .catch(throwError);
      return {
        ...state,
        preview: incoming,
        loading: empty,
        error: null,
      };
    }
    case 'extract.rss':
      getArticlesFromRss(payload)
        .then((list) => dispatch({ type: 'list.set', payload: list }))
        .catch(throwError);
      return {
        ...state,
        preview: null,
        loading: true,
        error: null,
      };
    default:
      return state;
  }
};

const StoreProvider = ({ children }) => {
  const [state, stub] = React.useReducer(reducer, defaultState);
  const dispatch = React.useCallback(
    (action) => {
      action.dispatch = stub;
      stub(action);
    },
    [stub]
  );

  return (
    <store.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </store.Provider>
  );
};

export default StoreProvider;

export const useStore = () => React.useContext(store);
