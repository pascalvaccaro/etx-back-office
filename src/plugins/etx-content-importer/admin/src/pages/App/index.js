/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useIntl } from 'react-intl';
import { NotFound } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';
import { ContentImporter } from './ContentImporter';

const App = () => {
  return (
    <div>
      <Switch>
        <Route path={`/plugins/${pluginId}`} component={ContentImporter} exact />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

export default App;
