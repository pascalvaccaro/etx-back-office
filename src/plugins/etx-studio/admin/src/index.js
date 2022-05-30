import React from 'react';
import { prefixPluginTranslations } from '@strapi/helper-plugin';
// import get from 'lodash/get';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
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

  bootstrap(app) {
    app.injectContentManagerComponent('listView', 'actions', {
      name: `${pluginId}-filters`,
      Component: () => <Shortcuts />,
    });
    app.injectContentManagerComponent('editView', 'informations', {
      name: `${pluginId}-preview`,
      Component: () => <Preview />,
    });

    // app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', ({ displayedHeaders, layout }) => {
    //   const isFieldLocalized = get(layout, 'contentType.pluginOptions.i18n.localized', false);
    //   console.log('layout', layout);
    //   console.log('headers', displayedHeaders);
    //   console.log('localized', isFieldLocalized);

    //   if (!isFieldLocalized) {
    //     return { displayedHeaders, layout };
    //   }

    //   return {
    //     layout,
    //     displayedHeaders: displayedHeaders.map(header => header.name === 'locales' ? {
    //       ...header,
    //       metadatas: {
    //         ...header.metadatas,
    //         sortable: true,
    //       }
    //     } : header)
    //   };
    // });
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
