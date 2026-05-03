import whisper
import os
import subprocess

# Add FFmpeg paths to environment
FFMPEG_PATHS = [
    r"C:\Program Files\Softdeluxe\Free Download Manager",
    r"C:\Program Files\Softdeluxe\Free Video To MP3 Converter",
    os.path.expanduser(r"~\AppData\Local\Microsoft\WinGet\Links")
]
for p in FFMPEG_PATHS:
    if os.path.exists(p) and p not in os.environ["PATH"]:
        os.environ["PATH"] += os.pathsep + p

import numpy as np
import wave

# ... (FFMPEG_PATHS check remains)

print("Loading Whisper Model (small.en)... (this might take a minute)")
model = whisper.load_model("small.en")
print("Whisper Model Loaded.")

def calculate_energy(wav_path):
    """Check if the audio has actual sound or is just silence/noise."""
    try:
        with wave.open(wav_path, 'rb') as wf:
            params = wf.getparams()
            frames = wf.readframes(params.nframes)
            audio_data = np.frombuffer(frames, dtype=np.int16)
            if len(audio_data) == 0: return 0
            
            # Cast to float32 to prevent int16 overflow during squaring
            audio_float = audio_data.astype(np.float32)
            energy = np.sqrt(np.mean(audio_float**2))
            return energy
    except:
        return 0

def transcribe_audio(file_path: str, prompt: str = "") -> str:
    print(f"DEBUG: Transcribing {file_path}")
    wav_path = file_path.replace(".webm", ".wav")
    try:
        # 1. Convert to WAV (16kHz mono) with volume boost and noise reduction
        print(f"DEBUG: Converting {file_path} to {wav_path}")
        result = subprocess.run([
            'ffmpeg', '-y', '-i', file_path, 
            '-vn', '-af', 'afftdn=nf=-25,highpass=f=200,lowpass=f=3000,volume=1.5', # Noise reduction + voice bandpass + boost
            '-ar', '16000', '-ac', '1', wav_path
        ], capture_output=True)
        
        if result.returncode != 0:
            print(f"DEBUG: FFmpeg Error: {result.stderr.decode()}")
            return ""

        if os.path.exists(wav_path):
            wav_size = os.path.getsize(wav_path)
            energy = calculate_energy(wav_path)
            print(f"DEBUG: Converted WAV: {wav_size} bytes, Energy: {energy:.2f}")
            
            # If energy is extremely low, it's likely silence
            if energy < 50:
                print("DEBUG: Audio energy too low. Likely silence.")
                return ""
        
        # 2. Transcribe
        # Using small.en for better accuracy, temperature 0 for stability
        enhanced_prompt = f"The student is answering a highly technical university quiz question about IT, cloud computing, programming, and databases. Context: {prompt}"
        transcribe_result = model.transcribe(
            wav_path, 
            fp16=False, 
            language="en",
            temperature=0,
            beam_size=5,
            best_of=5,
            initial_prompt=enhanced_prompt,
            condition_on_previous_text=False
        )
        
        text = transcribe_result["text"].strip()
        
        # Filter out common hallucinations
        hallucinations = ["You", "Thank you.", "Thanks for watching.", "Subtitle by", "you"]
        if text in hallucinations:
            print(f"DEBUG: Filtered hallucination: '{text}'")
            text = ""
            
        print(f"DEBUG: Transcription success: '{text}'")
        
        # Cleanup WAV
        if os.path.exists(wav_path):
            os.remove(wav_path)
            
        return text
    except Exception as e:
        import traceback
        print(f"DEBUG: Transcription Error: {e}")
        traceback.print_exc()
        if os.path.exists(wav_path):
            os.remove(wav_path)
        return ""