import type { PartnerProfileData } from "@/modules/profile/contracts";
import type {
  SettlementAccountMethodType,
  SettlementAccountNameMatchStatus,
  SettlementAccountUpsertInput,
} from "@/modules/wallet-payouts/contracts";

type CountryRule = {
  currencies: string[];
  bank: {
    accountNumberPattern?: RegExp;
    ibanPattern?: RegExp;
    routingCodePattern?: RegExp;
    swiftCodePattern?: RegExp;
  };
  mobileMoney?: {
    providers: string[];
    phonePattern: RegExp;
  };
};

const COUNTRY_RULES: Record<string, CountryRule> = {
  NG: {
    currencies: ["NGN"],
    bank: {
      accountNumberPattern: /^\d{10}$/,
      swiftCodePattern: /^[A-Z0-9]{8,11}$/,
    },
    mobileMoney: {
      providers: ["OPay", "PalmPay", "MTN MoMo"],
      phonePattern: /^\+234\d{10}$/,
    },
  },
  US: {
    currencies: ["USD"],
    bank: {
      accountNumberPattern: /^\d{4,17}$/,
      routingCodePattern: /^\d{9}$/,
      swiftCodePattern: /^[A-Z0-9]{8,11}$/,
    },
  },
  GB: {
    currencies: ["GBP"],
    bank: {
      accountNumberPattern: /^\d{8}$/,
      routingCodePattern: /^\d{6}$/,
      ibanPattern: /^GB[A-Z0-9]{14,30}$/,
      swiftCodePattern: /^[A-Z0-9]{8,11}$/,
    },
  },
};

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ");
}

export function listSupportedSettlementCountries() {
  return Object.keys(COUNTRY_RULES);
}

export function listSupportedSettlementCurrencies(country: string) {
  return COUNTRY_RULES[country]?.currencies ?? [];
}

export function listSupportedMobileMoneyProviders(country: string) {
  return COUNTRY_RULES[country]?.mobileMoney?.providers ?? [];
}

export function maskSensitiveValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= 4) {
    return `${"*".repeat(trimmed.length)}`;
  }
  const last4 = trimmed.slice(-4);
  return `${"*".repeat(Math.max(4, trimmed.length - 4))}${last4}`;
}

export function maskLabeledValue(label: string, value: string) {
  const masked = maskSensitiveValue(value);
  return masked ? `${label} ${masked}` : "";
}

export function formatSettlementAccountSummary(
  methodType: SettlementAccountMethodType,
  accountNumber: string,
  mobileNumber: string,
) {
  return methodType === "bank_account"
    ? maskLabeledValue("Acct", accountNumber)
    : maskLabeledValue("Mobile", mobileNumber);
}

export function computeNameMatchStatus(
  profileData: PartnerProfileData,
  accountHolderName: string,
): SettlementAccountNameMatchStatus {
  const target = normalizeName(accountHolderName);
  if (!target) {
    return "mismatched";
  }

  const candidates = [
    profileData.legalName,
    profileData.tradeName,
    profileData.primaryContactName,
  ]
    .map(normalizeName)
    .filter(Boolean);

  return candidates.includes(target) ? "matched" : "mismatched";
}

export function validateSettlementAccountInput(input: SettlementAccountUpsertInput) {
  const country = input.country.trim().toUpperCase();
  const currency = input.currency.trim().toUpperCase();
  const holder = input.accountHolderName.trim();
  const rule = COUNTRY_RULES[country];

  if (!rule) {
    throw new Error("Unsupported settlement account country.");
  }
  if (!holder) {
    throw new Error("Account holder name is required.");
  }
  if (!rule.currencies.includes(currency)) {
    throw new Error("Unsupported settlement account currency for selected country.");
  }

  if (input.methodType === "bank_account") {
    if (!input.bankName?.trim()) {
      throw new Error("Bank name is required for bank accounts.");
    }
    const accountNumber = input.accountNumber?.trim() ?? "";
    const iban = input.iban?.trim().toUpperCase() ?? "";
    if (!accountNumber && !iban && !input.accountId) {
      throw new Error("Account number or IBAN is required for bank accounts.");
    }
    if (accountNumber && rule.bank.accountNumberPattern && !rule.bank.accountNumberPattern.test(accountNumber)) {
      throw new Error("Invalid account number format for selected country.");
    }
    if (iban && rule.bank.ibanPattern && !rule.bank.ibanPattern.test(iban)) {
      throw new Error("Invalid IBAN format for selected country.");
    }
    if (input.routingCode?.trim() && rule.bank.routingCodePattern && !rule.bank.routingCodePattern.test(input.routingCode.trim())) {
      throw new Error("Invalid routing code format for selected country.");
    }
    if (input.swiftCode?.trim() && rule.bank.swiftCodePattern && !rule.bank.swiftCodePattern.test(input.swiftCode.trim().toUpperCase())) {
      throw new Error("Invalid SWIFT code format.");
    }
  } else {
    if (!rule.mobileMoney) {
      throw new Error("Mobile money is not supported for selected country.");
    }
    if (!input.mobileMoneyProvider?.trim()) {
      throw new Error("Mobile money provider is required.");
    }
    if (!rule.mobileMoney.providers.includes(input.mobileMoneyProvider.trim())) {
      throw new Error("Unsupported mobile money provider for selected country.");
    }
    const mobileNumber = input.mobileNumber?.trim() ?? "";
    if (!mobileNumber && input.accountId) {
      return;
    }
    if (!rule.mobileMoney.phonePattern.test(mobileNumber)) {
      throw new Error("Invalid mobile money number format for selected country.");
    }
  }
}
