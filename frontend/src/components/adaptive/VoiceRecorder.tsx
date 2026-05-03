import { useState, useRef } from 'react';
import { Mic, Square, Loader } from 'lucide-react';
import { submitAudio } from '../../api/adaptiveApi';

interface VoiceResult {
    transcription?: string;
    is_correct?: boolean;
    error?: boolean;
    message?: string;
}

interface VoiceRecorderProps {
    expectedAnswer: string;
    correctOptionKey: string;
    onResult: (result: VoiceResult) => void;
}

const VoiceRecorder = ({ expectedAnswer, correctOptionKey, onResult }: VoiceRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);

    const startRecording = async () => {
        setValidationError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Explicitly use opus for better quality and gemini compatibility
            const mimeType = 'audio/webm;codecs=opus';
            const options = { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined };

            mediaRecorderRef.current = new MediaRecorder(stream, options);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = handleStop;
            // Record in 100ms chunks to be more robust
            recordingStartTimeRef.current = Date.now();
            mediaRecorderRef.current.start(100);
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone access denied or failed', err);
            alert('Please allow microphone access to use voice answering.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            const duration = Date.now() - recordingStartTimeRef.current;
            
            if (duration < 2000) {
                // Cancel recording
                mediaRecorderRef.current.onstop = null; // Prevent handleStop from firing
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
                setValidationError("Recording too short! Please speak for at least 2 seconds.");
                return;
            }

            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
    };

    const handleStop = async () => {
        setIsProcessing(true);
        // Ensure we use the same mimeType as the recorder
        const actualMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });

        try {
            const result = await submitAudio(audioBlob, expectedAnswer, correctOptionKey);
            onResult(result);
        } catch (err) {
            console.error('Failed to submit audio', err);
            onResult({ error: true, message: 'Failed to process audio.' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!navigator.mediaDevices || !window.MediaRecorder) {
        return (
            <div className="flex flex-col items-center mt-6 p-8 bg-gradient-to-br from-red-50/50 to-orange-50/50 rounded-3xl border border-red-100/50 shadow-inner">
                <p className="text-red-600 font-bold">Your browser does not support audio recording.</p>
                <p className="text-sm text-red-500 mt-2">Please try using a modern browser like Chrome or Edge.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center mt-6 p-8 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-3xl border border-indigo-100/50 shadow-inner relative overflow-hidden group">
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>

            <div className="relative z-10 flex flex-col items-center">
                {validationError && (
                    <div className="mb-4 bg-red-100/90 text-red-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-red-200 animate-in fade-in slide-in-from-bottom-2 text-center">
                        ⚠️ {validationError}
                    </div>
                )}
                <p className="text-sm text-indigo-900/60 mb-5 font-bold tracking-widest uppercase">Select to speak</p>

                {!isRecording && !isProcessing && (
                    <button
                        onClick={startRecording}
                        className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_25px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.4)]"
                    >
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 scale-110 group-hover:scale-125 transition-transform duration-500 opacity-50 group-hover:opacity-0"></div>
                        <Mic className="w-8 h-8" />
                    </button>
                )}

                {isRecording && (
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30 scale-150"></div>
                        <div className="absolute inset-0 bg-red-400 rounded-full animate-pulse opacity-40 scale-125"></div>
                        <button
                            onClick={stopRecording}
                            className="relative z-10 flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-full font-semibold transition-all shadow-[0_8px_25px_rgba(239,68,68,0.4)] hover:shadow-lg hover:scale-105 active:scale-95"
                        >
                            <Square className="w-6 h-6 fill-current" />
                        </button>
                    </div>
                )}

                {isProcessing && (
                    <div className="flex flex-col items-center gap-3 text-indigo-600 font-bold bg-white/80 backdrop-blur px-8 py-5 rounded-2xl shadow-sm border border-indigo-100">
                        <Loader className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="animate-pulse tracking-wide uppercase text-sm">Processing Audio...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceRecorder;
