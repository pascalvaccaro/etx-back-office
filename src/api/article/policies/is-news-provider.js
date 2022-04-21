'use strict';

/**
 * `isNewsProvider` policy.
 */

module.exports = (policyContext, config, { strapi }) => {
    // Add your own logic here.
    strapi.log.info('In isNewsProvider policy.');

    const canDoSomething = true;

    if (canDoSomething) {
      return true;
    }

    return false;
};
