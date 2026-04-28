import { BrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppRoutes } from './routes';
import { useStealthMode } from './useStealthMode';

function App() {
  useStealthMode();
  
  return (
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  );
}

export default App;
