import React, { useEffect, useState } from 'react';
import './about.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const About = () => {
  const [stats, setStats] = useState({
    capsules_count: null,
    events_count: null,
    curators_count: null,
  });

  const [dbGalleryItems, setDbGalleryItems] = useState([]);

  useEffect(() => {
    // Inject Google Fonts if not already loaded
    const fontId = 'google-font-playfair-inter';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap';
      document.head.appendChild(link);
    }

    // Fetch live statistics and sample timeline items from backend
    fetch(`${API_BASE_URL}/api/public-stats/`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success' && resData.data) {
          setStats(resData.data);
          if (resData.data.sample_items && resData.data.sample_items.length > 0) {
            const mapped = resData.data.sample_items.map((item, idx) => {
              const fallbackImages = [
                'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=400&fit=crop&crop=center&auto=format',
                'https://images.unsplash.com/photo-1520623088524-82ba44a509d8?w=400&h=400&fit=crop&crop=center&auto=format',
                'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop&crop=center&auto=format',
                'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&h=400&fit=crop&crop=center&auto=format',
              ];
              return {
                title: item.title || 'Timeline Event',
                sub: `${item.event_date || item.event_year || ''} · ${item.capsule_name || 'Capsule'}`,
                img: item.image_url || fallbackImages[idx % fallbackImages.length],
              };
            });
            
            if (mapped.length > 0) {
              setDbGalleryItems(mapped);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch public stats:', err);
      });
  }, []);

  const galleryItems = [
    {
      title: 'Rolleiflex 2.8F',
      sub: '1960 · Camera',
      img: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=400&fit=crop&crop=center&auto=format',
    },
    {
      title: 'Gustav Becker',
      sub: '1890 · Mantel Clock',
      img: 'https://images.unsplash.com/photo-1520623088524-82ba44a509d8?w=400&h=400&fit=crop&crop=center&auto=format',
    },
    {
      title: 'Underwood No. 5',
      sub: '1920 · Typewriter',
      img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop&crop=center&auto=format',
    },
    {
      title: 'Western Electric',
      sub: '1945 · Telephone',
      img: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&h=400&fit=crop&crop=center&auto=format',
    },
    {
      title: 'Terrestrial Globe',
      sub: '1898 · Cartography',
      img: 'https://images.unsplash.com/photo-1513267048331-5612a24e5dde?w=400&h=400&fit=crop&crop=center&auto=format',
    },
    {
      title: 'Montblanc 149',
      sub: '1950 · Writing',
      img: 'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=400&fit=crop&crop=center&auto=format',
    },
    {
      title: 'HMV 102',
      sub: '1935 · Phonograph',
      img: 'https://images.unsplash.com/photo-1508454768339-7e0f1e8f1e43?w=400&h=400&fit=crop&crop=center&auto=format',
    },
    {
      title: 'Kelvin & Hughes',
      sub: '1940 · Sextant',
      img: 'https://images.unsplash.com/photo-1487697555940-98137efaba3f?w=400&h=400&fit=crop&crop=center&auto=format',
    },
  ];

  const teamMembers = [
    {
      name: 'Elias Voss',
      role: 'Founder & Head Curator',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&auto=format',
    },
    {
      name: 'Maya Chen',
      role: 'Archival Director',
      img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face&auto=format',
    },
    {
      name: 'James Aldridge',
      role: 'Restoration Specialist',
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face&auto=format',
    },
    {
      name: 'Clara Fontaine',
      role: 'Digital Archivist',
      img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face&auto=format',
    },
  ];

  return (
    <div className="about-page-wrapper">
      <div className="about-container">
        {/* ─── HERO / ABOUT ─── */}
        <section className="about-hero">
          <div className="about-hero-text">
            <h1>
              Where <em>moments</em> become memories,<br />
              and live forever.
            </h1>
            <p>
              Relic is a living digital archive for the moments that shape us. It brings together milestone moments, life stories, and memories into a collection that grows with time. Because every moment carries a piece of who we are — and every story deserves to be remembered
            </p>
            <div className="about-stat-grid">
              <div className="about-stat">
                <h3>{stats.events_count !== null ? stats.events_count : '...'}</h3>
                <p>Events</p>
              </div>
              <div className="about-stat">
                <h3>{stats.capsules_count !== null ? stats.capsules_count : '...'}</h3>
                <p>Capsules</p>
              </div>
              <div className="about-stat">
                <h3>{stats.curators_count !== null ? stats.curators_count : '...'}</h3>
                <p>Curators</p>
              </div>
            </div>
          </div>
          <div className="about-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop&crop=center&auto=format"
              alt="Archive shelves with vintage objects"
              loading="lazy"
            />
            <span className="about-badge">Est. 2021</span>
          </div>
        </section>

        {/* ─── QUOTE ─── */}
        <div className="about-quote-block">
          <blockquote>The past is never dead. It's not even past.</blockquote>
          <div className="attribution">
            — William Faulkner, <em>Requiem for a Nun</em>
          </div>
        </div>

        {/* ─── HOW IT WORKS / GUIDE SECTION ─── */}
        <section className="about-guide-section">
          <div className="about-section-label">
            <h2>
              How <span>Relic</span> Works
            </h2>
            <p>⌘ Preserving your legacy step by step</p>
          </div>

          <div className="about-guide-grid">
            <div className="about-guide-card">
              <div className="step-number">01</div>
              <div className="icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Mint Your Time Capsule</h3>
              <p>
                Create your own unique personal time capsule. Name your space, customize cover art, and unlock a digital sanctuary built to stand the test of time.
              </p>
            </div>

            <div className="about-guide-card">
              <div className="step-number">02</div>
              <div className="icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>Preserve Life Timelines</h3>
              <p>
                Chronicle key milestones across interactive timeline years. Attach meaningful dates, descriptions, and high-resolution WebP compressed photos.
              </p>
            </div>

            <div className="about-guide-card">
              <div className="step-number">03</div>
              <div className="icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3>Pass On to Generations</h3>
              <p>
                Keep your memories safe forever. Share private access or display public stories on the interactive infinite grid for future generations to explore.
              </p>
            </div>
          </div>
        </section>

        {/* ─── GALLERY / ARCHIVE ─── */}
        <section className="about-gallery-section">
          <div className="about-section-label">
            <h2>
              From the <span>archive</span>
            </h2>
            <p>⌘ Explore preserved memories &amp; public capsules</p>
          </div>

          <div className="about-gallery-grid">
            {(dbGalleryItems.length > 0 ? dbGalleryItems : galleryItems).map((item, index) => (
              <div key={index} className="about-gallery-item">
                <img src={item.img} alt={item.title} loading="lazy" />
                <div className="overlay">
                  <div className="title">{item.title}</div>
                  <div className="sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── TEAM / CURATORS ─── */}
        <section className="about-team-section">
          <h2>
            Meet the <span>curators</span>
          </h2>
          <div className="about-team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="about-team-card">
                <div className="avatar">
                  <img src={member.img} alt={member.name} loading="lazy" />
                </div>
                <div className="name">{member.name}</div>
                <div className="role">{member.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="about-footer">
          <span>&copy; 2026 Relic · all rights reserved</span>
          <div className="socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer">
              X
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default About;
