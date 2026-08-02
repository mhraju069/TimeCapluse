import DomeGallery from './DomeGallery';

export default function Home() {
  return (
    <section
      style={{
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #07070b 0%, #14121b 100%)'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100vh',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: "white", zIndex: 9, }}>
          <div class="gallery-hero">
            <div class="curator-tag">curator's collection</div>
            <h1>
              The <span class="gold">millennium</span><br />
              archive gallery
            </h1>
            <p>
              A curated exhibition of human stories, preserved for future generations.
              Each capsule holds a life, a moment, a voice from the early 2000s.
            </p>
          </div>
        </div>
        <DomeGallery
          fit={0.8}
          minRadius={420}
          maxVerticalRotationDeg={0}
          segments={34}
          dragDampening={2}
          grayscale={false}
        />
      </div>
    </section>
  );
}