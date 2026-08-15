"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './about.css';
import Footer from '../../components/Footer/Footer';
import ReviewModal from '../../components/ReviewModal/ReviewModal';

const photographerHeader = '/aboutus.jpg';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ReviewText = ({ text, isHovered }) => {
  const words = text ? text.split(/\s+/) : [];

  return (
    <p className={`review-text ${isHovered ? 'hovered' : ''}`}>
      {!isHovered ? (
        text
      ) : (
        words.map((word, idx) => (
          <span
            key={idx}
            style={{
              opacity: 0,
              animation: 'fadeInWord 0.25s ease forwards',
              animationDelay: `${idx * 0.02}s`,
              display: 'inline-block',
              marginRight: '6px'
            }}
          >
            {word}
          </span>
        ))
      )}
    </p>
  );
};

const About = () => {
  const router = useRouter();
  const [stats, setStats] = useState({
    capsules_count: null,
    events_count: null,
    curators_count: null,
  });

  const [dbGalleryItems, setDbGalleryItems] = useState([]);
  const [dbCurators, setDbCurators] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [virtualIndex, setVirtualIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [reviewDirection, setReviewDirection] = useState('right'); // 'left' | 'right'
  const [reviewAnimating, setReviewAnimating] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Expanded state for curators/team grid (0 is the first, leftmost card)
  const [activeCuratorIndex, setActiveCuratorIndex] = useState(0);
  const [isDetailsHovered, setIsDetailsHovered] = useState(false);

  const fallbackFAQs = [
    {
      id: 'f1',
      question: 'How much does a website cost?',
      answer: 'The cost of a website depends on various factors such as design complexity, functionality, features, and the time required to build it. We offer custom packages tailored to fit different budgets and business needs.'
    },
    {
      id: 'f2',
      question: 'How does the subscription work?',
      answer: 'Our subscription service provides continuous access to design resources, updates, and maintenance. You pay a flat monthly rate and can submit design requests as needed, which are queued and delivered sequentially.'
    },
    {
      id: 'f3',
      question: 'How do I pause or cancel?',
      answer: 'You can pause or cancel your subscription at any time through your dashboard. When paused, you will not be billed for the next cycle, and any remaining days in your current cycle will be preserved for when you resume.'
    },
    {
      id: 'f4',
      question: 'How do I communicate with you?',
      answer: 'We coordinate mainly through our dedicated platform dashboard, Slack, and email to ensure swift communication and organized tracking of all your projects and requests.'
    },
    {
      id: 'f5',
      question: 'What if I don\'t like the design?',
      answer: 'Customer satisfaction is our priority. We offer unlimited revisions under our active subscription, meaning we will continue to refine and adjust the design until it matches your vision perfectly.'
    }
  ];

  const fallbackReviews = [
    {
      id: 'r1',
      user_name: 'Andy Law',
      review: 'Allows you to collaborate, experiment, and test much more effectively and efficiently.',
      user_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&crop=face&auto=format',
      rating: 5
    },
    {
      id: 'r2',
      user_name: 'Sarah Jenkins',
      review: 'The absolute best archival tool I have ever used. Simple, beautiful, and extremely performant.',
      user_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop&crop=face&auto=format',
      rating: 5
    },
    {
      id: 'r3',
      user_name: 'Marcus Brody',
      review: 'Our team is able to showcase our physical history in a modern digital way. Highly recommended!',
      user_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face&auto=format',
      rating: 4
    },
    {
      id: 'r4',
      user_name: 'Clara Oswald',
      review: 'Stunning design aesthetics combined with powerful back-end utilities. A dream to work with.',
      user_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face&auto=format',
      rating: 5
    },
    {
      id: 'r5',
      user_name: 'David Tennant',
      review: 'An incredible tool that has transformed how we capture and preserve life timelines.',
      user_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face&auto=format',
      rating: 5
    },
    {
      id: 'r6',
      user_name: 'Amelia Pond',
      review: 'Working with this archive has been like traveling through time itself. Brilliant user interface and design.',
      user_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&crop=face&auto=format',
      rating: 5
    },
    {
      id: 'r7',
      user_name: 'Rory Williams',
      review: 'The attention to detail in Relic is amazing. It has made capturing our family history incredibly simple.',
      user_image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&crop=face&auto=format',
      rating: 5
    },
    {
      id: 'r8',
      user_name: 'Rose Tyler',
      review: 'A beautiful way to save files and look back at old memories. Truly outstanding performance.',
      user_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop&crop=face&auto=format',
      rating: 5
    }
  ];

  useEffect(() => {
    // Inject Google Fonts if not already loaded
    const fontId = 'google-font-playfair-inter';
    if (typeof document !== 'undefined' && !document.getElementById(fontId)) {
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
          if (resData.data.curators && resData.data.curators.length > 0) {
            setDbCurators(resData.data.curators);
          }
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

    // Fetch FAQs
    fetch(`${API_BASE_URL}/api/faq/`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success' && resData.data && resData.data.length > 0) {
          setFaqs(resData.data);
        } else {
          setFaqs(fallbackFAQs);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch FAQs, using fallback data:', err);
        setFaqs(fallbackFAQs);
      });

    // Fetch Reviews
    fetch(`${API_BASE_URL}/api/reviews/`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success' && resData.data && resData.data.length > 0) {
          setReviews(resData.data);
        } else {
          setReviews(fallbackReviews);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch reviews, using fallback data:', err);
        setReviews(fallbackReviews);
      });
  }, []);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

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
  // Initialize virtualIndex to start at the middle copy of reviews
  useEffect(() => {
    if (reviews.length > 0 && virtualIndex === 0) {
      setVirtualIndex(reviews.length * 5);
    }
  }, [reviews, virtualIndex]);

  // Handle snapping back to middle copy without transitions when sliding out of bounds
  useEffect(() => {
    if (reviews.length === 0) return;
    const N = reviews.length;

    if (virtualIndex < N * 3) {
      const timer = setTimeout(() => {
        setTransitionEnabled(false);
        setVirtualIndex(virtualIndex + N * 4);
        setTimeout(() => {
          setTransitionEnabled(true);
        }, 50);
      }, 655);
      return () => clearTimeout(timer);
    } else if (virtualIndex >= N * 7) {
      const timer = setTimeout(() => {
        setTransitionEnabled(false);
        setVirtualIndex(virtualIndex - N * 4);
        setTimeout(() => {
          setTransitionEnabled(true);
        }, 50);
      }, 655);
      return () => clearTimeout(timer);
    }
  }, [virtualIndex, reviews.length]);

  useEffect(() => {
    setIsDetailsHovered(false);
  }, [virtualIndex]);

  return (
    <div className="about-page-wrapper">
      {/* ─── HEADER BANNER ─── */}
      <section className="about-header-banner">
        <div className="about-header-banner-image" style={{ backgroundImage: `url(${photographerHeader})` }}>
          <div className="about-header-banner-overlay" />
          <h1 className="about-header-banner-title">ABOUT US</h1>
        </div>
      </section>

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
                <h3>{stats.events_count !== null && stats.events_count !== undefined ? stats.events_count : '...'}</h3>
                <p>Events</p>
              </div>
              <div className="about-stat">
                <h3>{stats.capsules_count !== null && stats.capsules_count !== undefined ? stats.capsules_count : '...'}</h3>
                <p>Capsules</p>
              </div>
              <div className="about-stat">
                <h3>{stats.curators_count !== null && stats.curators_count !== undefined ? stats.curators_count : '...'}</h3>
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
              How Relic Works
            </h2>
            <p>⌘ Preserving your legacy step by step</p>
          </div>

          <div className="about-guide-grid">
            <div className="about-guide-card">
              <div className="step-number">01</div>
              <div className="icon-wrap">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
            <Link href="/capsule" className="explore-link" style={{ transition: "all 0.3s ease" }}>
              ⌘ Explore all public Capsules →
            </Link>
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

        {/* ─── REVIEWS SECTION ─── */}
        <section className="about-reviews-section">
          <div className="reviews-layout">
            {/* Reviews Header (Label & Button) */}
            <div className="reviews-header">
              <div className="reviews-vertical-label">
                <h2>Reviews</h2>
              </div>

              {/* Add Review Button - Plus Icon */}
              <button
                className="add-review-btn"
                onClick={() => setIsReviewModalOpen(true)}
                aria-label="Add Review"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

            {/* Reviews list in a row */}
            <div
              className={`reviews-list-container ${!transitionEnabled ? 'no-transition' : ''}`}
              style={{
                transform: `translateX(${(1 - virtualIndex) * (150 + 32)}px)`,
                transition: transitionEnabled ? 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
              }}
            >
              {Array(10).fill(reviews).flat().map((r, index) => {
                if (reviews.length === 0) return null;
                const isActive = index === virtualIndex;
                const userImage = r.user_image || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&crop=face&auto=format';

                return (
                  <div
                    key={index}
                    className={`review-card-wrapper ${isActive ? 'active' : 'inactive'}`}
                    onClick={() => {
                      if (!isActive && !reviewAnimating) {
                        const dir = index > virtualIndex ? 'right' : 'left';
                        setReviewDirection(dir);
                        setReviewAnimating(true);
                        setTransitionEnabled(true);
                        setVirtualIndex(index);
                        setTimeout(() => setReviewAnimating(false), 650);
                      }
                    }}
                  >
                    <div className="review-card-media">
                      <img src={userImage} alt={r.user_name} />

                      {isActive && (
                        <>
                          {/* Navigation Arrows */}
                          <button
                            className="review-nav-btn prev-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!reviewAnimating) {
                                setReviewDirection('left');
                                setReviewAnimating(true);
                                setTransitionEnabled(true);
                                setVirtualIndex((prev) => prev - 1);
                                setTimeout(() => setReviewAnimating(false), 650);
                              }
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                          </button>
                          <button
                            className="review-nav-btn next-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!reviewAnimating) {
                                setReviewDirection('right');
                                setReviewAnimating(true);
                                setTransitionEnabled(true);
                                setVirtualIndex((prev) => prev + 1);
                                setTimeout(() => setReviewAnimating(false), 650);
                              }
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>

                    {isActive && (
                      <div
                        className={`active-details slide-in-${reviewDirection}`}
                        onMouseEnter={() => setIsDetailsHovered(true)}
                        onMouseLeave={() => setIsDetailsHovered(false)}
                      >
                        <h3 className="review-username">{r.user_name || r.user_email || 'Anonymous'}</h3>
                        <span className="review-num">
                          {r.rating}
                          <svg width="30px" height="30px" fill='currentColor' viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m6.516 14.323-1.49 6.452a.998.998 0 0 0 1.529 1.057L12 18.202l5.445 3.63a1.001 1.001 0 0 0 1.517-1.106l-1.829-6.4 4.536-4.082a1 1 0 0 0-.59-1.74l-5.701-.454-2.467-5.461a.998.998 0 0 0-1.822 0L8.622 8.05l-5.701.453a1 1 0 0 0-.619 1.713l4.214 4.107zm2.853-4.326a.998.998 0 0 0 .832-.586L12 5.43l1.799 3.981a.998.998 0 0 0 .832.586l3.972.315-3.271 2.944c-.284.256-.397.65-.293 1.018l1.253 4.385-3.736-2.491a.995.995 0 0 0-1.109 0l-3.904 2.603 1.05-4.546a1 1 0 0 0-.276-.94l-3.038-2.962 4.09-.326z" /></svg>
                        </span>
                        <ReviewText text={r.review} isHovered={isDetailsHovered} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Review Modal */}
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />

        {/* ─── FAQ SECTION ─── */}
        <section className="about-faq-section">
          <h2 className="faq-main-title">FAQ's</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={faq.id || index}
                className={`faq-item ${expandedFaq === index ? 'active' : ''}`}
              >
                <div className="faq-question-row" onClick={() => toggleFaq(index)}>
                  <h3>{faq.question}</h3>
                  <span className="faq-toggle-icon">
                    {expandedFaq === index ? '−' : '+'}
                  </span>
                </div>
                <div className="faq-answer-container">
                  <div className="faq-answer">
                     <p>{faq.answer}</p>
                  </div>
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
          <div
            className="about-team-grid"
            onMouseLeave={() => setActiveCuratorIndex(0)}
          >
            {(dbCurators.length > 0 ? dbCurators : teamMembers).map((member, index) => {
              const name = member.name;
              const role = member.designation || member.role;
              const img = member.image || member.img || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&auto=format';
              const numStr = String(index + 1).padStart(2, '0');
              const isActive = activeCuratorIndex === index;
              return (
                <div
                  key={member.id || index}
                  className={`about-team-card ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setActiveCuratorIndex(index)}
                >
                  <div className="avatar">
                    <img src={img} alt={name} loading="lazy" />
                  </div>
                  <div className="card-overlay" />

                  {/* Collapsed Info */}
                  <div className="collapsed-info" style={{ '--card-img': `url(${img})` }}>
                    {role}
                  </div>

                  {/* Hovered Info */}
                  <div className="hovered-info">
                    <div className="card-number">{numStr}</div>
                    <div className="name">{name}</div>
                    <div className="role">{role}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;
