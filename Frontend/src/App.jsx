import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './pages/nav/navbar';
import Home from './pages/home/home';
import Mint from './pages/mint/mint';
import Gallery from './pages/capsule/gallery';
import GoogleLogin from './pages/auth.jsx/login.jsx';
import AuthCallback from './pages/auth.jsx/callback.jsx';
import Dashboard from './pages/dashboard/dashboard';
import CapsuleDetail from './pages/capsule/capsuleDetail';
import About from './pages/about/about';
import Contact from './pages/contact/Contact';
import NotFound from './pages/NotFound/NotFound';
function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#000000' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mint" element={<Mint />} />
        <Route path="/capsule" element={<Gallery />} />
        <Route path="/capsule/:id" element={<CapsuleDetail />} />
        <Route path="/auth" element={<GoogleLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
