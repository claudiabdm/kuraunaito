import type { ExternalImageService, ImageTransform, AstroConfig, ImageOutputFormat } from "astro";
import { getSize } from "./src/utils/functions";
import { baseService } from "astro/assets";

const FILTERS = [
    'quality',
    'fill',
    'focal',
    'grayscale',
    'blur',
    'rotate',
    'brightness',
    'round-corner',
] as const
interface StoryblokImageTransform extends ImageTransform {
    smart?: boolean, // https://www.storyblok.com/docs/image-service#facial-detection-and-smart-cropping
    'fit-in'?: boolean, // https://www.storyblok.com/docs/image-service#fit-in
    quality?: number, // 0-100 https://www.storyblok.com/docs/image-service#quality-optimization
    fill?: string, // #hexadecimal RGB expression (without the # character)
    focal?: string, // https://www.storyblok.com/docs/image-service#custom-focal-point,
    grayscale?: boolean, // https://www.storyblok.com/docs/image-service#grayscale
    blur?: number, // https://www.storyblok.com/docs/image-service#blur
    rotate?: number, // https://www.storyblok.com/docs/image-service#rotation
    brightness?: number, // https://www.storyblok.com/docs/image-service#brightness
    'round-corner'?: string, // https://www.storyblok.com/docs/image-service#rounded-corners
}

const service: ExternalImageService = {
    ...baseService,
    validateOptions(options: StoryblokImageTransform) {
        const originalSrc = typeof options.src === 'string' ? options.src : options.src.src;
        const width = Math.ceil(options.width ?? getSize(originalSrc).width);
        const height = Math.ceil(options.height ?? getSize(originalSrc).height);
        const filters: Pick<StoryblokImageTransform, typeof FILTERS[number]> = FILTERS.reduce((acc, filterKey) => {
            if (filterKey in options) {
                acc[filterKey] = options[filterKey];
            }
            return acc;
        }, {});
        return { ...options, width, height, filters };
    },
    getURL(options: StoryblokImageTransform) {
        const format = `format(${options.format ?? 'webp'})`;
        let url = `${options.src}/m/${options.width ?? 0}x${options.height ?? 0}/filters:${format}`;
        if (Object.keys(options.filters).length > 0) {
            const filters = Object.entries(options.filters).reduce((acc, [key, value]) => {
                acc.push(`${key}(${value})`);
                return acc;
            }, [] as string[]).join(':');
            url = url.concat(`:${filters}`);
        }
        return url;
    },
    getHTMLAttributes(options: StoryblokImageTransform) {
        const { src, format, quality, ...attributes } = options;
        return {
            ...attributes
        };
    }
};



export default service;