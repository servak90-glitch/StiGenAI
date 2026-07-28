
const WORKER_CODE = `
import * as tf from 'https://esm.sh/@tensorflow/tfjs@^4.22.0';
import 'https://esm.sh/@tensorflow/tfjs-backend-webgl@^4.22.0';
import 'https://esm.sh/@tensorflow/tfjs-backend-cpu@^4.22.0';

const LOCAL_MODEL_PATH = '/models/model.json';
const CDN_MODEL_PATH = 'https://unpkg.com/@upscalerjs/default-model@1.0.0-beta.17/models/model.json';
const TILE_SIZE = 128;
const PADDING = 16;

let model = null;
let isInitialized = false;

// Initialize TensorFlow backend and model
async function init(baseUrl) {
    if (isInitialized) return;

    try {
        // Try WebGL backend first as it is stable in workers
        try {
            await tf.setBackend('webgl');
            await tf.ready();
            console.log("Worker: WebGL backend active 🚀");
        } catch (gpuError) {
            console.warn("Worker: WebGL failed, falling back to CPU", gpuError);
            try {
                await tf.setBackend('cpu');
                await tf.ready();
                console.log("Worker: CPU backend active ⚙️");
            } catch (cpuError) {
                console.warn("Worker: CPU backend failed", cpuError);
            }
        }

        // Load the model: try local first, then CDN
        const localUrl = (baseUrl || '') + LOCAL_MODEL_PATH;
        try {
            console.log("Worker: Attempting local model load from", localUrl);
            model = await tf.loadLayersModel(localUrl);
            console.log("Worker: Local model loaded successfully! 🎯");
        } catch (localErr) {
            console.warn("Worker: Local model load failed, falling back to CDN:", localErr);
            model = await tf.loadLayersModel(CDN_MODEL_PATH);
            console.log("Worker: CDN model loaded successfully!");
        }
        
        if (model) {
            const dummy = tf.zeros([1, 32, 32, 3]);
            model.predict(dummy);
            dummy.dispose();
            isInitialized = true;
            console.log("Worker: Model initialized");
        } else {
            throw new Error("Could not load neural network weights");
        }
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

    const scale = 2; 

    const outW = Math.round(inW * scale);
    const outH = Math.round(inH * scale);
    
    if (outW === 0 || outH === 0) throw new Error("Output would be 0 dimension");

    const srcCanvas = new OffscreenCanvas(inW, inH);
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.drawImage(source, 0, 0);

    const outputCanvas = new OffscreenCanvas(outW, outH);
    const outCtx = outputCanvas.getContext('2d');
    if (!outCtx) throw new Error("Output context failed");

    const cols = Math.ceil(inW / TILE_SIZE);
    const rows = Math.ceil(inH / TILE_SIZE);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
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
            
            const outputTensor = tf.tidy(() => {
                let input = tf.browser.fromPixels(tileData).toFloat().div(255.0);
                input = input.expandDims(0);
                let output = model.predict(input);
                return output.squeeze().clipByValue(0, 1).mul(255.0).toInt();
            });

            const tileOutW = srcW * scale;
            const tileOutH = srcH * scale;

            const tempCanvas = new OffscreenCanvas(tileOutW, tileOutH);
            await tf.browser.toPixels(outputTensor, tempCanvas);
            outputTensor.dispose();

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
    const { id, type, image, baseUrl } = e.data;

    if (type === 'UPSCALE') {
        try {
            await init(baseUrl);
            
            let resultCanvas = await processTiled(image);
            if (!resultCanvas || resultCanvas.width === 0 || resultCanvas.height === 0) {
                 throw new Error("First pass resulted in empty image");
            }
            
            const firstPassBitmap = resultCanvas.transferToImageBitmap();
            const finalCanvas = await processTiled(firstPassBitmap);
            
            if (!finalCanvas || finalCanvas.width === 0 || finalCanvas.height === 0) {
                 throw new Error("Second pass resulted in empty image");
            }
            
            const finalBitmap = finalCanvas.transferToImageBitmap();
            self.postMessage({ id, success: true, image: finalBitmap }, [finalBitmap]);
            
        } catch (error) {
            console.error("Worker Upscale Error:", error);
            self.postMessage({ id, success: false, error: error.message || "Upscale failed" });
        }
    }
};
`;

