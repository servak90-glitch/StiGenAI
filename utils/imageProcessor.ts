
import { StickerShape } from '../types';

export interface ProcessingOptions {
    removeBackground: boolean;
    addCutLine: boolean;
    cutLineColor?: string;
    cutLineThickness?: number;
    threshold?: number;
    stickerShape?: StickerShape; 
    tolerance?: number;
    hardenEdges?: boolean;
    outlineColor?: string;
    aiOutlineConfig?: { config: any, blur: number };
}

export const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    if (blobUrl.startsWith('data:')) return blobUrl;
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const WORKER_CODE = `
import ImageTracer from 'https://esm.sh/imagetracerjs@1.2.6';

const createSubjectMask = (ctx, width, height, tolerance) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const isBackground = new Uint8Array(width * height);

    const matches = (r1, g1, b1, r2, g2, b2) => {
        const dist = Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
        return dist < tolerance;
    };

    const runFloodFill = (startX, startY) => {
        const startIdx = startY * width + startX;
        if (isBackground[startIdx] === 1) return;

        const offset = startIdx * 4;
        const bgR = data[offset];
        const bgG = data[offset + 1];
        const bgB = data[offset + 2];
        const bgA = data[offset + 3];

        const stack = [startIdx];
        isBackground[startIdx] = 1;

        while (stack.length > 0) {
            const idx = stack.pop();
            const x = idx % width;
            const y = Math.floor(idx / width);

            const neighbors = [idx + 1, idx - 1, idx + width, idx - width];
            const neighborX = [x + 1, x - 1, x, x];

            for (let i = 0; i < 4; i++) {
                const nIdx = neighbors[i];
                if (nIdx >= 0 && nIdx < width * height) {
                    if (i < 2 && neighborX[i] !== nIdx % width) continue;

                    if (isBackground[nIdx] === 0) {
                        const off = nIdx * 4;
                        const r = data[off], g = data[off + 1], b = data[off + 2], a = data[off + 3];
                        
                        if (a < 50) {
                            isBackground[nIdx] = 1;
                            stack.push(nIdx);
                            continue;
                        }

                        if (bgA >= 50 && matches(r, g, b, bgR, bgG, bgB)) {
                            isBackground[nIdx] = 1;
                            stack.push(nIdx);
                        }
                    }
                }
            }
        }
    };

    runFloodFill(0, 0);
    runFloodFill(width - 1, 0);
    runFloodFill(0, height - 1);
    runFloodFill(width - 1, height - 1);

    const maskCanvas = new OffscreenCanvas(width, height);
    const mCtx = maskCanvas.getContext('2d');
    const mData = mCtx.createImageData(width, height);

    for (let i = 0; i < width * height; i++) {
        const alpha = isBackground[i] === 1 ? 0 : 255;
        const offset = i * 4;
        mData.data[offset] = 0; mData.data[offset+1] = 0; mData.data[offset+2] = 0;
        mData.data[offset + 3] = alpha;
    }
    
    mCtx.putImageData(mData, 0, 0);
    return maskCanvas;
};

const traceMaskToPath = (mask, aiConfig) => {
    const blur = aiConfig?.blur ?? 2.0; 
    const temp = new OffscreenCanvas(mask.width, mask.height);
    const tCtx = temp.getContext('2d');
    tCtx.filter = \`blur(\${blur}px)\`;
    tCtx.drawImage(mask, 0, 0);
    const imageData = tCtx.getImageData(0, 0, temp.width, temp.height);
    const options = {
        ltres: aiConfig?.config.ltres ?? 1.0,
        qtres: aiConfig?.config.qtres ?? 1.0,
        pathomit: aiConfig?.config.pathomit ?? 16,
        numberofcolors: 2,
        strokewidth: 0,
        viewbox: true
    };
    const svg = ImageTracer.imagedataToSVG(imageData, options);
    const pathMatch = svg.match(/d="([^"]+)"/);
    return pathMatch ? pathMatch[1] : '';
};

const getBoundingBox = (ctx, width, height) => {
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 10) { 
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < minX) return { x: 0, y: 0, width: 0, height: 0 };
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

async function processSticker(bitmap, options) {
    const { width: origWidth, height: origHeight } = bitmap;
    if (origWidth === 0 || origHeight === 0) throw new Error("Input image has 0 dimensions.");

    // Add padding to prevent edge clipping during mask creation and stroking
    const minDim = Math.min(origWidth, origHeight);
    const prePadding = Math.max(Math.round(minDim * 0.1), 60); // At least 60px padding
    const width = origWidth + prePadding * 2;
    const height = origHeight + prePadding * 2;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill with white background to match the original image's background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, prePadding, prePadding);
    
    const finalCanvas = new OffscreenCanvas(width, height);
    const fCtx = finalCanvas.getContext('2d');
    fCtx.clearRect(0, 0, width, height);

    const tolerance = options.tolerance ?? 40;
    const subjectMask = createSubjectMask(ctx, width, height, tolerance);

    const isolatedSubjectCanvas = new OffscreenCanvas(width, height);
    const isoCtx = isolatedSubjectCanvas.getContext('2d');
    isoCtx.drawImage(canvas, 0, 0);
    isoCtx.globalCompositeOperation = 'destination-in';
    isoCtx.drawImage(subjectMask, 0, 0);

    if (options.addCutLine) {
        const pathString = traceMaskToPath(subjectMask, options.aiOutlineConfig);
        if (pathString) {
            const path2D = new Path2D(pathString);
            const minDimension = Math.min(origWidth, origHeight); // Use original dimensions for thickness calculation
            let whiteThickness = Math.round(minDimension * 0.04);
            whiteThickness = Math.max(16, whiteThickness);
            const blackThickness = whiteThickness * 1.25;

            fCtx.save();
            fCtx.strokeStyle = '#000000';
            fCtx.lineWidth = blackThickness;
            fCtx.lineJoin = 'round';
            fCtx.lineCap = 'round';
            fCtx.stroke(path2D);
            fCtx.restore();

            fCtx.save();
            fCtx.strokeStyle = '#FFFFFF';
            fCtx.lineWidth = whiteThickness;
            fCtx.lineJoin = 'round';
            fCtx.lineCap = 'round';
            fCtx.stroke(path2D);
            fCtx.fillStyle = '#FFFFFF';
            fCtx.fill(path2D); 
            fCtx.restore();
        }
    }

    if (options.addCutLine || options.removeBackground) {
        fCtx.drawImage(isolatedSubjectCanvas, 0, 0);
    } else {
        fCtx.drawImage(bitmap, 0, 0);
    }

    if (options.stickerShape && options.stickerShape !== 'NONE') {
        const shapeCanvas = new OffscreenCanvas(width, height);
        const shCtx = shapeCanvas.getContext('2d');
        shCtx.fillStyle = 'black';
        shCtx.beginPath();
        if (options.stickerShape === 'CIRCLE') {
            shCtx.arc(width/2, height/2, Math.min(origWidth, origHeight)/2 - 10, 0, Math.PI*2);
        } else if (options.stickerShape === 'SQUARE') {
            shCtx.rect(prePadding + 10, prePadding + 10, origWidth-20, origHeight-20);
        } else if (options.stickerShape === 'TRIANGLE') {
            shCtx.moveTo(width / 2, prePadding + 10);
            shCtx.lineTo(width - prePadding - 10, height - prePadding - 10);
            shCtx.lineTo(prePadding + 10, height - prePadding - 10);
            shCtx.closePath();
        } else if (options.stickerShape === 'OCTAHEDRON') {
            const size = Math.min(origWidth, origHeight);
            const inset = size * 0.15;
            const cx = width / 2;
            const cy = height / 2;
            const halfSize = size / 2;
            shCtx.moveTo(cx - halfSize + inset, cy - halfSize);
            shCtx.lineTo(cx + halfSize - inset, cy - halfSize);
            shCtx.lineTo(cx + halfSize, cy - halfSize + inset);
            shCtx.lineTo(cx + halfSize, cy + halfSize - inset);
            shCtx.lineTo(cx + halfSize - inset, cy + halfSize);
            shCtx.lineTo(cx - halfSize + inset, cy + halfSize);
            shCtx.lineTo(cx - halfSize, cy + halfSize - inset);
            shCtx.lineTo(cx - halfSize, cy - halfSize + inset);
            shCtx.closePath();
        }
        shCtx.fill();

        const cropFinal = new OffscreenCanvas(width, height);
        const cfCtx = cropFinal.getContext('2d');
        cfCtx.drawImage(finalCanvas, 0, 0);
        cfCtx.globalCompositeOperation = 'destination-in';
        cfCtx.drawImage(shapeCanvas, 0, 0);
        
        // Crop back to original dimensions
        const resultCanvas = new OffscreenCanvas(origWidth, origHeight);
        resultCanvas.getContext('2d').drawImage(cropFinal, prePadding, prePadding, origWidth, origHeight, 0, 0, origWidth, origHeight);
        return resultCanvas.transferToImageBitmap();
    }

    if (options.removeBackground || options.addCutLine) {
        const bbox = getBoundingBox(fCtx, width, height);
        if (bbox.width > 0 && bbox.height > 0) {
            const padding = 20;
            const newW = bbox.width + padding * 2;
            const newH = bbox.height + padding * 2;
            if (newW > 0 && newH > 0) {
                const cropCanvas = new OffscreenCanvas(newW, newH);
                const cCtx = cropCanvas.getContext('2d');
                cCtx.drawImage(finalCanvas, bbox.x, bbox.y, bbox.width, bbox.height, padding, padding, bbox.width, bbox.height);
                return cropCanvas.transferToImageBitmap();
            }
        }
    }
    const resultCanvas = new OffscreenCanvas(origWidth, origHeight);
    resultCanvas.getContext('2d').drawImage(finalCanvas, prePadding, prePadding, origWidth, origHeight, 0, 0, origWidth, origHeight);
    return resultCanvas.transferToImageBitmap();
}

self.onmessage = async (e) => {
    const { id, type, image, options } = e.data;
    try {
        if (type === 'PROCESS_STICKER') {
            const resultBitmap = await processSticker(image, options);
            self.postMessage({ id, success: true, image: resultBitmap }, [resultBitmap]);
        } 
        else if (type === 'HUE_ROTATE') {
             if (image.width === 0 || image.height === 0) throw new Error("Image 0x0");
             const canvas = new OffscreenCanvas(image.width, image.height);
             const ctx = canvas.getContext('2d');
             ctx.filter = \`hue-rotate(\${options.degrees}deg)\`;
             ctx.drawImage(image, 0, 0);
             const res = canvas.transferToImageBitmap();
             self.postMessage({ id, success: true, image: res }, [res]);
        }
        else if (type === 'GET_BRIGHTNESS') {
            const canvas = new OffscreenCanvas(64, 64);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, 64, 64);
            const data = ctx.getImageData(0, 0, 64, 64).data;
            let total = 0;
            for (let i = 0; i < data.length; i += 4) {
                total += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            }
            const brightness = total / (64 * 64);
            self.postMessage({ id, success: true, brightness });
        }
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
    }
};
`;

