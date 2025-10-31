import { useEffect } from "react";
import LiveVideoPlayer from "../components/LiveVideoPlayer";
import { VIDEO_CONFIGS } from "../config/videos";
import { persistenceService } from "../services/persistence";

export default function Live() {
  // Initialize persistence on first load
  useEffect(() => {
    persistenceService.initializeIfNeeded();
  }, []);

  const handlePlayAll = async () => {
    const videos = document.querySelectorAll('video');
    console.log('Found', videos.length, 'videos');

    for (const video of videos) {
      try {
        video.muted = true;

        // Force reload if video has error
        if (video.error || video.networkState === 3) {
          console.log('Reloading video due to error');
          video.load();
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        await video.play();
        console.log('Playing video successfully');
      } catch (err) {
        console.error('Play error:', err, 'Video element:', {
          src: video.src,
          currentSrc: video.currentSrc,
          error: video.error,
          networkState: video.networkState,
          readyState: video.readyState
        });
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Camera Feeds</h1>
        <p className="text-gray-600 mt-1">Real-time monitoring across all locations</p>
      </div>

      {/* Video Grid - 2x3 for 5 cameras */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {VIDEO_CONFIGS.map((config) => (
          <LiveVideoPlayer key={config.id} config={config} />
        ))}
      </div>
    </div>
  );
}
