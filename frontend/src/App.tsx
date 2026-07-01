import { useState } from 'react';
import LandingPage from './components/LandingPage';
import TemplateSelector from './components/TemplateSelector';
import Photobooth from './components/Photobooth';
import PhotoEditor from './components/PhotoEditor';
import ResultPage from './components/ResultPage';
import { CapturedPhoto, PhotostripLayout, PhotoFrame } from './types';
import { LAYOUTS, FRAMES } from './types';

export type ViewState = 'landing' | 'selector' | 'photobooth' | 'editor' | 'result';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [sessionMode, setSessionMode] = useState<'trial' | 'premium'>('trial');
  const [selectedLayout, setSelectedLayout] = useState<PhotostripLayout>(LAYOUTS[1]); // Default classic-3
  const [selectedFrame, setSelectedFrame] = useState<PhotoFrame>(FRAMES[0]); // Default sleek-minimalist
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [compiledDataUrl, setCompiledDataUrl] = useState<string>('');

  const navigateTo = (newView: ViewState) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSession = () => {
    setCapturedPhotos([]);
    setCompiledDataUrl('');
    setSessionMode('trial');
    setSelectedLayout(LAYOUTS[1]);
    setSelectedFrame(FRAMES[0]);
    navigateTo('landing');
  };

  return (
    <div className="min-h-screen bg-bg-cosmic text-white font-sans selection:bg-neon-purple selection:text-white relative">
      {/* Global cosmic background elements */}
      <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none">
        <div className="cyber-grid" />
      </div>
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-start/20 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-neon-cyan/20 blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {view === 'landing' && (
        <LandingPage onNext={() => navigateTo('selector')} />
      )}
      
      {view === 'selector' && (
        <TemplateSelector 
          sessionMode={sessionMode}
          setSessionMode={setSessionMode}
          selectedLayout={selectedLayout}
          setSelectedLayout={setSelectedLayout}
          selectedFrame={selectedFrame}
          setSelectedFrame={setSelectedFrame}
          onBack={() => navigateTo('landing')}
          onNext={() => navigateTo('photobooth')}
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
    </div>
  );
}

export default App;
