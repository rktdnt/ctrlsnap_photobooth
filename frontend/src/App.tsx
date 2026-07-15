import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import TemplateSelector from './components/TemplateSelector';
import Photobooth from './components/Photobooth';
import PhotoEditor from './components/PhotoEditor';
import ResultPage from './components/ResultPage';
import SharedResultPage from './components/SharedResultPage';
import { CapturedPhoto, PhotostripLayout, PhotoFrame } from './types';
import { LAYOUTS, FRAMES } from './types';

export type ViewState = 'landing' | 'selector' | 'photobooth' | 'editor' | 'result' | 'shared';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [sessionMode, setSessionMode] = useState<'free' | 'premium'>('free');
  const [selectedLayout, setSelectedLayout] = useState<PhotostripLayout>(LAYOUTS[1]); // Default classic-3
  const [selectedFrame, setSelectedFrame] = useState<PhotoFrame>(FRAMES[0]); // Default sleek-minimalist
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [compiledDataUrl, setCompiledDataUrl] = useState<string>('');
  const [sharedImageUrl, setSharedImageUrl] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedImg = params.get('share') || params.get('image');
    if (sharedImg) {
      setSharedImageUrl(sharedImg);
      setView('shared');
    }
  }, []);

  const navigateTo = (newView: ViewState) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSession = () => {
    setCapturedPhotos([]);
    setCompiledDataUrl('');
    setSessionMode('free');
    setSelectedLayout(LAYOUTS[1]);
    setSelectedFrame(FRAMES[0]);
    navigateTo('landing');
  };

  const resetSharedSession = () => {
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    setSharedImageUrl('');
    resetSession();
  };

  return (
    <div className="app-shell font-sans selection:bg-muted-blue selection:text-ink">
      <div className="soft-orb one" />
      <div className="soft-orb two" />

      {view === 'landing' && (
        <LandingPage onNext={() => navigateTo('selector')} />
      )}
      
      {view === 'selector' && (
        <TemplateSelector 
          selectedLayout={selectedLayout}
          setSelectedLayout={setSelectedLayout}
          selectedFrame={selectedFrame}
          setSelectedFrame={setSelectedFrame}
          onBack={() => navigateTo('landing')}
          onNext={() => navigateTo('photobooth')}
          onUpgradePremium={() => {
            setSessionMode('premium');
            navigateTo('photobooth');
          }}
        />
      )}

      {view === 'photobooth' && (
        <Photobooth 
          layout={selectedLayout}
          onBack={() => navigateTo('selector')}
          onPhotosCaptured={(photos) => {
            setCapturedPhotos(photos);
            navigateTo('editor');
          }}
        />
      )}

      {view === 'editor' && (
        <PhotoEditor 
          photos={capturedPhotos}
          layout={selectedLayout}
          initialFrame={selectedFrame}
          sessionMode={sessionMode}
          onUpgradePremium={() => setSessionMode('premium')}
          onBack={() => navigateTo('photobooth')}
          onSave={(dataUrl) => {
            setCompiledDataUrl(dataUrl);
            navigateTo('result');
          }}
        />
      )}

      {view === 'result' && (
        <ResultPage 
          dataUrl={compiledDataUrl}
          layout={selectedLayout}
          frame={selectedFrame}
          sessionMode={sessionMode}
          onReset={resetSession}
        />
      )}

      {view === 'shared' && (
        <SharedResultPage 
          imageUrl={sharedImageUrl}
          onReset={resetSharedSession}
        />
      )}
    </div>
  );
}

export default App;
