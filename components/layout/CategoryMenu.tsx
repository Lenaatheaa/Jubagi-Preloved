'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIES, MainCategory, SubCategory } from '@/lib/categories';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

const renderIcon = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent className="w-5 h-5 drop-shadow-sm" fill="currentColor" strokeWidth={1.5} /> : <LucideIcons.Box className="w-5 h-5" />;
};

export function CategoryMenu() {
  const [activeCategory, setActiveCategory] = useState<MainCategory | null>(null);

  return (
    <div className="hidden lg:flex items-center gap-4 h-full z-50">
      
      {/* Individual Category Links (Top level) */}
      <div className="flex items-center gap-4 h-full flex-1">
        {CATEGORIES.slice(0, 4).map(cat => (
          <div 
            key={cat.id}
            className="h-full flex items-center relative"
            onMouseEnter={() => setActiveCategory(cat)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <Link 
              href={`/products?category=${cat.id}`}
              className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center"
            >
              {cat.name}
            </Link>

            {/* Simple Dropdown for subcategories only */}
            {activeCategory?.id === cat.id && cat.subcategories.length > 0 && (
              <div className="absolute top-full left-0 w-48 bg-background shadow-xl border border-border rounded-xl py-2 z-50 flex flex-col">
                {cat.subcategories.map(sub => (
                  <div key={sub.name} className="flex flex-col">
                    {sub.items.map(item => (
                      <Link
                        key={item.name}
                        href={`/products?category=${cat.id}&q=${encodeURIComponent(item.name)}`}
                        className="text-left px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <AllCategoriesMenu />
    </div>
  );
}

function AllCategoriesMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCat(prev => prev === id ? null : id);
  };

  const sidebarContent = (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div className="relative w-full max-w-sm bg-[#1A1A1A] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-10 border-l border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">All Categories</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
          <div className="flex flex-col">
            {CATEGORIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cat => (
              <div key={cat.id} className="flex flex-col border-b border-white/5">
                {cat.subcategories.length > 0 ? (
                  <button
                    onClick={(e) => toggleExpand(cat.id, e)}
                    className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors w-full group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 shadow-inner ${cat.iconTextColor}`}>
                        {renderIcon(cat.iconName)}
                      </div>
                      <span className="text-[15px] font-semibold text-gray-100 group-hover:text-primary transition-colors">{cat.name}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedCat === cat.id ? 'rotate-180 text-white' : ''}`} />
                  </button>
                ) : (
                  <Link
                    href={`/products?category=${cat.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors w-full group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 shadow-inner ${cat.iconTextColor}`}>
                        {renderIcon(cat.iconName)}
                      </div>
                      <span className="text-[15px] font-semibold text-gray-100 group-hover:text-primary transition-colors">{cat.name}</span>
                    </div>
                  </Link>
                )}

                {/* Subcategories Accordion */}
                {expandedCat === cat.id && cat.subcategories.length > 0 && (
                  <div className="bg-[#121212] px-14 py-3 flex flex-col gap-4 border-t border-white/5">
                    {cat.subcategories.map(sub => (
                      <div key={sub.name} className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{sub.name}</span>
                        {sub.items.map(item => (
                          <Link
                            key={item.name}
                            href={`/products?category=${cat.id}&q=${encodeURIComponent(item.name)}`}
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-gray-300 hover:text-white py-1.5 transition-colors flex items-center before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-primary/50 before:mr-3 hover:before:bg-primary hover:translate-x-1 duration-200"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[13px] font-bold text-foreground hover:text-primary transition-colors bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/30"
      >
        <Menu className="w-4 h-4" />
        All Categories
      </button>

      {mounted && isOpen && createPortal(sidebarContent, document.body)}
    </div>
  );
}
