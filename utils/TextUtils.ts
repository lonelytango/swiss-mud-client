// utils/TextUtils.ts
// Utility functions for text manipulation.

// Helper function to strip HTML tags
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};
