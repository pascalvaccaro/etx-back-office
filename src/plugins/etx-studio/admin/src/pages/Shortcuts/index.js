import React from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Button } from '@strapi/design-system/Button';
import { IconButton } from '@strapi/design-system/IconButton';
import DeleteIcon from '@strapi/icons/Cross';
import { useQueryParams, auth } from '@strapi/helper-plugin';
import * as queries from './queries';
import getTrad from '../../utils/getTrad';
import pluginId from '../../pluginId';

const LOCAL_STORAGE_KEY = `${pluginId}__content-manager.shortcuts.selected`;

const shortcuts = [
  { name: 'onFire', icon: null },
  { name: 'published', icon: null },
  { name: 'icono', icon: null },
  { name: 'translate', icon: null },
  { name: 'submitted', icon: null }, 
  { name: 'mine', icon: null },
];

const Shortcuts = () => {
  const location = useLocation();
  const user = auth.getUserInfo();
  const isArticleListPage = React.useMemo(() => location.pathname.includes('/content-manager/collectionType/api::article.article'), [location]);
  const { formatMessage } = useIntl();
  const [, setQuery] = useQueryParams();
  const [selected, setSelected] = React.useReducer((_, value = '') => {
    localStorage.setItem(LOCAL_STORAGE_KEY, value);
    return value;
  }, localStorage.getItem(LOCAL_STORAGE_KEY) || '');

  const handleClick = React.useCallback((shortcut = '') => async () => {
    setSelected(shortcut);
    switch (shortcut in queries && typeof queries[shortcut]) {
      case 'object':
        setQuery({ ...queries[shortcut], page: 1 });
        break;
      case 'function':
        setQuery({ ...(await queries[shortcut]({ user })), page: 1 });
        break;
      default:
        setQuery(queries.default);
    }
  }, [setQuery]);

  return isArticleListPage ? (
    <>
      {shortcuts.map((shortcut) => (
        <Button
          key={shortcut.name}
          variant={selected === shortcut.name ? 'default' : 'tertiary'}
          startIcon={shortcut.icon}
          onClick={handleClick(shortcut.name)}
          size="S"
        >
          {formatMessage({ id: getTrad(`filters.${shortcut.name}`), defaultMessage: shortcut.name })}
        </Button>
      ))}
      <IconButton onClick={handleClick()} key="remove" variant="tertiary" icon={<DeleteIcon />} label={formatMessage({ id: getTrad('filters.remove'), defaultMessage: 'Remove filters' })} />
    </>
  ) : null;
};

export default Shortcuts;