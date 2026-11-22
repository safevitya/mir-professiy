import { useState } from 'react';
import { GameScreen, type RoundResult } from './screens/GameScreen';
import {
  AwardsScreen,
  FontSwitch,
  LevelScreen,
  LoginScreen,
  MenuScreen,
  ResultScreen,
  SettingsPanel,
  SoundButton,
  WorksScreen,
} from './screens/panels';
import { StoreProvider, useStore } from './store';
import type { Level, ProfessionId } from './types';
import { Button } from './ui/bits';

type Screen = 'menu' | 'levels' | 'game' | 'result' | 'awards' | 'works';

function Shell() {
  const { profile, logout } = useStore();
  const [screen, setScreen] = useState<Screen>('menu');
  const [profession, setProfession] = useState<ProfessionId>('picker');
  const [level, setLevel] = useState<Level>(1);
  const [category, setCategory] = useState<'furniture' | 'constructor' | 'electronics' | undefined>(undefined);
  const [roundKey, setRoundKey] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Мир профессий</h1>
        <FontSwitch />
        <SoundButton />
        <Button tone="quiet" onClick={() => setShowSettings(true)}>
          Настройки
        </Button>
        {profile && screen === 'menu' ? (
          <Button tone="ghost" onClick={logout}>
            Сменить профиль
          </Button>
        ) : null}
      </header>
      <main className="stage">
        {!profile ? (
          <LoginScreen onReady={() => setScreen('menu')} />
        ) : screen === 'menu' ? (
          <MenuScreen
            onPlay={(id) => {
              setProfession(id);
              setScreen('levels');
            }}
            onAwards={() => setScreen('awards')}
            onWorks={() => setScreen('works')}
          />
        ) : screen === 'levels' ? (
          <LevelScreen
            profession={profession}
            onPick={(lvl, cat) => {
              setLevel(lvl);
              setCategory(cat);
              setRoundKey((value) => value + 1);
              setScreen('game');
            }}
            onBack={() => setScreen('menu')}
          />
        ) : screen === 'game' ? (
          <GameScreen
            key={roundKey}
            profession={profession}
            level={level}
            category={category}
            onBack={() => setScreen('levels')}
            onMenu={() => setScreen('menu')}
            onDone={(res) => {
              setResult(res);
              setScreen('result');
            }}
          />
        ) : screen === 'result' && result ? (
          <ResultScreen
            profession={result.profession}
            level={result.level}
            stars={result.stars}
            finale={result.finale}
            newStickers={result.newStickers}
            onAgain={() => {
              setRoundKey((value) => value + 1);
              setScreen('game');
            }}
            onNext={() => {
              if (result.level < 3) {
                setLevel((result.level + 1) as Level);
                setRoundKey((value) => value + 1);
                setScreen('game');
              } else {
                setScreen('levels');
              }
            }}
            onMenu={() => setScreen('menu')}
          />
        ) : screen === 'awards' ? (
          <AwardsScreen onBack={() => setScreen('menu')} />
        ) : (
          <WorksScreen onBack={() => setScreen('menu')} />
        )}
      </main>
      {showSettings ? <SettingsPanel onClose={() => setShowSettings(false)} /> : null}
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
