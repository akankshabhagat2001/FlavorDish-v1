
import React from 'react';
import { TopBrand } from '../types';

interface TopBrandsProps {
  brands: TopBrand[];
  onSelect: (name: string) => void;
}

const TopBrands: React.FC<TopBrandsProps> = ({ brands, onSelect }) => {
  return (
    <div className="mb-12">
      <h2 className="text-[26px] font-medium text-[#1c1c1c] mb-6">Top brands in focus</h2>
      <div className="flex gap-10 overflow-x-auto pb-4 no-scrollbar">
        {brands.map((brand) => (
          <div 
            key={brand.id} 
            onClick={() => onSelect(brand.name)}
            className="flex flex-col items-center gap-3 cursor-pointer group min-w-[130px]"
          >
            <div className="w-[130px] h-[130px] rounded-full border border-gray-100 shadow-sm overflow-hidden bg-white p-2 group-hover:shadow-lg group-hover:border-[#EF4F5F]/10 transition-all duration-300">
              <img 
                src={brand.imageUrl} 
                alt={brand.name} 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="text-center">
              <h4 className="text-[15px] font-medium text-[#1c1c1c] line-clamp-1 group-hover:text-[#EF4F5F] transition-colors">{brand.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{brand.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopBrands;
