
import React from 'react';
import { Category } from '../types';

interface CategoryTabsProps {
  active: Category;
  onChange: (cat: Category) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ active, onChange }) => {
  const tabs = [
    { 
      id: Category.Delivery, 
      label: 'Delivery', 
      icon: 'fa-motorcycle', 
      color: 'bg-[#FFF4F5]', 
      iconColor: 'text-[#EF4F5F]' 
    },
    { 
      id: Category.DiningOut, 
      label: 'Dining Out', 
      icon: 'fa-utensils', 
      color: 'bg-[#E5F3F3]', 
      iconColor: 'text-[#007C7C]' 
    }
  ];

  return (
    <div className="flex border-b border-gray-100 gap-10 mt-8 px-4 sm:px-0 bg-white">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`pb-4 flex items-center gap-5 transition-all relative border-b-2 ${
              isActive ? 'border-[#EF4F5F]' : 'border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
            }`}
          >
            <div className={`${tab.color} p-4 rounded-full flex items-center justify-center w-16 h-16 shadow-inner transition-transform ${isActive ? 'scale-110' : ''}`}>
              <i className={`fa-solid ${tab.icon} text-2xl ${tab.iconColor}`}></i>
            </div>
            <span className={`text-xl font-bold tracking-tight transition-colors ${isActive ? 'text-[#EF4F5F]' : 'text-gray-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
