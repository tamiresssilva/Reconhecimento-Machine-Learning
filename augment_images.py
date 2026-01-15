import os
import cv2
import numpy as np
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import random

class ImageAugmenter:
    """Aumenta dataset através de transformações de imagem"""
    
    def __init__(self, input_dir, output_dir, images_per_original=20):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.images_per_original = images_per_original
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def rotate(self, img, angle):
        """Rotaciona a imagem"""
        return img.rotate(angle, expand=False, fillcolor='white')
    
    def flip(self, img, direction='horizontal'):
        """Espelha a imagem"""
        if direction == 'horizontal':
            return ImageOps.mirror(img)
        return ImageOps.flip(img)
    
    def brightness(self, img, factor):
        """Ajusta brilho"""
        enhancer = ImageEnhance.Brightness(img)
        return enhancer.enhance(factor)
    
    def contrast(self, img, factor):
        """Ajusta contraste"""
        enhancer = ImageEnhance.Contrast(img)
        return enhancer.enhance(factor)
    
    def saturation(self, img, factor):
        """Ajusta saturação"""
        enhancer = ImageEnhance.Color(img)
        return enhancer.enhance(factor)
    
    def sharpness(self, img, factor):
        """Ajusta nitidez"""
        enhancer = ImageEnhance.Sharpness(img)
        return enhancer.enhance(factor)
    
    def zoom(self, img, factor):
        """Faz zoom na imagem"""
        width, height = img.size
        new_size = (int(width * factor), int(height * factor))
        img_zoomed = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Centralizar
        left = (new_size[0] - width) // 2
        top = (new_size[1] - height) // 2
        right = left + width
        bottom = top + height
        
        return img_zoomed.crop((left, top, right, bottom))
    
    def shift(self, img, x, y):
        """Desloca a imagem"""
        return img.transform(img.size, Image.AFFINE, (1, 0, x, 0, 1, y), Image.BICUBIC)
    
    def augment_image(self, img_path, category):
        """Gera múltiplas versões aumentadas de uma imagem"""
        try:
            img = Image.open(img_path).convert('RGB')
            original_name = Path(img_path).stem
            
            augmented_images = [img]  # Incluir original
            
            # Rotações
            for angle in [-25, -15, -5, 5, 15, 25]:
                augmented_images.append(self.rotate(img, angle))
            
            # Espelhamentos
            augmented_images.append(self.flip(img, 'horizontal'))
            augmented_images.append(self.flip(img, 'vertical'))
            
            # Brilho
            for factor in [0.7, 0.85, 1.15, 1.3]:
                augmented_images.append(self.brightness(img, factor))
            
            # Contraste
            for factor in [0.7, 0.85, 1.15, 1.3]:
                augmented_images.append(self.contrast(img, factor))
            
            # Saturação
            for factor in [0.5, 0.8, 1.2, 1.5]:
                augmented_images.append(self.saturation(img, factor))
            
            # Zoom
            for factor in [0.8, 0.9, 1.1, 1.2]:
                augmented_images.append(self.zoom(img, factor))
            
            # Deslocamento
            for dx, dy in [(-10, -10), (-10, 10), (10, -10), (10, 10)]:
                augmented_images.append(self.shift(img, dx, dy))
            
            # Salvar imagens
            category_dir = self.output_dir / category
            category_dir.mkdir(exist_ok=True)
            
            saved_count = 0
            for idx, aug_img in enumerate(augmented_images[:self.images_per_original]):
                filename = f"{original_name}_aug_{idx}.jpg"
                filepath = category_dir / filename
                aug_img.save(filepath, 'JPEG', quality=90)
                saved_count += 1
            
            return saved_count
            
        except Exception as e:
            print(f"✗ Erro ao aumentar {img_path}: {e}")
            return 0
    
    def augment_directory(self):
        """Aumenta todas as imagens no diretório"""
        print("🔄 Iniciando aumento de imagens (data augmentation)...\n")
        
        total_generated = 0
        
        for category_dir in self.input_dir.iterdir():
            if not category_dir.is_dir():
                continue
            
            category = category_dir.name
            print(f"[{category.upper()}]")
            
            for img_file in category_dir.glob("*.jpg"):
                count = self.augment_image(img_file, category)
                total_generated += count
                print(f"  ✓ {img_file.name}: {count} variações geradas")
            
            print()
        
        print(f"✅ Total de imagens geradas: {total_generated}")
        print(f"Salvo em: {self.output_dir}")

def main():
    INPUT_DIR = "data/images"
    OUTPUT_DIR = "data/images_augmented"
    IMAGES_PER_ORIGINAL = 25
    
    if not Path(INPUT_DIR).exists():
        print(f"❌ Diretório {INPUT_DIR} não encontrado!")
        return
    
    augmenter = ImageAugmenter(INPUT_DIR, OUTPUT_DIR, IMAGES_PER_ORIGINAL)
    augmenter.augment_directory()

if __name__ == "__main__":
    main()
