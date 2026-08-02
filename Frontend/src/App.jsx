import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './pages/nav/navbar';
import Home from './pages/home/home';
import Gallery from './pages/capsule/gallery';
import SearchResult from './pages/search/searchResult';

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f14' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capsule" element={<Gallery />} />
        <Route path="/capsule/search" element={<SearchResult />} />
      </Routes>
    </div>
  );
}

export default App;
