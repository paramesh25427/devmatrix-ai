import { useState } from 'react';
import type { FC, ChangeEvent, FormEvent } from 'react';
import { Sparkles, Calendar, DollarSign, Users, Layers, ArrowRight, AlertCircle, FileCode2 } from 'lucide-react';
import type { ProjectCreate } from '../types/api';

interface ProjectIntakeFormProps {
  onSubmit: (data: ProjectCreate) => Promise<void>;
  onInspectReferenceProject: (projectId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_SHOPNOVA_PAYLOAD: ProjectCreate = {
  org_id: 'ORG-001',
  title: 'ShopNova E-Commerce Suite',
  description: 'Multi-vendor marketplace platform with product search, cart, checkout, Stripe payment integration, order tracking, and seller management.',
  business_objectives: 'Expand digital retail revenue by 40% with high-throughput order engine.',
  target_architecture: 'Microservices with PostgreSQL, Redis, FastAPI, and React',
  target_completion_date: '2026-12-15',
  budget_amount: 85000.0,
  currency: 'USD',
  team_size_limit: 5,
};

export const ProjectIntakeForm: FC<ProjectIntakeFormProps> = ({
  onSubmit,
  onInspectReferenceProject,
  isLoading,
  error
}) => {
  const [formData, setFormData] = useState<ProjectCreate>(DEFAULT_SHOPNOVA_PAYLOAD);
  const [formValidation, setFormValidation] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget_amount' || name === 'team_size_limit' ? Number(value) : value
    }));
    // Clear validation error on edit
    if (formValidation[name]) {
      setFormValidation(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePrefill = () => {
    setFormData(DEFAULT_SHOPNOVA_PAYLOAD);
    setFormValidation({});
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    }
    if (!formData.business_objectives || formData.business_objectives.trim().length < 5) {
      errors.business_objectives = 'Business objectives are required.';
    }
    if (!formData.target_completion_date) {
      errors.target_completion_date = 'Target delivery date is required.';
    }
    if (!formData.budget_amount || formData.budget_amount <= 0) {
      errors.budget_amount = 'Budget must be greater than 0.';
    }

    if (Object.keys(errors).length > 0) {
      setFormValidation(errors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner & Quick Reference Project */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Milestone 1 â€” Vertical Slice</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Project Intake & Risk Feasibility</h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Submit a target architecture and delivery scope to run organization-aware feasibility analysis against employee skills, active commitments, and cloud resources.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="prefill-shopnova-btn"
              type="button"
              onClick={handlePrefill}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Prefill ShopNova</span>
            </button>
            <button
              id="inspect-prj101-btn"
              type="button"
              onClick={() => onInspectReferenceProject('PRJ-101')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Inspect PRJ-101 Seed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div id="intake-error-alert" className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-red-300">Operation Error</p>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} id="project-intake-form" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Title */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="title" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Project Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. ShopNova E-Commerce Suite"
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${
                formValidation.title ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              } text-white placeholder-slate-600 text-sm transition-all outline-none`}
            />
            {formValidation.title && (
              <p className="text-[11px] text-red-400">{formValidation.title}</p>
            )}
          </div>

          {/* Target Budget */}
          <div className="space-y-1.5">
            <label htmlFor="budget_amount" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Budget Ceiling (USD) <span className="text-rose-400">*</span></span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                id="budget_amount"
                name="budget_amount"
                type="number"
                min="1000"
                step="500"
                required
                value={formData.budget_amount}
                onChange={handleInputChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none font-mono"
              />
            </div>
            {formValidation.budget_amount && (
              <p className="text-[11px] text-red-400">{formValidation.budget_amount}</p>
            )}
          </div>

          {/* Target Completion Date */}
          <div className="space-y-1.5">
            <label htmlFor="target_completion_date" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Deadline <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                id="target_completion_date"
                name="target_completion_date"
                type="date"
                required
                value={formData.target_completion_date}
                onChange={handleInputChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none"
              />
            </div>
            {formValidation.target_completion_date && (
              <p className="text-[11px] text-red-400">{formValidation.target_completion_date}</p>
            )}
          </div>

          {/* Architecture Stack */}
          <div className="space-y-1.5">
            <label htmlFor="target_architecture" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Architecture
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                id="target_architecture"
                name="target_architecture"
                type="text"
                value={formData.target_architecture || ''}
                onChange={handleInputChange}
                placeholder="e.g. Microservices with PostgreSQL, Redis, FastAPI, and React"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none"
              />
            </div>
          </div>

          {/* Team Size Limit */}
          <div className="space-y-1.5">
            <label htmlFor="team_size_limit" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Max Team Size Limit
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                id="team_size_limit"
                name="team_size_limit"
                type="number"
                min="1"
                max="20"
                value={formData.team_size_limit || 5}
                onChange={handleInputChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none font-mono"
              />
            </div>
          </div>

          {/* Business Objectives */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="business_objectives" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Strategic Business Objectives <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="business_objectives"
              name="business_objectives"
              rows={2}
              required
              value={formData.business_objectives}
              onChange={handleInputChange}
              placeholder="e.g. Expand digital revenue by 40% with high-throughput order engine."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none resize-none"
            />
          </div>

          {/* Scope Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="description" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Scope & Functional Overview <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide a detailed description of modules, integrations, and compliance needs."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Target Tenant: <strong>ShopNova Retail Corp (ORG-001)</strong></span>
          </div>

          <button
            id="submit-intake-btn"
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center space-x-2 shadow-lg ${
              isLoading
                ? 'bg-indigo-900/50 text-indigo-300 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-indigo-300" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Evaluating Feasibility...</span>
              </>
            ) : (
              <>
                <span>Create & Evaluate Feasibility</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
