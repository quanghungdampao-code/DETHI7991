import React from 'react';
import { TopicPlan, QuestionType, DifficultyLevel, QUESTION_TYPES, DIFFICULTY_LEVELS } from '../types';

interface PlanRowProps {
  plan: TopicPlan;
  onChange: (id: string, field: keyof TopicPlan, value: any) => void;
  onRemove: (id: string) => void;
}

export const PlanRow: React.FC<PlanRowProps> = ({ plan, onChange, onRemove }) => {
  return (
    <div className="grid grid-cols-12 gap-3 items-center p-2 bg-white border border-slate-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all group">
      <div className="col-span-5">
        <input
          type="text"
          value={plan.topic}
          onChange={(e) => onChange(plan.id, 'topic', e.target.value)}
          placeholder="Nhập chủ đề..."
          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>
      <div className="col-span-3">
        <select
          value={plan.type}
          onChange={(e) => onChange(plan.id, 'type', e.target.value as QuestionType)}
          className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        >
          {Object.entries(QUESTION_TYPES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <input
          type="number"
          min="1"
          max="20"
          value={plan.count}
          onChange={(e) => onChange(plan.id, 'count', parseInt(e.target.value) || 1)}
          className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-center font-medium transition-colors"
        />
      </div>
      <div className="col-span-2 relative flex items-center gap-1">
        <select
          value={plan.level}
          onChange={(e) => onChange(plan.id, 'level', e.target.value as DifficultyLevel)}
          className={`w-full px-2 py-1.5 text-xs font-bold rounded border focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors appearance-none text-center
            ${plan.level === 'NB' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
            ${plan.level === 'TH' ? 'bg-green-50 text-green-700 border-green-200' : ''}
            ${plan.level === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
            ${plan.level === 'VDC' ? 'bg-red-50 text-red-700 border-red-200' : ''}
          `}
        >
          {Object.entries(DIFFICULTY_LEVELS).map(([key, label]) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <button
          onClick={() => onRemove(plan.id)}
          className="text-slate-300 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100 absolute -right-6"
          title="Xóa"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
};