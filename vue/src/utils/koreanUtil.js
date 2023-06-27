export const finalSoundCheck = word => {
  let lastCode = word.charCodeAt(word.length - 1);
  if (lastCode < 58) return [1, 1, 0, 1, 0, 0, 1, 1, 1, 0][lastCode - 48];
  if (lastCode < 91) lastCode += 32;
  if (lastCode < 123) return [0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0][lastCode - 97];
  return (lastCode - 0xAC00) % 28 > 0;
}