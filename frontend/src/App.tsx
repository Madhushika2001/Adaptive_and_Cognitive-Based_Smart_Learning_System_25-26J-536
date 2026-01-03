import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import GeneratePage from './pages/GeneratePage';
import ModelPaperPage from './pages/ModelPaperPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import ModelPaperSetupPage from './pages/ModelPaperSetupPage';
// Pages (WITHOUT layout)
import ModelPaperExamPage from "./pages/ModelPaperExamPage";
import ModelPaperResultsPage from './pages/ModelPaperResultsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/model-paper/:slug/paper" element={<ModelPaperExamPage />}/>
        <Route path="/*" element={
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/model-paper" element={<ModelPaperPage />} />
          <Route path="/model-paper/:slug" element={<ModelPaperSetupPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/model-paper/:slug/results" element={<ModelPaperResultsPage />} />
        </Routes>
      </Layout>
          }/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
