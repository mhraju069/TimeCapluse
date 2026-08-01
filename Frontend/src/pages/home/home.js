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