import { useEffect, useRef, useState } from 'react';
import { VideoTracker } from '../services/videoTracker';
import { alertGenerator } from '../services/alertGenerator';
import type { VideoConfig } from '../config/videos';

interface LiveVideoPlayerProps {
  config: VideoConfig;
}

export default function LiveVideoPlayer({ config }: LiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tracker, setTracker] = useState<VideoTracker | null>(null);
  const [stats, setStats] = useState({
    employees: 0,
    customers: 0,
    capsWorn: 0,
    capsNotWorn: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const monitoringRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize tracker
    const videoTracker = new VideoTracker(config.id, config.dataPath);

    videoTracker.load().then(() => {
      setTracker(videoTracker);
      setIsLoading(false);

      // Start monitoring - ENABLED
      if (videoTracker.isLoaded()) {
        alertGenerator.startMonitoring(config.id, videoTracker, config.cameraId);
      }
    });

    return () => {
      // Cleanup
      if (monitoringRef.current) {
        cancelAnimationFrame(monitoringRef.current);
      }
      alertGenerator.stopMonitoring(config.id);
    };
  }, [config]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Simple play attempt
    const attemptPlay = () => {
      video.muted = true;
      video.play().catch(err => {
        console.log('Video needs user interaction:', config.id);
        setIsLoading(false);
      });
    };

    // Try to play when metadata loads
    const handleLoadedMetadata = () => {
      setIsLoading(false);
      attemptPlay();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // If already loaded, try now
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    const updateStats = () => {
      if (video.paused) return;

      const currentTime = video.currentTime;
      const frameStats = tracker.getStatsAtTime(currentTime);

      if (frameStats) {
        setStats({
          employees: frameStats.employeeCount,
          customers: frameStats.customerCount,
          capsWorn: frameStats.capsWorn,
          capsNotWorn: frameStats.capsNotWorn,
        });

        // Check for alerts
        alertGenerator.checkFrame(
          config.id,
          currentTime,
          frameStats,
          config.cameraId,
          config.zoneId
        );
      }

      monitoringRef.current = requestAnimationFrame(updateStats);
    };

    monitoringRef.current = requestAnimationFrame(updateStats);

    return () => {
      if (monitoringRef.current) {
        cancelAnimationFrame(monitoringRef.current);
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [tracker, config]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
        controls={false}
        style={{ aspectRatio: '16/9' }}
        onError={(e) => {
          const videoEl = e.currentTarget;
          const error = videoEl.error;
          console.error(`❌ Video error for ${config.id}:`, {
            errorCode: error?.code,
            errorMessage: error?.message,
            errorName: error ? [
              'MEDIA_ERR_ABORTED',
              'MEDIA_ERR_NETWORK',
              'MEDIA_ERR_DECODE',
              'MEDIA_ERR_SRC_NOT_SUPPORTED'
            ][error.code - 1] : 'UNKNOWN',
            networkState: videoEl.networkState,
            readyState: videoEl.readyState,
            currentSrc: videoEl.currentSrc,
            videoPath: config.videoPath
          });
        }}
      >
        <source src={config.videoPath} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-white text-sm font-medium">Loading {config.cameraName}...</div>
          <div className="text-gray-300 text-xs mt-1">Connecting to camera feed</div>
        </div>
      )}

      {/* Camera info overlay - Extended to cover timestamp */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/70 to-transparent pt-4 pb-8 px-4">
        <div className="flex items-center justify-between">
          <div className="bg-black/60 px-3 py-1.5 rounded">
            <div className="text-white font-bold text-base">{config.cameraName}</div>
          </div>
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-semibold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      {tracker && tracker.isLoaded() && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-400">Employees</div>
              <div className="text-white font-bold">{stats.employees}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Customers</div>
              <div className="text-white font-bold">{stats.customers}</div>
            </div>
            <div className="text-center">
              <div className="text-green-400">Caps On</div>
              <div className="text-white font-bold">{stats.capsWorn}</div>
            </div>
            <div className="text-center">
              <div className="text-red-400">Caps Off</div>
              <div className="text-white font-bold">{stats.capsNotWorn}</div>
            </div>
          </div>
        </div>
      )}

      {/* No data indicator */}
      {!config.dataPath && (
        <div className="absolute bottom-3 right-3 bg-yellow-500/90 text-black text-xs px-2 py-1 rounded">
          No tracking data
        </div>
      )}
    </div>
  );
}
