function deriveInstallmentAmount(targetAmount, totalInstallments, installmentAmount) {
  if (installmentAmount) return installmentAmount;
  if (!totalInstallments) return null;
  return targetAmount / totalInstallments;
}

module.exports = { deriveInstallmentAmount };
