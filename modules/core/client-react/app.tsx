import ClientModule from '@module/module-client-react';

// Virtual module, generated in-memory by spinjs, contains count of backend rebuilds
// tslint:disable-next-line
import 'backend_reload';

import log from '../../../packages/common/log';
import { onAppCreate as onCreateMain, onAppDispose, renderApp } from './Main';

let frontendReloadCount = 0;

const onAppCreate = (modules: ClientModule, entryModule: NodeModule) => {
  onCreateMain(modules, entryModule);
  if (entryModule.hot) {
    entryModule.hot.dispose(data => onAppDispose(modules, data));
    if (__CLIENT__) {
      entryModule.hot.accept();
    }
  }
  if (entryModule.hot && entryModule.hot.data) {
    log.debug('Updating front-end');
    frontendReloadCount = (frontendReloadCount || 0) + 1;
  }
  renderApp({ key: frontendReloadCount });
};

if (__DEV__) {
  if (module.hot) {
    module.hot.accept();

    module.hot.accept('backend_reload', () => {
      log.debug('Reloading front-end');
      window.location.reload();
    });
  }
}

export default new ClientModule({ onAppCreate: [onAppCreate] });
