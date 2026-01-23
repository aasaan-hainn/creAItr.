import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import LandingPage from './pages/LandingPage';

import MyProjects from './pages/MyProjects';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
