import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, AlertCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { CITYCARE_SAMPLE_TEXT, RETAIL_SAMPLE_TEXT } from '../api/mock/sampleData';

export function NewProjectPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [deadlineWeeks, setDeadlineWeeks] = useState('14');
  const [budgetMin, setBudgetMin] = useState('600000');
  const [budgetMax, setBudgetMax] = useState('1200000');
  const [techStack, setTechStack] = useState('FastAPI, React, TypeScript, PostgreSQL');
  const [notes, setNotes] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleLoadSample = (sampleType: 'citycare' | 'retail') => {
    if (sampleType === 'citycare') {
      setTitle('CityCare Hospitals Appointment Suite');
      setClient('CityCare Hospitals Pvt Ltd');
      setDeadlineWeeks('14');
      setBudgetMin('600000');
      setBudgetMax('1200000');
      setTechStack('FastAPI, React, TypeScript, PostgreSQL, Docker');
      setNotes('Strategic presales intake for hospital omnichannel booking.');
      setPastedText(CITYCARE_SAMPLE_TEXT);
      setMode('paste');
    } else {
      setTitle('QuickBazaar Hybrid Offline POS');
      setClient('QuickBazaar Stores');
      setDeadlineWeeks('8');
      setBudgetMin('200000');
      setBudgetMax('400000');
      setTechStack('React, TypeScript, FastAPI, SQLite');
      setNotes('Vague initial client inquiry with unspecified requirements.');
      setPastedText(RETAIL_SAMPLE_TEXT);
      setMode('paste');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setError('Uploaded file exceeds 5 MB limit.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }
    if (!client.trim()) {
      setError('Client name is required.');
      return;
    }
    const dWeeks = parseInt(deadlineWeeks, 10);
    if (isNaN(dWeeks) || dWeeks <= 0) {
      setError('Deadline must be a positive number of weeks.');
      return;
    }
    const bMin = parseFloat(budgetMin) || 0;
    const bMax = parseFloat(budgetMax) || 0;
    if (bMin > bMax && bMax > 0) {
      setError('Minimum budget cannot exceed maximum budget.');
      return;
    }
    if (mode === 'paste' && (!pastedText || pastedText.trim().length < 200)) {
      setError(`Requirement text is too short (${pastedText.trim().length} chars). Please enter at least 200 characters.`);
      return;
    }
    if (mode === 'file' && !file) {
      setError('Please select a PDF or DOCX requirement file (max 5 MB).');
      return;
    }

    setIsSubmitting(true);
    try {
      setProgressStep('Uploading project intake data...');
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('client', client.trim());
      formData.append('deadline_weeks', dWeeks.toString());
      formData.append('budget_min', bMin.toString());
      formData.append('budget_max', bMax.toString());
      formData.append('tech_stack', techStack.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      if (mode === 'paste') {
        formData.append('pasted_text', pastedText.trim());
      } else if (file) {
        formData.append('file', file);
      }

      // Step 1: Create Project
      const createRes = await apiClient.createProject(formData);
      const projectId = createRes.id;

      // Step 2: Trigger AI Extraction & Feasibility Analysis
      setProgressStep('Extracting requirements & executing deterministic feasibility engine...');
      await apiClient.analyzeProject(projectId);

      setProgressStep('Analysis complete! Redirecting to review...');
      setTimeout(() => {
        navigate(`/projects/${projectId}/review`);
      }, 500);

    } catch (err: any) {
      console.error(err);
      const serverMsg = err?.response?.data?.message || err.message;
      setError(serverMsg || 'Failed to submit and analyze project.');
      setIsSubmitting(false);
      setProgressStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F1B2D]">New Project Intake & Feasibility</h1>
          <p className="text-xs text-slate-500 mt-1">
            Convert client RFP/requirements into structured assessment using responsible AI extraction and deterministic Python rules.
          </p>
        </div>

        {/* Demo Fast Loaders */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold uppercase text-slate-400 mr-1">Demo Reports:</span>
          <button
            type="button"
            onClick={() => handleLoadSample('citycare')}
            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CityCare Hospitals</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('retail')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Retail Shop (Vague)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CityCare Telehealth Portal"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g. CityCare Hospitals Private Limited"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Deadline (Whole Weeks) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={deadlineWeeks}
              onChange={(e) => setDeadlineWeeks(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Budget Envelope (INR ₹) [Min – Max]
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="Min ₹"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <input
                type="number"
                min="0"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Max ₹"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Technology Stack (Optional, comma-separated)
            </label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="e.g. FastAPI, React, TypeScript, PostgreSQL, Docker"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center space-x-4 mb-3">
            <span className="text-xs font-bold text-slate-700">Requirement Input Method:</span>
            <label className="inline-flex items-center text-xs text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="input_mode"
                checked={mode === 'paste'}
                onChange={() => setMode('paste')}
                disabled={isSubmitting}
                className="mr-1.5 text-teal-600 focus:ring-teal-500"
              />
              Pasted Requirement Text
            </label>
            <label className="inline-flex items-center text-xs text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="input_mode"
                checked={mode === 'file'}
                onChange={() => setMode('file')}
                disabled={isSubmitting}
                className="mr-1.5 text-teal-600 focus:ring-teal-500"
              />
              Upload File (PDF / DOCX)
            </label>
          </div>

          {mode === 'paste' ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Paste client requirements or RFP transcript (min 200 characters)</span>
                <span className={pastedText.length < 200 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                  {pastedText.length} characters
                </span>
              </div>
              <textarea
                rows={10}
                required
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste requirement document here..."
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-600 font-medium">Upload requirement file (PDF or DOCX, max 5 MB)</p>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
              {file && (
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                  ✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress or Submit */}
        {isSubmitting && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center space-x-3 text-teal-800 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600 shrink-0" />
            <div>
              <p className="font-bold">{progressStep}</p>
              <p className="text-[11px] text-teal-600">Executing deterministic Python feasibility calculations...</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#0F766E] hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <span>Analyze & Calculate Feasibility</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
