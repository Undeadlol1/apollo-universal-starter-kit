import ClientModule from '@gqlapp/module-client-vue';
import { createApolloClient, apiUrl, log } from '@gqlapp/core-common';
import settings from '@gqlapp/config';

import createApp from './createApp';

// Virtual module, generated in-memory by spinjs, contains count of backend rebuilds
// tslint:disable-next-line
import 'backend_reload';

if (!__TEST__ || settings.app.logging.level === 'debug') {
  log.info(`Connecting to GraphQL backend at: ${apiUrl}`);
}

const onAppCreate = async (modules: ClientModule, entryModule: NodeModule) => {
  const { createNetLink, createLink, connectionParams, resolvers, reducers, routes } = modules;

  const client = createApolloClient({
    apiUrl,
    createNetLink,
    createLink,
    connectionParams,
    clientResolvers: resolvers
  });

  const { app } = createApp(entryModule, reducers, routes, client);

  app.$mount('#root');
};

if (__DEV__ && module.hot) {
  module.hot.accept('backend_reload', () => {
    log.debug('Reloading front-end');
    window.location.reload();
  });
}

export { default as createApp } from './createApp';

export default new ClientModule({
  onAppCreate: [onAppCreate]
});
