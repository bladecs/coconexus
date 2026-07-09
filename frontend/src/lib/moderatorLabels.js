export const MODERATOR_TYPE_LABELS = {
  content: 'Kurator Konten',
  publication: 'Redaktur Publikasi',
  forum: 'Fasilitator Diskusi',
  tag: 'Penata Taksonomi',
};

export function getModeratorTypeLabel(moderatorType) {
  return MODERATOR_TYPE_LABELS[moderatorType] || moderatorType;
}
