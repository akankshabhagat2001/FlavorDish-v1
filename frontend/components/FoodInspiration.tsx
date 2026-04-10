
import React from 'react';
import { FoodInspirationItem } from '../types';

interface FoodInspirationProps {
  items: FoodInspirationItem[];
  onSelect: (title: string) => void;
}

const FoodInspiration: React.FC<FoodInspirationProps> = ({ items, onSelect }) => {
  return (
    <div className="mb-12">
      <h2 className="text-[26px] font-medium text-[#1c1c1c] mb-6">Inspiration for your first order</h2>
      <div className="flex gap-8 overflow-x-auto pb-6 scrollbar-hide no-scrollbar">
        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onSelect(item.title)}
            className="flex flex-col items-center gap-2 cursor-pointer group min-w-[150px]"
          >
            <div className="w-[150px] h-[150px] rounded-full overflow-hidden shadow-sm border border-transparent group-hover:border-[#EF4F5F]/20 group-hover:shadow-xl transition-all duration-500">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <span className="text-xl font-medium text-[#363636] group-hover:text-[#EF4F5F] transition-colors">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodInspiration;
