import React from 'react';

interface HelpTipProps {
  articleId?: string;
  text?: string;
}

export const HelpTip: React.FC<HelpTipProps> = ({ articleId, text }) => {
  const handleClick = () => {
    if (articleId) {
      window.location.hash = `#/help?id=${articleId}`;
    }
  };
  return (
    <span
      className="help-tip"
      title={text || 'Открыть справку'}
      onClick={handleClick}
      role="button"
      aria-label="Помощь"
    >
      ?
    </span>
  );
};
