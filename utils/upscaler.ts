
const WORKER_CODE = `
import * as tf from 'https://esm.sh/@tensorflow/tfjs@^4.22.0';
import 'https://esm.sh/@tensorflow/tfjs-backend-webgpu@^4.22.0';
import 'https://esm.sh/@tensorflow/tfjs-backend-webgl@^4.22.0';

// Use a reliable public CDN for the model artifacts
// This avoids issues where local model files are missing or not served correctly
const LOCAL_MODEL_PATH = '/models/model.json';
const CDN_MODEL_PATH = 'https://unpkg.com/@upscalerjs/default-model@1.0.0-beta.17/models/model.json';
const TILE_SIZE = 128;
const PADDING = 16;

let model = null;
let isInitialized = false;

// Initialize TensorFlow backend and model
async function init() {
    if (isInitialized) return;

    try {
        // Try WebGPU first
        try {
            await tf.setBackend('webgpu');
            await tf.ready();
            console.log("Worker: Ultra-fast WebGPU backend active ⚡️");
        } catch (gpuError) {
            console.warn("Worker: WebGPU failed/unsupported, falling back to WebGL.", gpuError);
            await tf.setBackend('webgl');
            await tf.ready();
            console.log("Worker: Stable WebGL backend active 🚀");
        }

        // Load the model: try local first (which uses local group1-shard1of1.weights), then CDN
        const localUrl = self.location.origin + LOCAL_MODEL_PATH;
        try {
            console.log("Worker: Attempting local model load from", localUrl);
            model = await tf.loadLayersModel(localUrl);
            console.log("Worker: Local model (group1-shard1of1.weights) loaded successfully! 🎯");
        } catch (localErr) {
            console.warn("Worker: Local model load failed, falling back to CDN:", localErr);
            model = await tf.loadLayersModel(CDN_MODEL_PATH);
            console.log("Worker: CDN model loaded successfully!");
        }
        
        // Warmup
        const dummy = tf.zeros([1, 32, 32, 3]);
        model.predict(dummy);
        dummy.dispose();
        
        isInitialized = true;
        console.log("Worker: Model initialized");
    } catch (e) {
        console.error("Worker Init Error:", e);
        throw new Error("Failed to init AI in worker: " + e.message);
    }
}

async function processTiled(source) {
    if (!model) throw new Error("Model not loaded");

    const inW = source.width;
    const inH = source.height;
    
    if (inW === 0 || inH === 0) throw new Error("Input source has 0 dimension");

    // Determine scale factor (run a quick check)
    // We assume the model is 2x.
    const scale = 2; 

    const outW = Math.round(inW * scale);
    const outH = Math.round(inH * scale);
    
    if (outW === 0 || outH === 0) throw new Error("Output would be 0 dimension");

    // Create intermediate canvas for source reading
    const srcCanvas = new OffscreenCanvas(inW, inH);
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.drawImage(source, 0, 0);

    // Create output canvas
    const outputCanvas = new OffscreenCanvas(outW, outH);
    const outCtx = outputCanvas.getContext('2d');
    if (!outCtx) throw new Error("Output context failed");

    const cols = Math.ceil(inW / TILE_SIZE);
    const rows = Math.ceil(inH / TILE_SIZE);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Yield to event loop occasionally to keep worker responsive
            if (c % 2 === 0) await new Promise(res => setTimeout(res, 0));

            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;
            const w = Math.min(TILE_SIZE, inW - x);
            const h = Math.min(TILE_SIZE, inH - y);

            const padLeft = x < PADDING ? x : PADDING;
            const padTop = y < PADDING ? y : PADDING;
            const padRight = (x + w + PADDING > inW) ? inW - (x + w) : PADDING;
            const padBottom = (y + h + PADDING > inH) ? inH - (y + h) : PADDING;

            const srcX = x - padLeft;
            const srcY = y - padTop;
            const srcW = w + padLeft + padRight;
            const srcH = h + padTop + padBottom;

            const tileData = srcCtx.getImageData(srcX, srcY, srcW, srcH);
            
            // Process tile
            const outputTensor = tf.tidy(() => {
                let input = tf.browser.fromPixels(tileData).toFloat().div(255.0);
                input = input.expandDims(0);
                let output = model.predict(input);
                return output.squeeze().clipByValue(0, 1).mul(255.0).toInt();
            });

            const tileOutW = srcW * scale;
            const tileOutH = srcH * scale;

            // Write to temp canvas
            const tempCanvas = new OffscreenCanvas(tileOutW, tileOutH);
            await tf.browser.toPixels(outputTensor, tempCanvas);
            outputTensor.dispose();

            // Draw valid region to output
            outCtx.drawImage(
                tempCanvas, 
                padLeft * scale, padTop * scale, 
                w * scale, h * scale, 
                x * scale, y * scale, 
                w * scale, h * scale
            );
        }
    }
    return outputCanvas;
}

self.onmessage = async (e) => {
    const { id, type, image } = e.data;

    if (type === 'UPSCALE') {
        try {
            await init();
            
            // 1. First Pass (2x)
            let resultCanvas = await processTiled(image);
            
            if (!resultCanvas || resultCanvas.width === 0 || resultCanvas.height === 0) {
                 throw new Error("First pass resulted in empty image");
            }
            
            // 2. Second Pass (if target is 4x)
            // Convert OffscreenCanvas to ImageBitmap for second pass
            const firstPassBitmap = resultCanvas.transferToImageBitmap();
            
            // Second Pass
            const finalCanvas = await processTiled(firstPassBitmap);
            
            if (!finalCanvas || finalCanvas.width === 0 || finalCanvas.height === 0) {
                 throw new Error("Second pass resulted in empty image");
            }
            
            // Return final result
            const finalBitmap = finalCanvas.transferToImageBitmap();
            
            self.postMessage({ id, success: true, image: finalBitmap }, [finalBitmap]);
            
        } catch (error) {
            console.error("Worker Upscale Error:", error);
            self.postMessage({ id, success: false, error: error.message });
        }
    }
};
`;

