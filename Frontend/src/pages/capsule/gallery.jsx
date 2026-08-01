import { InfiniteDraggableGrid } from './infinite-grid';
import { galleryData } from './galleryData';

export default function ResponsiveGallery() {
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', background: '#000', zIndex: 100 }}>
      <InfiniteDraggableGrid gallery={galleryData} />
    </div>
  );
}