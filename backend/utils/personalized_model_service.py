"""
Personalized Model Service for Question Generation

This service loads LoRA-adapted models for personalized question generation
based on specific course materials (DL, DA, IME).
"""

import torch
from pathlib import Path
from typing import Optional, Dict, List
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

class PersonalizedModelService:
    """Service for generating questions using personalized LoRA models"""
    
    def __init__(self):
        self.models: Dict[str, any] = {}
        self.tokenizers: Dict[str, any] = {}
        self.base_model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.models_dir = Path(__file__).parent.parent.parent / "models"
        
    def _get_model_path(self, subject: str) -> Optional[Path]:
        """Get the path to a subject's model"""
        possible_paths = [
            self.models_dir / f"{subject}_personalized_lora" / "final",
            self.models_dir / f"{subject}_papers_lora_final",
            self.models_dir / f"{subject}_papers_lora",
        ]
        
        for path in possible_paths:
            if path.exists() and (path / "adapter_config.json").exists():
                return path
        
        return None
    
    def load_model(self, subject: str) -> bool:
        """Load a personalized model for a specific subject"""
        if subject in self.models:
            return True  # Already loaded
        
        model_path = self._get_model_path(subject)
        if not model_path:
            print(f"No model found for subject: {subject}")
            return False
        
        try:
            print(f"Loading model for {subject} from {model_path}...")
            
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(str(model_path))
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # Load base model
            if self.device == "cuda":
                base_model = AutoModelForCausalLM.from_pretrained(
                    self.base_model_name,
                    torch_dtype=torch.float16,
                    device_map="auto"
                )
            else:
                base_model = AutoModelForCausalLM.from_pretrained(
                    self.base_model_name,
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=True
                )
            
            # Load LoRA adapter
            model = PeftModel.from_pretrained(base_model, str(model_path))
            model.eval()
            
            self.models[subject] = model
            self.tokenizers[subject] = tokenizer
            
            print(f"Model loaded successfully for {subject}")
            return True
            
        except Exception as e:
            print(f"Error loading model for {subject}: {e}")
            return False
    
    def generate_questions(
        self,
        content: str,
        subject: str,
        num_questions: int = 5,
        question_type: str = "mixed",
        max_new_tokens: int = 500
    ) -> Dict:
        """Generate questions using the personalized model"""
        
        # Load model if not already loaded
        if not self.load_model(subject):
            return {
                "success": False,
                "error": f"Could not load model for subject: {subject}",
                "questions": []
            }
        
        model = self.models[subject]
        tokenizer = self.tokenizers[subject]
        
        # Format prompt based on question type
        if question_type == "mcq":
            instruction = f"Generate {num_questions} multiple choice questions with 4 options each based on the following content."
        elif question_type == "short":
            instruction = f"Generate {num_questions} short answer questions based on the following content."
        elif question_type == "essay":
            instruction = f"Generate {num_questions} essay questions based on the following content."
        else:
            instruction = f"Generate {num_questions} exam questions (mix of MCQ, short answer, and essay) based on the following content."
        
        prompt = f"""### Instruction:
{instruction}

### Input:
{content[:2000]}

### Response:
"""
        
        try:
            # Tokenize
            inputs = tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=512
            )
            
            if self.device == "cuda":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    pad_token_id=tokenizer.pad_token_id,
                    eos_token_id=tokenizer.eos_token_id
                )
            
            # Decode
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract response part
            if "### Response:" in response:
                response = response.split("### Response:")[-1].strip()
            
            # Parse questions from response
            questions = self._parse_questions(response)
            
            return {
                "success": True,
                "questions": questions,
                "raw_response": response,
                "model_used": f"{subject}_personalized"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "questions": []
            }
    
    def _parse_questions(self, response: str) -> List[Dict]:
        """Parse generated text into structured questions"""
        questions = []
        lines = response.strip().split('\n')
        
        current_question = None
        current_options = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if it's a numbered question
            if any(line.startswith(f"{i}.") or line.startswith(f"{i})") for i in range(1, 20)):
                # Save previous question
                if current_question:
                    questions.append({
                        "question": current_question,
                        "options": current_options if current_options else None,
                        "type": "mcq" if current_options else "short_answer"
                    })
                
                # Start new question
                current_question = line
                current_options = []
            
            # Check if it's an option (A., B., C., D.)
            elif any(line.startswith(f"{opt}.") or line.startswith(f"{opt})") for opt in "ABCD"):
                current_options.append(line)
        
        # Don't forget last question
        if current_question:
            questions.append({
                "question": current_question,
                "options": current_options if current_options else None,
                "type": "mcq" if current_options else "short_answer"
            })
        
        return questions
    
    def get_available_models(self) -> List[str]:
        """Get list of available subject models"""
        available = []
        for subject in ["dl", "da", "ime"]:
            if self._get_model_path(subject):
                available.append(subject)
        return available
    
    def unload_model(self, subject: str) -> bool:
        """Unload a model to free memory"""
        if subject in self.models:
            del self.models[subject]
            del self.tokenizers[subject]
            if self.device == "cuda":
                torch.cuda.empty_cache()
            return True
        return False
    
    def unload_all(self):
        """Unload all models"""
        self.models.clear()
        self.tokenizers.clear()
        if self.device == "cuda":
            torch.cuda.empty_cache()


# Singleton instance
_personalized_service = None

def get_personalized_service() -> PersonalizedModelService:
    """Get the singleton PersonalizedModelService instance"""
    global _personalized_service
    if _personalized_service is None:
        _personalized_service = PersonalizedModelService()
    return _personalized_service
