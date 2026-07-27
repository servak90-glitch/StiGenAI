
import { TracerConfig } from './svgTracer';
import * as vTracerModule from './vtracerLib';

// Types corresponding to VTracer's expected input format
interface VTracerParams {
    canvas_id: string;
    svg_id: string;
    mode: 'spline' | 'polygon' | 'none';
    clustering_mode: 'color' | 'binary';
    hierarchical: 'stacked' | 'cutout';
    corner_threshold: number; // radians
    length_threshold: number;
    max_iterations: number;
    splice_threshold: number; // radians
    filter_speckle: number; // area in pixels
    color_precision: number; // significant bits
    layer_difference: number;
    path_precision: number;
}

class VTracerService {
    private isInitialized = false;
    private module: any = null;

    async init() {
        if (this.isInitialized) return;
        
        try {
            // 1. Use the statically imported module structure
            this.module = vTracerModule;
            
            // 2. Environment Detection
            const isCloudRun = typeof window !== 'undefined' && window.location.hostname.includes('.run.app');
            // 3. Dynamic Version Detection for GCS Fallback
            // Tries to extract "version-XX" from URL to build a valid cloud storage path
            let dynamicGcsPath = '';
            try {
                const currentUrl = window.location.href;
                const versionMatch = currentUrl.match(/(version-\d+)/); 
                if (versionMatch && versionMatch[1]) {
                    const version = versionMatch[1];
                    dynamicGcsPath = `https://storage.googleapis.com/ai-studio-bucket-118372529010-us-west1/services/stigenai/${version}/compiled/public/vtracer/`;
                    console.log(`[VTracer] Detected dynamic version: ${version}, added GCS path candidate.`);
                }
            } catch (e) {
                console.warn("[VTracer] Could not detect dynamic version from URL");
            }

            // 4. SMART PATH STRATEGY
            // We order these by probability of success based on the environment
            const searchDirectories = [];

            if (isCloudRun) {
                // In Cloud Run containers, static files often end up at root or specific mounts
                searchDirectories.push('/vtracer/');        // Absolute path (most likely)
                searchDirectories.push('/public/vtracer/'); // Common misconfiguration
                searchDirectories.push('vtracer/');         // Relative fallback
            } else {
                // Local development
                searchDirectories.push('/vtracer/');
                searchDirectories.push('vtracer/');
            }

            // Fallbacks for everyone
            if (dynamicGcsPath) searchDirectories.push(dynamicGcsPath);
            
            // Last resort: Fixed path to a known working version in GCS (The "Safety Net")
            // This ensures that even if local files are missing, the app works.
            searchDirectories.push('https://storage.googleapis.com/ai-studio-bucket-118372529010-us-west1/services/stigenai/version-44/compiled/public/vtracer/');
            searchDirectories.push('/');

            // 5. Define KNOWN FILENAMES
            const possibleFileNames = [
                'vtracer_bg.wasm',
                'vtracer_webapp_bg.wasm'
            ];

            // 6. Generate all permutations
            const candidates: string[] = [];
            for (const dir of searchDirectories) {
                for (const name of possibleFileNames) {
                    // Handle slash consistency to avoid //vtracer or vtracer//
                    const cleanDir = dir.endsWith('/') ? dir : dir + '/';
                    // Special case for root
                    if (dir === '/' || dir === '') candidates.push('/' + name);
                    else candidates.push(cleanDir + name);
                }
            }

            let response: Response | null = null;
            let successUrl = '';

            console.log(`[VTracer] Searching for WASM in ${candidates.length} locations...`);
            
            // 7. Aggressive Search
            for (const url of candidates) {
                try {
                    // Use a HEAD request first if possible? No, standard fetch is safer for CORS.
                    const res = await fetch(url);
                    
                    // Check for valid response
                    // Cloud Run often returns 404 HTML pages with status 200 if configured as SPA fallback.
                    // We must check content-type or ensure it's not HTML.
                    const contentType = res.headers.get('Content-Type');
                    const isHtml = contentType && contentType.includes('text/html');
                    
                    if (res.ok && !isHtml) {
                        console.log(`[VTracer] ✅ Found WASM at: ${url}`);
                        response = res;
                        successUrl = url;
                        break;
                    }
                } catch (e) {
                    // Silent fail, try next
                }
            }

            if (!response) {
                 console.error(`[VTracer] ❌ Failed to load WASM. Checked:`, candidates);
                 throw new Error(`Could not load vtracer_bg.wasm. App may not function correctly.`);
            }

            // 8. Create Imports
            const imports = {
                "./vtracer_webapp_bg.js": this.module
            };

            // 9. Instantiate WASM (MIME-Type Agnostic)
            let instance;
            try {
                // Try streaming first (fastest)
                if (response.headers.get('Content-Type') === 'application/wasm') {
                    const result = await WebAssembly.instantiateStreaming(response, imports);
                    instance = result.instance;
                } else {
                    throw new Error("Wrong MIME type, forcing ArrayBuffer");
                }
            } catch (e) {
                console.warn("[VTracer] Streaming compile failed or wrong MIME. Falling back to ArrayBuffer load.", e);
                
                // Fallback: ArrayBuffer (Bypasses MIME checks)
                // If body is used, we might need to re-fetch, but usually we just clone or start over.
                // Since we found the URL, we can re-fetch safely if needed, but response might be consumable.
                
                try {
                    let buffer;
                    try {
                        buffer = await response.arrayBuffer();
                    } catch (bufferErr) {
                        // If body used, re-fetch
                        console.log("[VTracer] Re-fetching for ArrayBuffer...");
                        const newRes = await fetch(successUrl);
                        buffer = await newRes.arrayBuffer();
                    }
                    
                    const result = await WebAssembly.instantiate(buffer, imports);
                    instance = result.instance;
                } catch (innerErr) {
                     throw new Error("Failed to instantiate WASM via ArrayBuffer fallback: " + innerErr);
                }
            }
            
            // 10. Inject WASM instance
            if (this.module.__wbg_set_wasm) {
                this.module.__wbg_set_wasm(instance.exports);
            } else {
                throw new Error("VTracer JS missing __wbg_set_wasm export.");
            }
            
            // 11. Start WASM
            if (instance.exports.__wbindgen_start) {
                 // @ts-ignore
                 instance.exports.__wbindgen_start();
            }

            this.isInitialized = true;
            console.log("[VTracer] WASM initialized successfully");
        } catch (e) {
            console.error("[VTracer] Init failed completely.", e);
        }
    }

