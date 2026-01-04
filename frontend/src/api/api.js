import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export const fetchModules = () =>
  axios.get(`${BASE_URL}/modules`);

export const fetchLectures = (module) =>
  axios.get(`${BASE_URL}/lectures/${module}`);

export const fetchTopics = (module, lecture) =>
  axios.get(`${BASE_URL}/topics/${module}/${lecture}`);
