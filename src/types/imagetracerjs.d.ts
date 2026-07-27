declare module 'imagetracerjs' {
    const ImageTracer: {
        imagedataToSVG(imageData: ImageData, options?: Record<string, any>): string;
        imageToSVG(url: string, callback: (svgString: string) => void, options?: Record<string, any>): void;
        [key: string]: any;
    };
    export default ImageTracer;
}
