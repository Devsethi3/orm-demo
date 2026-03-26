// modules/finance/accounts-content.tsx
import { getBrands, getBankAccounts } from "@/server/queries/finance";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, Wallet01Icon } from "@hugeicons/core-free-icons";

export async function AccountsContent() {
  const [brands, accounts] = await Promise.all([
    getBrands(),
    getBankAccounts(),
  ]);

  return (
    <div className="space-y-8">
      {/* Brands */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={Building03Icon} className="h-5 w-5" />
          Brands
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: brand.color || "#6366f1" }}
                />
                <h3 className="font-semibold">{brand.name}</h3>
              </div>
              {brand.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {brand.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bank Accounts */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={Wallet01Icon} className="h-5 w-5" />
          Bank Accounts
        </h2>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: account.brandColor || undefined,
                        color: account.brandColor || undefined,
                      }}
                    >
                      {account.brandName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.bankName}
                  </TableCell>
                  <TableCell>{account.currency}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(account.currentBalance, account.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
