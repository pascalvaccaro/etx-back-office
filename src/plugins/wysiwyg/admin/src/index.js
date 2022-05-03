import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import Wysiwyg from './components/Wysiwyg';
import Editor from './components/Editor';
import getTrad from './utils/getTrad';

const name = pluginPkg.strapi.name;

const Component = async () => import(/* webpackChunkName: "etx-studio-editor-settings-page"  */ './pages/App');

export default {
  register(app) {
    app.createSettingSection(
      {
        id: 'etx-studio',
        intlLabel: { id: getTrad('settings.label'), defaultMessage: 'ETX Studio' },
      },
      [
        {
          id: 'ckeditor',
          intlLabel: { id: getTrad('settings.editor.label'), defaultMessage: 'Éditeur' },
          to: `/settings/${pluginId}`,
          Component,
        },
      ]
    );
    app.addFields({ type: 'wysiwyg', Component: Wysiwyg });
    app.addComponents([{ name: 'richeditor', Component: Editor }]);
    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });
  },

  bootstrap(app) {},
  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
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
