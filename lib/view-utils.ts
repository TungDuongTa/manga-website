export const formatViewCount = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }

  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }

  return `${Math.max(0, Math.floor(views))}`;
};