export class UpscalerService {
    private worker: Worker | null = null;
    private pendingRequests = new Map<string, { resolve: (val: string) => void, reject: (err: any) => void }>();
    private workerUrl: string | null = null;

    constructor() {}

    private initWorker() {
        if (!this.worker) {
            try {
                // Create a Blob from the worker code string
                const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
                this.workerUrl = URL.createObjectURL(blob);
                
                // Initialize worker from Blob URL - this bypasses cross-origin restrictions
                this.worker = new Worker(this.workerUrl, { type: 'module' });
                
                this.worker.onmessage = (e) => {
                    const { id, success, image, error } = e.data;
                    const req = this.pendingRequests.get(id);
                    if (req) {
                        this.pendingRequests.delete(id);
                        if (success) {
                            // image is ImageBitmap. Convert to Blob URL.
                            this.bitmapToBlobUrl(image).then(url => {
                                 req.resolve(url);
                            }).catch(err => {
                                 req.reject(new Error("Failed to convert result: " + err.message));
                            });
                        } else {
                            req.reject(new Error(error));
                        }
                    }
                };

                this.worker.onerror = (e) => {
                    console.error("Worker Global Error:", e);
                };
            } catch (e) {
                console.error("Failed to initialize worker:", e);
            }
        }
    }

    private async bitmapToBlobUrl(bitmap: ImageBitmap): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context failed");
        
        ctx.drawImage(bitmap, 0, 0);
        
        // Clean up bitmap to avoid memory leaks immediately
        bitmap.close(); 
        
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) reject(new Error("Blob creation failed"));
                else resolve(URL.createObjectURL(blob));
            }, 'image/png');
        });
    }

    private async base64ToBitmap(base64: string): Promise<ImageBitmap> {
        const res = await fetch(base64);
        const blob = await res.blob();
        return createImageBitmap(blob);
    }

    public async upscale(base64Image: string): Promise<string> {
        this.initWorker();
        
        if (!this.worker) {
            throw new Error("Upscaler worker failed to initialize");
        }

        const id = Date.now().toString() + Math.random().toString();
        const bitmap = await this.base64ToBitmap(base64Image);

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            
            // Transfer the bitmap to the worker (zero-copy)
            this.worker!.postMessage({ id, type: 'UPSCALE', image: bitmap }, [bitmap]);
        });
    }
    
    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        if (this.workerUrl) {
            URL.revokeObjectURL(this.workerUrl);
            this.workerUrl = null;
        }
    }
}

export const upscalerService = new UpscalerService();
