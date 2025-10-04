/*
******************************************************
* CAMERA MODULE LOGIC (camera_module.js)             *
* Handles camera access, alignment overlay, and capturing snapshot.
******************************************************
*/

let cameraStream = null;
const cameraModal = document.getElementById('camera-modal');
const CAPTURE_SIZE = 256; // Standard size for the square image capture

/**
 * Initializes the camera and starts the video stream.
 */
function startCamera() {
    const video = document.getElementById('camera-video');
    if (!video) return;

    // Request access to the user's camera (video only)
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            cameraStream = stream;
            video.srcObject = stream;
            // The video element must be played manually
            video.play();
        })
        .catch(err => {
            console.error("Camera access denied or failed:", err);
            // Assuming window.showMessage is defined in the main HTML
            if (typeof window.showMessage === 'function') {
                window.showMessage("Error: Camera access required to use this feature.", 'error');
            }
            window.closeCameraModal();
        });
}

/**
 * Stops the active camera stream.
 */
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

/**
 * Captures the current frame from the video feed and sends it back.
 */
window.captureFace = () => {
    const video = document.getElementById('camera-video');
    if (!video || !cameraStream) {
        if (typeof window.showMessage === 'function') {
            window.showMessage("Camera not ready. Please try again.", 'error');
        }
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const ctx = canvas.getContext('2d');

    // Draw the centered square crop from the video onto the canvas
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const minSide = Math.min(videoWidth, videoHeight);
    const sourceX = (videoWidth - minSide) / 2;
    const sourceY = (videoHeight - minSide) / 2;

    // Draw the cropped center square
    ctx.drawImage(video, sourceX, sourceY, minSide, minSide, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

    // Create an oval mask in the center and cut everything else
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.ellipse(CAPTURE_SIZE / 2, CAPTURE_SIZE / 2, CAPTURE_SIZE * 0.35, CAPTURE_SIZE * 0.45, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Convert the canvas image to a Base64 Data URL
    const imageDataURL = canvas.toDataURL('image/png');

    // Call the function in the main application to set the image
    if (typeof window.setFaceImage === 'function') {
        window.setFaceImage(imageDataURL);
    } else {
        console.error("setFaceImage function not found in main script.");
    }

    // Clean up and close
    window.closeCameraModal();
};

/**
 * Opens the camera capture modal.
 */
window.renderCameraModal = () => {
    // Check if modal element exists
    if (!cameraModal) return;

    cameraModal.innerHTML = `
        <div class="camera-content bg-gray-900 p-8 rounded-xl shadow-2xl max-w-xl w-full border-4 border-red-500" onclick="event.stopPropagation()" style="box-shadow: 0 0 50px #FF0040, 0 0 20px #FF0040 inset; backdrop-filter: blur(10px);">
            <h3 class="text-2xl font-bold text-white mb-4 border-b border-red-500 pb-2 text-center">:: HELMET CAMERA ALIGNMENT ::</h3>
            <p class="text-gray-300 mb-6 text-center font-mono">Align your face inside the red oval and click 'Capture'.</p>

            <!-- Video/Camera Container -->
            <div class="relative overflow-hidden w-full aspect-square mx-auto rounded-lg shadow-xl border-4 border-gray-700">
                <video id="camera-video" class="absolute w-full h-full object-cover transform scaleX(-1)"></video>
                
                <!-- Alignment Overlay (Oval Mask) -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div class="w-1/2 h-3/4 border-4 border-dashed rounded-full border-red-500 flex items-center justify-center animate-pulse" style="animation-duration: 2s;">
                        <span class="text-red-500 text-xs font-bold">ALIGN FACE</span>
                        </div>
                </div>
            </div>

            <div class="flex justify-center mt-6 space-x-4">
                <button onclick="captureFace()" class="shining-button px-6 py-3 rounded-lg font-semibold text-lg" style="border-color: #00FF00; color: #00FF00; box-shadow: 0 0 15px #00FF00;">
                    CAPTURE FACE
                </button>
                <button onclick="closeCameraModal()" class="shining-button px-6 py-3 rounded-lg font-semibold text-lg" style="border-color: #FF0040; color: #FF0040; box-shadow: 0 0 15px #FF0040;">
                    CANCEL
                </button>
            </div>
        </div>
    `;

    cameraModal.style.opacity = 0;
    cameraModal.style.display = 'flex';
    setTimeout(() => {
        cameraModal.classList.add('visible');
        cameraModal.style.opacity = 1;
        startCamera(); // Start stream after modal appears
    }, 10);
};

/**
 * Closes the camera modal and stops the camera stream.
 */
window.closeCameraModal = () => {
    stopCamera();
    if (!cameraModal) return;
    cameraModal.style.opacity = 0;
    cameraModal.classList.remove('visible');
    setTimeout(() => {
        cameraModal.style.display = 'none';
    }, 300);
};

// Expose key functions globally for the main HTML
window.startCamera = startCamera;
window.stopCamera = stopCamera;
window.captureFace = window.captureFace; // Ensure this is available globally
window.renderCameraModal = window.renderCameraModal;
window.closeCameraModal = window.closeCameraModal;
