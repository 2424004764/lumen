import { useState } from "react";
import { AnimatePresence } from "motion/react";
import type { Wallpaper } from "./data/wallpapers";
import { ensureFirstPage, getCached } from "./lib/api";
import { Footer } from "./components/Footer";
import { GallerySection } from "./components/GallerySection";
import { Hero } from "./components/Hero";
import { Lightbox } from "./components/Lightbox";
import { Navbar } from "./components/Navbar";
import { ToastProvider } from "./components/Toast";

interface LightboxState {
  list: Wallpaper[];
  index: number;
}

export default function App() {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const openRandom = async () => {
    const list = getCached().length > 0 ? getCached() : await ensureFirstPage();
    if (list.length === 0) return;
    const index = Math.floor(Math.random() * list.length);
    setLightbox({ list, index });
  };

  return (
    <ToastProvider>
      <div className="relative min-h-[100dvh] overflow-x-clip bg-zinc-950 text-zinc-100">
        <Navbar onRandom={openRandom} />
        <main>
          <Hero onRandom={openRandom} />
          <GallerySection onOpen={(list, index) => setLightbox({ list, index })} />
        </main>
        <Footer />

        {/* 胶片颗粒：覆盖全站的低成本质感层 */}
        <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-[60] opacity-[0.035]" />

        <AnimatePresence>
          {lightbox && (
            <Lightbox
              key="lightbox"
              list={lightbox.list}
              index={lightbox.index}
              onClose={() => setLightbox(null)}
              onIndexChange={(index) => setLightbox((s) => (s ? { ...s, index } : s))}
            />
          )}
        </AnimatePresence>
      </div>
    </ToastProvider>
  );
}
