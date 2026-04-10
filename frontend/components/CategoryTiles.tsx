
import React from 'react';
import { Category } from '../types.ts';

interface CategoryTilesProps {
  onSelect: (cat: string) => void;
}

const CategoryTiles: React.FC<CategoryTilesProps> = ({ onSelect }) => {
  const tiles = [
    {
      id: 'delivery',
      title: 'Order Online',
      subtitle: 'Stay home and order to your doorstep',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop'
    },
    {
      id: 'dining',
      title: 'Dining',
      subtitle: "View the city's favourite dining venues",
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'
    },
    {
      id: 'nightlife',
      title: 'Nightlife',
      subtitle: "Explore lounges and late-night spots",
      imageUrl: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&h=400&fit=crop'
    },
    {
      id: 'street_food',
      title: 'Street Food & Laris',
      subtitle: 'Experience authentic local street flavors',
      imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&h=400&fit=crop'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      {tiles.map((tile) => (
        <div 
          key={tile.id}
          onClick={() => onSelect(tile.id)}
          className="group relative h-[280px] rounded-[32px] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
        >
          <img 
            src={tile.imageUrl} 
            alt={tile.title} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-2 group-hover:text-[#EF4F5F] transition-colors">{tile.title}</h3>
            <p className="text-xs text-white/70 font-bold uppercase tracking-[2px]">{tile.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryTiles;
