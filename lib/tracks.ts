export const trackColors = [
  "#e5f2e5",
  "#e5edf7",
  "#fdeafc",
  "#fff4d6",
  "#efe5f8",
  "#e2fbfa",
] as const;

const trackTextColors: Record<(typeof trackColors)[number], string> = {
  "#e5f2e5": "#2e7d32",
  "#e5edf7": "#2563a8",
  "#fdeafc": "#960b93",
  "#fff4d6": "#8A6100",
  "#efe5f8": "#600baa",
  "#e2fbfa": "#087c77",
};

export function getTrackColor(trackName: string) {
  let hash = 0;

  for (let i = 0; i < trackName.length; i++) {
    hash = (hash * 31 + trackName.charCodeAt(i)) | 0;
  }

  const index = Math.abs(hash) % trackColors.length;
  const backgroundColor = trackColors[index];
  const textColor = trackTextColors[backgroundColor];
  return {
    backgroundColor,
    textColor: textColor,
  };
}