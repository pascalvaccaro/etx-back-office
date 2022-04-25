/* eslint-disable no-case-declarations */
import React, { createContext, useCallback, useReducer, useContext } from 'react';
import { getArticleFromHTML, getArticlesFromRss } from '../lib/ml';
import axios from '../utils/axiosInstance';

const store = createContext({
  state: {
    list: [],
    preview: {},
    loading: false,
    error: null,
  },
  dispatch: () => undefined,
});

const reducer = (state, action) => {
  const { dispatch, type, payload } = action;
  const { list } = state;
  const throwError = (err) => dispatch({ type: 'error', payload: err?.message ?? err.toString() });
  const isEmpty = (payload) => {
    const item = list.find((item) => item.metadata.url === payload);
    return !item?.content;
  };
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
    case 'list.set':
      return {
        ...state,
        loading: false,
        error: null,
        list: payload,
      };
    case 'list.export':
      const ids = payload.map((item) => item.title);
      Promise.all(payload.map(createArticle)).then(() =>
        dispatch({ type: 'list.set', payload: list.filter((item) => !ids.includes(item.title)) })
      );
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'preview.set':
      const { title = payload.title } = list.find((item) => item.metadata.url === payload.metadata.url) || {};
      const preview = {
        ...payload,
        title,
      };
      return {
        list: list.map((item) => (item.title === title ? preview : item)),
        loading: false,
        error: null,
        preview,
      };
    case 'preview.unset':
      return {
        ...state,
        loading: false,
        error: null,
        preview: null,
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
    case 'extract.html':
      if (isEmpty(payload))
        getArticleFromHTML(payload)
          .then((preview) => dispatch({ type: 'preview.set', payload: preview }))
          .catch(throwError);
      return {
        ...state,
        loading: true,
        error: null,
      };
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
  const [state, stub] = useReducer(reducer, { list: [], preview: null });
  const dispatch = useCallback(
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

export const useStore = () => useContext(store);
