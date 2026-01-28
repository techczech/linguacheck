import { TranslationSegment } from '../types';

export const downloadJSON = (segments: TranslationSegment[], filename = 'translation-results.json') => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(segments, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const downloadCSV = (segments: TranslationSegment[], filename = 'translation-results.csv') => {
  const headers = ['ID', 'Original', 'Translated', 'Back Translated', 'Status'];
  const rows = segments.map(s => [
    s.id,
    `"${s.original.replace(/"/g, '""')}"`,
    `"${(s.translated || '').replace(/"/g, '""')}"`,
    `"${(s.backTranslated || '').replace(/"/g, '""')}"`,
    s.status
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};