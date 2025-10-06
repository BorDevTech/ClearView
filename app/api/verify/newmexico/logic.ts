import { VetResult } from "@/app/types/vet-result";

export async function verify({
  firstName,
  lastName,
  licenseNumber,
}: {
  firstName: string;
  lastName: string;
  licenseNumber: string;
}): Promise<VetResult[]> {
  // --- Types ---
  type RawVetEntry = {
    IndividualId: number;
    IndividualLicenseId: number;
    Name: string;
    LicenseNumber: string;
    LicenseTypeName: string;
    LicenseStatusTypeName: string;
    OriginalLicenseDate: string | null;
    LicenseEffectiveDate: string;
    LicenseExpirationDate: string;
  };

  type BlobResponse = {
    timestamp: string;
    region: string;
    count: number;
    results: RawVetEntry[];
  };

  const key = "newmexico";

  // --- Helpers ---
  function tokenizeName(name: string): string[] {
    return name.trim().toLowerCase().split(/\s+/);
  }

  function levenshtein(a: string, b: string): number {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) =>
        i === 0 ? j : j === 0 ? i : 0
      )
    );
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }
    return dp[a.length][b.length];
  }

  function fuzzyMatch(query: string, tokens: string[], maxDistance = 2): boolean {
    const q = query.toLowerCase();
    return tokens.some((token) => {
      if (token.includes(q)) return true;
      return levenshtein(q, token) <= maxDistance;
    });
  }
  function parseBlob(raw: BlobResponse | RawVetEntry[]): RawVetEntry[] {
    if (Array.isArray(raw)) return raw;
    return raw.results ?? [];
  }

  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    const normalizedFirst = firstName?.trim() || null;
    const normalizedLast = lastName?.trim() || null;
    const normalizedLicense = licenseNumber?.trim() || null;

    return entries
      .filter((entry) => {
        const isVet = entry.LicenseTypeName?.includes("Doctor of Veterinary Medicine");
        if (!isVet) return false;

        const matchesLicense = normalizedLicense
          ? entry.LicenseNumber?.toLowerCase().includes(normalizedLicense.toLowerCase())
          : true;

        const tokens = tokenizeName(entry.Name);

        const matchesFirst = normalizedFirst ? fuzzyMatch(normalizedFirst, tokens) : true;
        const matchesLast = normalizedLast ? fuzzyMatch(normalizedLast, tokens) : true;

        return matchesLicense && matchesFirst && matchesLast;
      })
      .map((entry) => ({
        name: entry.Name.trim(),
        licenseNumber: entry.LicenseNumber?.trim(),
        status: entry.LicenseStatusTypeName?.trim(),
        expiration: new Date(entry.LicenseExpirationDate).toLocaleDateString("en-US", {
          timeZone: "UTC",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }));
  }

  // --- Fetch + process ---
  const res = await fetch(`/api/verify/${key}`, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to fetch ${key} data`);

  const rawData: BlobResponse = await res.json();
  const parsedData = parseBlob(rawData);
  return filterEntries(parsedData);
}