class ImageProcessorService {
    private worker: Worker | null = null;
    private workerUrl: string | null = null;
    private pendingRequests = new Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>();

    private initWorker() {
        if (!this.worker) {
            try {
                const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
                this.workerUrl = URL.createObjectURL(blob);
                this.worker = new Worker(this.workerUrl, { type: 'module' });
                this.worker.onmessage = (e) => {
                    const { id, success, image, brightness, error } = e.data;
                    const req = this.pendingRequests.get(id);
                    if (req) {
                        this.pendingRequests.delete(id);
                        if (success) {
                            if (brightness !== undefined) {
                                req.resolve(brightness);
                            } else {
                                // image is ImageBitmap
                                this.bitmapToBlobUrl(image).then(req.resolve).catch(err => req.reject(new Error("Failed to convert result: " + err.message)));
                            }
                        } else {
                            req.reject(new Error(error));
                        }
                    }
                };
            } catch (e) {
                console.error("Failed to init worker", e);
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
                if (blob) resolve(URL.createObjectURL(blob));
                else reject(new Error("Blob creation failed"));
            }, 'image/png');
        });
    }

    private async base64ToBitmap(base64: string): Promise<ImageBitmap> {
        const res = await fetch(base64);
        const blob = await res.blob();
        return createImageBitmap(blob);
    }

    private async runWorkerTask(type: string, imageBase64: string, options: any = {}): Promise<any> {
        this.initWorker();
        if (!this.worker) throw new Error("Worker not initialized");
        const id = Math.random().toString(36).substring(7);
        const bitmap = await this.base64ToBitmap(imageBase64);
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.worker!.postMessage({ id, type, image: bitmap, options }, [bitmap]);
        });
    }

    public async processSticker(imageBase64: string, options: ProcessingOptions): Promise<string> {
        return this.runWorkerTask('PROCESS_STICKER', imageBase64, options);
    }

    public async applyHueRotation(imageBase64: string, degrees: number): Promise<string> {
        return this.runWorkerTask('HUE_ROTATE', imageBase64, { degrees });
    }

    public async getAverageBrightness(imageBase64: string): Promise<number> {
        return this.runWorkerTask('GET_BRIGHTNESS', imageBase64);
    }
}

const processorService = new ImageProcessorService();

export const processStickerImage = (img: string, options: ProcessingOptions) => processorService.processSticker(img, options);
export const applyHueRotation = (img: string, degrees: number) => processorService.applyHueRotation(img, degrees);
export const getAverageBrightness = (img: string) => processorService.getAverageBrightness(img);
export const removeBackgroundClean = (img: string) => processorService.processSticker(img, { removeBackground: true, addCutLine: false });
