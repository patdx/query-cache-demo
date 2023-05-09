import { useEffect, useState } from 'react';
import './reload-prompt.css';

import { useRegisterSW } from 'virtual:pwa-register/react';

export function ReloadPrompt() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(true), []);

  if (!loaded) {
    return null;
  }

  return <ReloadPromptInner />;
}

export function ReloadPromptInner() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="ReloadPrompt-container">
      {(offlineReady || needRefresh) && (
        <div className="ReloadPrompt-toast">
          <div className="ReloadPrompt-message">
            {offlineReady ? (
              <span>App ready to work offline</span>
            ) : (
              <span>
                New content available, click on reload button to update.
              </span>
            )}
          </div>
          {needRefresh && (
            <button
              className="ReloadPrompt-toast-button"
              onClick={() => updateServiceWorker(true)}
            >
              Reload
            </button>
          )}
          <button className="ReloadPrompt-toast-button" onClick={() => close()}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
