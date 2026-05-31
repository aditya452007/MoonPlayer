import React from 'react';
import { ResponsiveGrid } from '../../components/common/ResponsiveGrid/ResponsiveGrid';
import { AnimatedList } from '../../components/common/AnimatedList/AnimatedList';
import './SearchResultCategory.css';

export function SearchResultCategory({ title, type = 'list', children, className = '' }) {
  if (!React.Children.count(children)) return null;

  return (
    <div className={`search-result-category search-result-category--${type} ${className}`}>
      <h3 className="search-result-category__title">{title}</h3>
      {type === 'grid' ? (
        <ResponsiveGrid minItemWidth={160} gap={16}>
          {children}
        </ResponsiveGrid>
      ) : type === 'horizontal' ? (
        <div className="search-result-category__horizontal">
          {children}
        </div>
      ) : (
        <div className="search-result-category__list">
          <AnimatedList>
            {children}
          </AnimatedList>
        </div>
      )}
    </div>
  );
}

export default SearchResultCategory;
