/**
 * HomeScreen — title screen.
 *
 * Layout @ 360×640:
 *   [           D2 Title (gold)            ]
 *   [           Subtitle (rare)            ]
 *
 *   [          继续游戏  (if save)          ]
 *   [          新游戏                       ]
 *   [          设置                         ]
 *
 *   [ low-key BMC link footer              ]
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Panel } from '@/ui';
import { hasSave } from '@/stores';

export function HomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saveExists, setSaveExists] = useState(false);

  useEffect(() => {
    let mounted = true;
    hasSave()
      .then((has) => {
        if (mounted) setSaveExists(has);
      })
      .catch(() => {
        if (mounted) setSaveExists(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleContinue = () => {
    // Save load wiring happens in engine integration; for now route to town.
    navigate('/town');
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-between
                 px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))]
                 pb-[max(2rem,env(safe-area-inset-bottom))]
                 bg-gradient-to-b from-d2-bg via-d2-panel to-d2-bg"
      data-testid="home-screen"
    >
      <div className="flex-1 flex items-center justify-center w-full">
        <Panel className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-d2-gold mb-2 drop-shadow-lg font-serif">
              {t('home.title')}
            </h1>
            <p className="text-lg text-d2-rare">{t('home.subtitle')}</p>
          </div>

          <div className="space-y-3">
            {saveExists && (
              <Button
                variant="primary"
                onClick={handleContinue}
                className="w-full text-lg min-h-[48px]"
                data-testid="home-continue"
              >
                {t('home.continue')}
              </Button>
            )}
            <Button
              variant={saveExists ? 'secondary' : 'primary'}
              onClick={() => { navigate('/character/new'); }}
              className="w-full text-lg min-h-[48px]"
              data-testid="home-new-game"
            >
              {t('home.newGame')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { navigate('/settings'); }}
              className="w-full text-lg min-h-[48px]"
              data-testid="home-settings"
            >
              {t('home.settings')}
            </Button>
          </div>
        </Panel>
      </div>

      <footer className="mt-6 text-center">
        <a
          href="https://www.buymeacoffee.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-d2-border hover:text-d2-gold underline-offset-2 hover:underline
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold rounded"
        >
          ☕ {t('home.bmc', { defaultValue: t('settings:bmcLink') })}
        </a>
      </footer>
    </div>
  );
}
