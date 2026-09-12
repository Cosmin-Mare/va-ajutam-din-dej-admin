export function stripDiacritics(input: string): string {
  return input
    .replaceAll("ă", "a")
    .replaceAll("î", "i")
    .replaceAll("â", "a")
    .replaceAll("ș", "s")
    .replaceAll("ț", "t")
    .replaceAll("Ă", "A")
    .replaceAll("Î", "I")
    .replaceAll("Â", "A")
    .replaceAll("Ș", "S")
    .replaceAll("Ț", "T");
}

export function normalizeCnp(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 13);
}

export function maskCnp(cnp: string): string {
  const n = normalizeCnp(cnp);
  if (!n) return "••••";
  if (n.length <= 4) return "•".repeat(n.length);
  return `${"•".repeat(n.length - 4)}${n.slice(-4)}`;
}

export function validCNP(p_cnp: string): boolean {
  let i = 0;
  let year = 0;
  let hashResult = 0;
  const cnp: number[] = [];
  const hashTable = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  if (p_cnp.length !== 13) return false;
  for (i = 0; i < 13; i++) {
    cnp[i] = parseInt(p_cnp.charAt(i), 10);
    if (isNaN(cnp[i]!)) return false;
    if (i < 12) hashResult = hashResult + cnp[i]! * hashTable[i]!;
  }
  hashResult = hashResult % 11;
  if (hashResult === 10) hashResult = 1;
  year = cnp[1]! * 10 + cnp[2]!;
  switch (cnp[0]) {
    case 1:
    case 2:
      year += 1900;
      break;
    case 3:
    case 4:
      year += 1800;
      break;
    case 5:
    case 6:
      year += 2000;
      break;
    case 7:
    case 8:
    case 9:
      year += 2000;
      if (year > new Date().getFullYear() - 1900 - 14) year -= 100;
      break;
    default:
      return false;
  }
  if (year < 1800 || year > 2099) return false;
  return cnp[12] === hashResult;
}