    private deg2rad(deg: number) {
        return (deg / 180) * 3.141592654;
    }

    private mapConfig(config?: TracerConfig): Partial<VTracerParams> {
        const c = config || {};
        return {
            mode: 'spline',
            clustering_mode: 'color',
            hierarchical: 'stacked', 
            corner_threshold: this.deg2rad(60),
            length_threshold: 2.0, 
            max_iterations: 10,
            splice_threshold: this.deg2rad(45),
            filter_speckle: (c.pathomit !== undefined && c.pathomit > 0) ? Math.max(1, Math.min(8, c.pathomit)) : 4, 
            color_precision: 6,
            layer_difference: 12,
            path_precision: 4
        };
    }

    async trace(imageData: ImageData, config?: TracerConfig): Promise<string> {
        await this.init();
        
        if (!this.isInitialized || !this.module) {
            throw new Error("VTracer not initialized (WASM failed to load). Check console.");
        }

        // --- PRE-PROCESSING ---
        // 1. Padding to avoid edge clipping
        const padding = 32;
        const paddedW = imageData.width + padding * 2;
        const paddedH = imageData.height + padding * 2;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = paddedW;
        tempCanvas.height = paddedH;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!tempCtx) throw new Error("Context failed");
        
        // Create a temporary canvas for the original image data
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = imageData.width;
        imgCanvas.height = imageData.height;
        imgCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