async function fallbackCanvasUpscale(base64Image: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const w = img.width;
                const h = img.height;
                const canvas = document.createElement('canvas');
                canvas.width = w * 4;
                canvas.height = h * 4;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(base64Image);
                    return;
                }
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                const canvas2x = document.createElement('canvas');
                canvas2x.width = w * 2;
                canvas2x.height = h * 2;
                const ctx2x = canvas2x.getContext('2d');
                if (ctx2x) {
                    ctx2x.imageSmoothingEnabled = true;
                    ctx2x.imageSmoothingQuality = 'high';
                    ctx2x.drawImage(img, 0, 0, w * 2, h * 2);
                    ctx.drawImage(canvas2x, 0, 0, w * 4, h * 4);
                } else {
                    ctx.drawImage(img, 0, 0, w * 4, h * 4);
                }

                canvas.toBlob((blob) => {
                    if (blob) resolve(URL.createObjectURL(blob));
                    else resolve(base64Image);
                }, 'image/png');
            } catch (err) {
                console.warn("Canvas upscale failed, returning original:", err);
                resolve(base64Image);
            }
        };
        img.onerror = () => resolve(base64Image);
        img.src = base64Image;
    });
}

export class UpscalerService {
    private worker: Worker | null = null;
    private pendingRequests = new Map<string, { resolve: (val: string) => void, reject: (err: any) => void }>();
    private workerUrl: string | null = null;

    constructor() {}

    private initWorker() {
        if (!this.worker) {
            try {
                const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
                this.workerUrl = URL.createObjectURL(blob);
                
                this.worker = new Worker(this.workerUrl, { type: 'module' });
                
                this.worker.onmessage = (e) => {
                    const { id, success, image, error } = e.data;
                    const req = this.pendingRequests.get(id);
                    if (req) {
                        this.pendingRequests.delete(id);
                        if (success) {
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
                    for (const req of this.pendingRequests.values()) {
                        req.reject(new Error("Worker thread error"));
                    }
                    this.pendingRequests.clear();
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

        const id = Date.now().toString() + Math.random().toString();
        
        let bitmap: ImageBitmap | null = null;
        try {
            bitmap = await this.base64ToBitmap(base64Image);
        } catch (e) {
            console.warn("Could not create ImageBitmap, falling back to canvas upscale:", e);
            return fallbackCanvasUpscale(base64Image);
        }

        if (!this.worker) {
            return fallbackCanvasUpscale(base64Image);
        }

        return new Promise<string>((resolve, reject) => {
            const timeoutId = setTimeout(async () => {
                if (this.pendingRequests.has(id)) {
                    console.warn("Upscaler worker timed out after 12s, using fallback canvas upscaler.");
                    this.pendingRequests.delete(id);
                    try {
                        const fallbackUrl = await fallbackCanvasUpscale(base64Image);
                        resolve(fallbackUrl);
                    } catch (e) {
                        reject(new Error("Upscale timed out and fallback failed"));
                    }
                }
            }, 12000);

            this.pendingRequests.set(id, {
                resolve: (val) => {
                    clearTimeout(timeoutId);
                    resolve(val);
                },
                reject: async (err) => {
                    clearTimeout(timeoutId);
                    console.warn("Worker error, running canvas fallback upscale:", err);
                    try {
                        const fallbackUrl = await fallbackCanvasUpscale(base64Image);
                        resolve(fallbackUrl);
                    } catch (e) {
                        reject(err);
                    }
                }
            });

            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            this.worker!.postMessage({ id, type: 'UPSCALE', image: bitmap, baseUrl: origin }, [bitmap]);
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

