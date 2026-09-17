import axios from 'axios';

const closetSpaceComicsApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
});

export default closetSpaceComicsApi;
