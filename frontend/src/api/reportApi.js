import axios from 'axios';

const BASE_URL = "http://localhost:8000";

export const analyzePrompt = async (prompt) => {
  const res = await axios.post(`${BASE_URL}/analyze`, null, {
    params: { prompt }
  });
  return res.data;
};

export const saveReport = async (report) => {
  await axios.post(`${BASE_URL}/save`, report);
};

export const getSavedReports = async () => {
  const res = await axios.get(`${BASE_URL}/saved`);
  return res.data;
};

export const deleteReport = async (id) => {
  await axios.delete(`${BASE_URL}/delete/${id}`);
};
