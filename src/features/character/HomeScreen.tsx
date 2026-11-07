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
import { Button, Panel, Modal } from '@/ui';
import { hasSave } from '@/stores';
import { OfflineBonusBanner, OfflineBonusChip } from '@/features/idle/OfflineBonusBanner';
import { SaveFailureNotice } from '@/ui/SaveFailureNotice';

export function HomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bonusOpen, setBonusOpen] = useState(false);
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
      className="d2-home relative h-[100dvh] flex flex-col items-center justify-between
                 px-3 py-2 pt-[max(.5rem,env(safe-area-inset-top))]
                 pb-[max(.5rem,env(safe-area-inset-bottom))]
                 overflow-hidden"
      data-testid="home-screen"
    >
      <SaveFailureNotice />
      <div className="relative z-10 min-h-0 flex-1 flex items-center justify-center w-full">
        <Panel className="d2-home-menu max-w-xl w-full text-center !p-3 [@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-3">
          <div className="mb-3 flex flex-col items-center justify-center [@media(max-height:500px)]:row-span-2 [@media(max-height:500px)]:mb-0">
            <svg
              className="d2-sigil mb-2 [@media(max-height:500px)]:hidden"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M24 3 39 15v18L24 45 9 33V15L24 3Z M24 10v28M16 19l8-5 8 5-8 15-8-15ZM3 24h9m24 0h9" />
              <path d="m18 7 6 3 6-3M18 41l6-3 6 3" />
            </svg>
            <h1 className="d2-home-title text-3xl md:text-4xl mb-2 font-serif">
              {t('home.title')}
            </h1>
            <p className="d2-home-subtitle">{t('home.subtitle')}</p>
          </div>

          <button
            type="button"
            className="d2-control mb-2 min-h-11 rounded px-2 focus-visible:ring-2 focus-visible:ring-d2-gold"
            onClick={() => {
              setBonusOpen(true);
            }}
            aria-label={t('offlineBonus.meterLabel')}
          >
            <OfflineBonusChip />
            <span className="text-sm text-d2-white/70">{t('settings:offlineBonusHelp.title')}</span>
          </button>

          <div className="space-y-2">
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
              onClick={() => {
                navigate('/character/new');
              }}
              className="w-full text-lg min-h-[48px]"
              data-testid="home-new-game"
            >
              {t('home.newGame')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate('/settings');
              }}
              className="w-full text-lg min-h-[48px]"
              data-testid="home-settings"
            >
              {t('home.settings')}
            </Button>
          </div>
        </Panel>
      </div>

      <Modal
        isOpen={bonusOpen}
        onClose={() => {
          setBonusOpen(false);
        }}
        title={t('settings:offlineBonusHelp.title')}
      >
        <OfflineBonusBanner />
        <p className="mt-2 text-sm text-d2-white/80">{t('settings:offlineBonusHelp.noIncome')}</p>
      </Modal>
      <footer className="relative z-10 shrink-0 text-center">
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
