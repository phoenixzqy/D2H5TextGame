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
import { OfflineBonusBanner } from '@/features/idle/OfflineBonusBanner';
import { SaveFailureNotice } from '@/ui/SaveFailureNotice';

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
      className="d2-home relative min-h-[100dvh] flex flex-col items-center justify-between
                 px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))]
                 pb-[max(2rem,env(safe-area-inset-bottom))]
                 overflow-hidden"
      data-testid="home-screen"
    >
      <SaveFailureNotice />
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <Panel className="d2-home-menu max-w-md w-full text-center">
          <div className="mb-8 flex flex-col items-center">
            <svg className="d2-sigil mb-5" viewBox="0 0 48 48" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
              <path d="M24 3 39 15v18L24 45 9 33V15L24 3Z M24 10v28M16 19l8-5 8 5-8 15-8-15ZM3 24h9m24 0h9" />
              <path d="m18 7 6 3 6-3M18 41l6-3 6 3" />
            </svg>
            <h1 className="d2-home-title text-4xl md:text-5xl mb-4 font-serif">
              {t('home.title')}
            </h1>
            <p className="d2-home-subtitle">{t('home.subtitle')}</p>
          </div>

          <div className="mb-4">
            <OfflineBonusBanner />
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

      <footer className="relative z-10 mt-6 text-center">
        <a
          href="https://www.buymeacoffee.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="d2-control inline-flex items-center px-4 py-2 text-sm underline-offset-2 hover:underline
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold rounded"
        >
          ☕ {t('home.bmc')}
        </a>
      </footer>
    </div>
  );
}
