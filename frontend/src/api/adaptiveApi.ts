import axios from 'axios';

// Points to the base project's unified backend (port 8000), adaptive prefix
const API_BASE_URL = 'http://localhost:8000/api/adaptive';

export const getModules = async () => {
    const response = await axios.get(`${API_BASE_URL}/modules`);
    return response.data;
};

export const getLectures = async (module: string) => {
    const response = await axios.get(`${API_BASE_URL}/lectures/${module}`);
    return response.data;
};

export const getTopics = async (module: string, lecture: string) => {
    const response = await axios.get(
        `${API_BASE_URL}/topics/${encodeURIComponent(module)}/${encodeURIComponent(lecture)}`
    );
    return response.data;
};

export const generateMcq = async (module: string, lecture: string, topic: string) => {
    const response = await axios.get(
        `${API_BASE_URL}/generate-mcq/${encodeURIComponent(module)}/${encodeURIComponent(lecture)}/${encodeURIComponent(topic)}`
    );
    return response.data;
};

export const generateSummary = async (
    module: string,
    lecture: string,
    topic: string,
    userLevel: string,
    signal?: AbortSignal
) => {
    const cacheBuster = new Date().getTime();
    const response = await axios.get(
        `${API_BASE_URL}/generate-summary/${encodeURIComponent(module)}/${encodeURIComponent(lecture)}/${encodeURIComponent(topic)}?user_level=${encodeURIComponent(userLevel)}&_t=${cacheBuster}`,
        { signal }
    );
    return response.data;
};

export const generateMindmap = async (
    module: string,
    lecture: string,
    topic: string,
    userLevel: string,
    signal?: AbortSignal
) => {
    const response = await axios.get(
        `${API_BASE_URL}/generate-mindmap/${encodeURIComponent(module)}/${encodeURIComponent(lecture)}/${encodeURIComponent(topic)}?user_level=${encodeURIComponent(userLevel)}`,
        { signal }
    );
    return response.data;
};

export const generateFlashcards = async (
    module: string,
    lecture: string,
    topic: string,
    userLevel: string,
    signal?: AbortSignal
) => {
    const response = await axios.get(
        `${API_BASE_URL}/generate-flashcards/${encodeURIComponent(module)}/${encodeURIComponent(lecture)}/${encodeURIComponent(topic)}?user_level=${encodeURIComponent(userLevel)}`,
        { signal }
    );
    return response.data;
};

export const predictLevel = async (score: number, timeTaken: number, attempts: number) => {
    const response = await axios.post(
        `${API_BASE_URL}/predict-level?score=${score}&time_taken=${timeTaken}&attempts=${attempts}`
    );
    return response.data;
};

export const submitAudio = async (
    audioBlob: Blob,
    expectedAnswer: string,
    correctOptionKey: string
) => {
    const formData = new FormData();
    formData.append('audio', new File([audioBlob], 'recording.wav', { type: 'audio/wav' }));
    formData.append('expected_answer', expectedAnswer);
    formData.append('correct_option_key', correctOptionKey);

    const response = await axios.post(`${API_BASE_URL}/submit-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const generateFeedback = async (
    module: string,
    lecture: string,
    topic: string,
    quizResults: any[],
    signal?: AbortSignal
) => {
    const response = await axios.post(
        `${API_BASE_URL}/generate-feedback/${encodeURIComponent(module)}/${encodeURIComponent(lecture)}/${encodeURIComponent(topic)}`,
        quizResults,
        { signal }
    );
    return response.data;
};

export const generateStudyPlan = async (
    module: string,
    lecture: string,
    topic: string,
    userLevel: string,
    signal?: AbortSignal
) => {
    const response = await axios.get(
        `${API_BASE_URL}/generate-study-plan/${encodeURIComponent(module)}/${encodeURIComponent(lecture)}/${encodeURIComponent(topic)}?user_level=${encodeURIComponent(userLevel)}`,
        { signal }
    );
    return response.data;
};
