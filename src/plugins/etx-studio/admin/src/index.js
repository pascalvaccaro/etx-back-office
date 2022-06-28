import React from 'react';
import { prefixPluginTranslations, auth } from '@strapi/helper-plugin';
import { fetchEntityActions } from 'strapi-plugin-publisher/admin/src/api/actions';
import { Typography } from '@strapi/design-system/Typography';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import ErrorBoundary from './components/ErrorBoundary';
import Shortcuts from './pages/Shortcuts';
import Preview from './pages/Preview';

const name = pluginPkg.strapi.name;

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
      },
      Component: async () => {
        const component = await import(/* webpackChunkName: "[request]" */ './pages/App');

        return component;
      },
      permissions: [
        // Uncomment to set the permissions of the plugin here
        // {
        //   action: '', // the action name should be plugin::plugin-name.actionType
        //   subject: null,
        // },
      ],
    });
    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });
  },

  async bootstrap(app) {
    app.injectContentManagerComponent('listView', 'actions', {
      name: `${pluginId}-filters`,
      Component: () => <ErrorBoundary><Shortcuts /></ErrorBoundary>,
    });
    app.injectContentManagerComponent('editView', 'informations', {
      name: `${pluginId}-preview`,
      Component: () => <ErrorBoundary><Preview /></ErrorBoundary>,
    });

    const schedule = await fetchEntityActions({ entitySlug: 'api::article.article', mode: 'publish' }).then(res => (res.data ?? []));

    app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', ({ layout, displayedHeaders }) => {
      if (layout.contentType.uid !== 'api::article.article') return { layout, displayedHeaders };
      
      const user = auth.getUserInfo();
      const locale = user?.preferredLanguage ?? 'fr';

      return {
        layout,
        displayedHeaders: [
          ...displayedHeaders,
          {
            key: '__publishedAt_key__',
            fieldSchema: { type: 'datetime' },
            metadatas: {
              label: 'Publication',
              sortable: true,
            },
            name: 'publishedAt',
            cellFormatter: (props) => {
              const date = props.publishedAt ?? schedule.find(s => s.entityId === props.id)?.executeAt ?? null;
              const textColor = props.publishedAt ? 'success700' : 'secondary700';
              return date ? <Typography textColor={textColor}>{new Date(date).toLocaleString(locale)}</Typography> : '-';
            },
          }
        ]
      };
    });
  },

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map(locale => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
