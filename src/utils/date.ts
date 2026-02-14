export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(date);
