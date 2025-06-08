export function sm2(grade: number, n: number, ef: number): { n: number; ef: number; interval: number } {
  let newN: number;
  let newEf: number;
  let interval: number;

  if (grade >= 3) {
    // Correct response
    if (n === 0) {
      interval = 1;
    } else if (n === 1) {
      interval = 6;
    } else {
      interval = Math.round(n * ef);
    }
    newN = n + 1;
  } else {
    // Incorrect response
    newN = 0;
    interval = 1;
  }

  // Update easiness factor
  newEf = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  // Ensure EF is at least 1.3
  newEf = Math.max(1.3, newEf);

  return { n: newN, ef: newEf, interval };
} 