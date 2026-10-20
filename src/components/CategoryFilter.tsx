import React from 'react';
import { CATEGORIES } from '../data/initialVideos';
import { Language } from '../types/video';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  lang: Language;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  lang,
}) => {
  const isBn = lang === 'bn';

  return (
    <div className="w-full overflow-x-auto py-2 scrollbar-none no-scrollbar">
      <div className="flex items-center gap-2 pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0 border ${
                isSelected
                  ? 'bg-[#ff3155] border-[#ff3155] text-white shadow-md shadow-[#ff3155]/25 font-semibold'
                  : 'bg-[#151925] border-[#252938] text-[#a5adbd] hover:text-white hover:border-[#383e52]'
              }`}
            >
              {isBn ? cat.labelBn : cat.labelEn}
            </button>
          );
        })}
      </div>
    </div>
  );
};
