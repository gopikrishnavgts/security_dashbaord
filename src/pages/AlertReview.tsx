import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { persistenceService } from '../services/persistence';
import type { PersistentAlert } from '../services/persistence';
import { formatRelative, formatEventType } from '../utils';

interface AlertReviewProps {
  alertId: string;
  onClose: () => void;
}

export default function AlertReview({ alertId, onClose }: AlertReviewProps) {
  const [alert, setAlert] = useState<PersistentAlert | null>(null);
  const [frameImage, setFrameImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Load alert details
    const loadedAlert = persistenceService.getAlertById(alertId);
    setAlert(loadedAlert);

    if (loadedAlert) {
      // Extract frame from video at timestamp
      extractFrame(loadedAlert);
    }
  }, [alertId]);

  const extractFrame = async (alert: PersistentAlert) => {
    try {
      // Find the video config for this camera
      const videoPath = getVideoPathForCamera(alert.cameraId);
      if (!videoPath) {
        console.error('No video found for camera:', alert.cameraId);
        setFrameImage(null);
        return;
      }

      // Create video element to extract frame
      const video = document.createElement('video');
      video.src = videoPath;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      // Add error handler
      video.addEventListener('error', (e) => {
        console.error('Video load error:', e, video.error);
        setFrameImage(null);
        video.remove();
      });

      video.addEventListener('loadeddata', () => {
        console.log('Video loaded, seeking to:', alert.videoTimestamp);
        video.currentTime = alert.videoTimestamp;
      });

      video.addEventListener('seeked', () => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) {
            console.error('Canvas not found');
            setFrameImage(null);
            return;
          }

          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('Cannot get canvas context');
            setFrameImage(null);
            return;
          }

          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to image
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          setFrameImage(imageData);
          console.log('✅ Frame extracted successfully');

          // Cleanup
          video.remove();
        } catch (err) {
          console.error('Canvas extraction error:', err);
          setFrameImage(null);
          video.remove();
        }
      });

      video.load();
    } catch (error) {
      console.error('Failed to extract frame:', error);
      setFrameImage(null);
    }
  };

  const getVideoPathForCamera = (cameraId: string): string | null => {
    const videoMap: Record<string, string> = {
      'cam-1a': 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam4_h264.mp4',
      'cam-2b': 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam2_h264.mp4',
      'cam-3a': 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam5_h264.mp4',
      'cam-4': 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam1_h264.mp4',
      'cam-5a': 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam3_h264.mp4',
    };
    return videoMap[cameraId] || null;
  };

  const handleVerify = () => {
    if (alert) {
      persistenceService.updateAlertStatus(alert.id, 'verified');
      onClose();
    }
  };

  const handleDismiss = () => {
    if (alert) {
      persistenceService.updateAlertStatus(alert.id, 'dismissed');
      onClose();
    }
  };

  if (!alert) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Loading alert...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Alert Review</h2>
            <p className="text-red-100 text-sm mt-1">
              {formatEventType(alert.event)} - {formatRelative(alert.startedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Video Frame */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Captured Frame</h3>
            <div className="bg-black rounded-lg overflow-hidden">
              {frameImage ? (
                <img
                  src={frameImage}
                  alt="Alert frame"
                  className="w-full h-auto"
                />
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-white">Extracting frame...</div>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Alert Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Alert Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Alert ID:</span>
                  <span className="font-mono text-gray-900">{alert.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Camera ID:</span>
                  <span className="font-medium text-gray-900">{alert.cameraId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timestamp:</span>
                  <span className="text-gray-900">{alert.videoTimestamp.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="text-gray-900">{(alert.score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : alert.status === 'verified'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Detection Details</h3>
              <div className="space-y-2 text-sm">
                {alert.frameData && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employees:</span>
                      <span className="font-semibold text-gray-900">{alert.frameData.employeeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customers:</span>
                      <span className="font-semibold text-gray-900">{alert.frameData.customerCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Caps Worn:</span>
                      <span className="font-semibold text-green-700">{alert.frameData.capsWorn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Caps Not Worn:</span>
                      <span className="font-semibold text-red-700">{alert.frameData.capsNotWorn}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {alert.status === 'pending' && (
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={handleVerify}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Verify Alert
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
                Dismiss Alert
              </button>
            </div>
          )}

          {alert.status !== 'pending' && (
            <div className="flex items-center justify-center gap-2 py-4 px-6 bg-blue-50 rounded-lg border border-blue-200">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">
                This alert has already been {alert.status === 'verified' ? 'verified' : 'dismissed'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
