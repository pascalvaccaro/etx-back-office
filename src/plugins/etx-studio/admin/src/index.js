import { prefixPluginTranslations } from '@strapi/helper-plugin';
import get from 'lodash/get';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

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
      Component: () => null
    });

    app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', ({ displayedHeaders, layout }) => {
      
      const isFieldLocalized = get(layout, 'contentType.pluginOptions.i18n.localized', false);
      console.log('layout', layout);
      console.log('headers', displayedHeaders);
      console.log('localized', isFieldLocalized);

			if (!isFieldLocalized) {
			  return { displayedHeaders, layout };
			}

			return {
        layout,
        displayedHeaders: [
			  ...displayedHeaders,
			  {
			    key: '__locale_key__', // Needed for the table
			    fieldSchema: { type: 'string' }, // Schema of the attribute
			    metadatas: {
						label: 'Content available in', // Label of the header,
						sortable: true // Define in the column is sortable
					}, // Metadatas for the label
					// Name of the key in the data we will display
			    name: 'locales',
					// Custom renderer
			    // cellFormatter: props => Object.keys(props).map(key => <p key={key}>key</p>),
			  },
			]};
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