        // Fill white background for uniform WASM processing
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, paddedW, paddedH);
        
        // Draw the image over the white background
        tempCtx.drawImage(imgCanvas, padding, padding);
        
        let finalImageData = tempCtx.getImageData(0, 0, paddedW, paddedH);

        // 2. Blur for smoother vectors (only if blurradius explicitly requested > 0)
        if ((config?.blurradius ?? 0) > 0) {
            tempCtx.putImageData(finalImageData, 0, 0);
            
            const blurCanvas = document.createElement('canvas');
            blurCanvas.width = paddedW;
            blurCanvas.height = paddedH;
            const blurCtx = blurCanvas.getContext('2d', { willReadFrequently: true });
            if (blurCtx) {
                blurCtx.fillStyle = '#FFFFFF';
                blurCtx.fillRect(0, 0, paddedW, paddedH);
                blurCtx.filter = `blur(${config?.blurradius}px)`;
                blurCtx.drawImage(tempCanvas, 0, 0);
                finalImageData = blurCtx.getImageData(0, 0, paddedW, paddedH);
            }
        }

        // --- WASM EXECUTION ---
        const id = Date.now().toString() + Math.random().toString().slice(2, 6);
        const canvasId = `vtracer_canvas_${id}`;
        const svgId = `vtracer_svg_${id}`;

        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.width = paddedW;
        canvas.height = paddedH;
        canvas.style.cssText = `position: absolute; left: -9999px; top: -9999px; width: ${paddedW}px; height: ${paddedH}px; opacity: 0; pointer-events: none;`;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            document.body.removeChild(canvas);
            throw new Error("Could not get temp canvas context");
        }
        ctx.putImageData(finalImageData, 0, 0);

        const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgContainer.id = svgId;
        svgContainer.setAttribute('width', paddedW.toString());
        svgContainer.setAttribute('height', paddedH.toString());
        svgContainer.setAttribute('viewBox', `0 0 ${paddedW} ${paddedH}`);
        svgContainer.style.cssText = `position: absolute; left: -9999px; top: -9999px; width: ${paddedW}px; height: ${paddedH}px; opacity: 0; pointer-events: none;`;
        document.body.appendChild(svgContainer);

        let converter: any = null;

        try {
            await new Promise(r => setTimeout(r, 20));

            const vParams = this.mapConfig(config);
            const fullParams: VTracerParams = {
                canvas_id: canvasId,
                svg_id: svgId,
                mode: 'spline',
                clustering_mode: 'color',
                hierarchical: 'stacked',
                corner_threshold: this.deg2rad(60),
                length_threshold: 2.0,
                max_iterations: 10,
                splice_threshold: this.deg2rad(45),
                filter_speckle: 4, 
                color_precision: 6, 
                layer_difference: 12, 
                path_precision: 4,
                ...vParams
            };

            // Call WASM
            converter = this.module.ColorImageConverter.new_with_string(JSON.stringify(fullParams));
            converter.init(); 

            let done = false;
            const startTime = performance.now();
            const TIMEOUT_MS = 60000; // 60s timeout

            while (!done) {
                if (performance.now() - startTime > TIMEOUT_MS) {
                    console.warn("[VTracer] Timeout reached.");
                    break;
                }
                done = converter.tick();
                if (!done) await new Promise(r => setTimeout(r, 0));
            }
            
            // Clean up temporary DOM attributes before serializing
            svgContainer.removeAttribute('style');
            svgContainer.removeAttribute('id');

            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(svgContainer);
            
            // Clean up white background path safely using DOMParser
            if (typeof DOMParser !== 'undefined' && svgString.includes('<path')) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(svgString, 'image/svg+xml');
                    const paths = Array.from(doc.querySelectorAll('path'));
                    console.log(`[VTracer] Vectorization produced ${paths.length} paths.`);
                    if (paths.length > 1) { // Only remove if there are other vector paths
                        const firstPath = paths[0];
                        const fill = (firstPath.getAttribute('fill') || '').toLowerCase().replace(/\s+/g, '');
                        const style = (firstPath.getAttribute('style') || '').toLowerCase().replace(/\s+/g, '');
                        const isWhite = fill === '#ffffff' || fill === '#fff' || fill === 'rgb(255,255,255)' || fill === 'white' ||
                                        style.includes('fill:#ffffff') || style.includes('fill:rgb(255,255,255)') || style.includes('fill:white');
                        const d = firstPath.getAttribute('d') || '';
                        const isFullBox = d.includes('M 0 0') || d.includes('M0 0') || d.includes('M0,0') || d.length > 50;

                        if (isWhite && isFullBox) {
                            firstPath.remove();
                            svgString = serializer.serializeToString(doc.documentElement);
                        }
                    }
                } catch (e) {
                    console.warn("[VTracer] DOM background cleanup error:", e);
                }
            }
            
            if (svgString.length < 50) {
                 console.warn("[VTracer] Result too small, likely failed.");
                 return "";
            }

            return svgString;
        } catch (e) {
            console.error("[VTracer] Execution failed", e);
            throw e;
        } finally {
            if (converter && converter.free) {
                try { converter.free(); } catch(e) {}
            }
            if (document.body.contains(canvas)) document.body.removeChild(canvas);
            if (document.body.contains(svgContainer)) document.body.removeChild(svgContainer);
        }
    }
}

export const vTracerService = new VTracerService();
