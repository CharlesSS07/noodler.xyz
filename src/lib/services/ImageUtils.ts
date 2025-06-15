import Jimp from 'jimp';

/**
 * Utility functions for working with JIMP images in the context of AI inference
 */

export class ImageUtils {
  /**
   * Convert a File object to a JIMP image
   */
  static async fileToJimp(file: File): Promise<Jimp> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const buffer = Buffer.from(e.target.result as ArrayBuffer);
            const image = await Jimp.read(buffer);
            resolve(image);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Convert a JIMP image to a File object
   */
  static async jimpToFile(image: Jimp, filename: string = 'image.png', mimeType: string = Jimp.MIME_PNG): Promise<File> {
    const buffer = await image.getBufferAsync(mimeType);
    return new File([buffer], filename, { type: mimeType });
  }

  /**
   * Convert a JIMP image to a data URL
   */
  static async jimpToDataUrl(image: Jimp, mimeType: string = Jimp.MIME_PNG): Promise<string> {
    const buffer = await image.getBufferAsync(mimeType);
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Convert a data URL to a JIMP image
   */
  static async dataUrlToJimp(dataUrl: string): Promise<Jimp> {
    const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    return await Jimp.read(buffer);
  }

  /**
   * Convert an HTML Canvas to a JIMP image
   */
  static async canvasToJimp(canvas: HTMLCanvasElement): Promise<Jimp> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const image = await Jimp.read(buffer);
            resolve(image);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      });
    });
  }

  /**
   * Convert a JIMP image to an HTML Canvas
   */
  static async jimpToCanvas(image: Jimp): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = image.getWidth();
    canvas.height = image.getHeight();

    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    const blob = new Blob([buffer], { type: Jimp.MIME_PNG });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }

  /**
   * Resize image while maintaining aspect ratio
   */
  static async resizeIfTooLarge(image: Jimp, maxWidth: number = 512, maxHeight: number = 512): Promise<Jimp> {
    const cloned = image.clone();
    
    // Calculate new dimensions while maintaining aspect ratio
    const { width, height } = cloned.bitmap;
    const aspectRatio = width / height;
    
    let newWidth = width;
    let newHeight = height;
    
    if (width > maxWidth || height > maxHeight) {
      if (aspectRatio > 1) {
        // Landscape
        newWidth = maxWidth;
        newHeight = Math.round(maxWidth / aspectRatio);
      } else {
        // Portrait or square
        newHeight = maxHeight;
        newWidth = Math.round(maxHeight * aspectRatio);
      }
    }
    
    return cloned.resize(newWidth, newHeight);
  }

  /**
   * Convert image to standard format for AI processing
   */
  static async standardizeForAI(image: Jimp): Promise<Jimp> {
    return image
      .clone()
      .quality(90) // Good quality while reducing file size
      .background(0xFFFFFFFF); // White background for transparency
  }

  /**
   * Create a thumbnail version of the image
   */
  static async createThumbnail(image: Jimp, size: number = 150): Promise<Jimp> {
    return image.clone().cover(size, size);
  }

  /**
   * Extract image metadata
   */
  static getImageInfo(image: Jimp): {
    width: number;
    height: number;
    hasAlpha: boolean;
    colorType: string;
  } {
    return {
      width: image.getWidth(),
      height: image.getHeight(),
      hasAlpha: image.hasAlpha(),
      colorType: image.getColorType()
    };
  }

  /**
   * Validate image for AI processing
   */
  static validateImageForAI(image: Jimp): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const width = image.getWidth();
    const height = image.getHeight();
    
    // Check dimensions
    if (width > 2048 || height > 2048) {
      issues.push('Image is very large (>2048px)');
      recommendations.push('Consider resizing to 512-1024px for faster processing');
    }
    
    if (width < 64 || height < 64) {
      issues.push('Image is very small (<64px)');
      recommendations.push('Use higher resolution images for better AI results');
    }
    
    // Check aspect ratio
    const aspectRatio = width / height;
    if (aspectRatio > 3 || aspectRatio < 0.33) {
      issues.push('Extreme aspect ratio may affect AI performance');
      recommendations.push('Consider cropping to a more standard aspect ratio');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}