import pdfplumber
from pathlib import Path
from typing import List, Dict, Optional
import json

class PDFExtractor:
    """Extract text from PDF files"""
    
    # Minimum character threshold to consider a page as having meaningful text
    MIN_TEXT_LENGTH = 50
    
    @staticmethod
    def _is_image_only_page(page, text: Optional[str]) -> bool:
        """Check if a page is image-only (no meaningful text content)"""
        if not text:
            return True
        
        # Strip whitespace and check length
        stripped_text = text.strip()
        if len(stripped_text) < PDFExtractor.MIN_TEXT_LENGTH:
            # Check if page has images
            images = page.images if hasattr(page, 'images') else []
            if images:
                return True
        
        return False
    
    @staticmethod
    def extract_text_from_pdf(pdf_path: Path) -> List[Dict]:
        """Extract text from PDF using pdfplumber, skipping image-only pages"""
        text_content = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    # Skip image-only pages
                    if PDFExtractor._is_image_only_page(page, text):
                        continue
                    if text:
                        text_content.append({
                            'page': i + 1,
                            'content': text,
                            'file': pdf_path.name
                        })
        except Exception as e:
            raise Exception(f"Error processing {pdf_path.name}: {e}")
        
        return text_content
    
    @staticmethod
    def extract_text_from_bytes(pdf_bytes: bytes, filename: str) -> List[Dict]:
        """Extract text from PDF bytes, skipping image-only pages"""
        import io
        text_content = []
        
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    # Skip image-only pages
                    if PDFExtractor._is_image_only_page(page, text):
                        continue
                    if text:
                        text_content.append({
                            'page': i + 1,
                            'content': text,
                            'file': filename
                        })
        except Exception as e:
            raise Exception(f"Error processing {filename}: {e}")
        
        return text_content
    
    @staticmethod
    def combine_pages(pages: List[Dict]) -> str:
        """Combine all pages into a single text"""
        return "\n\n".join([page['content'] for page in pages])