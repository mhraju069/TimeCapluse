import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './pages/nav/navbar';
import Home from './pages/home/home';
import Mint from './pages/mint/mint';
import Gallery from './pages/capsule/gallery';
import GoogleLogin from './pages/auth.jsx/login.jsx';
import AuthCallback from './pages/auth.jsx/callback.jsx';
function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f14' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mint" element={<Mint />} />
        <Route path="/capsule" element={<Gallery />} />
        <Route path="/auth" element={<GoogleLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </div>
  );
}

export default App;
