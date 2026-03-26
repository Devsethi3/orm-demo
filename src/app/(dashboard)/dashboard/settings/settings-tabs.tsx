// src/app/(dashboard)/dashboard/settings/settings-tabs.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Plus, Settings, DollarSign, Shield, Globe } from "lucide-react"
import { toast } from "sonner"
import { updateCurrentUserName } from "@/actions/users"

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  isActive: boolean
}

interface ExchangeRate {
  id: string
  rate: any
  isManual: boolean
  validFrom: Date
  fromCurrency: { code: string }
  toCurrency: { code: string }
}

interface SettingsTabsProps {
  currencies: Currency[]
  exchangeRates: ExchangeRate[]
  currentUser: {
    id: string
    name: string
    email: string
  }
}

export function SettingsTabs({ currencies, exchangeRates, currentUser }: SettingsTabsProps) {
  const router = useRouter()
  const [isUpdatingName, startUpdateNameTransition] = useTransition()
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '' })
  const [displayName, setDisplayName] = useState(currentUser.name)

  const handleAddCurrency = async () => {
    // In a real implementation, this would call a server action
    toast.success("Currency added (demo)")
    setNewCurrency({ code: '', name: '', symbol: '' })
  }

  const handleUpdateName = () => {
    const normalizedName = displayName.trim()

    if (!normalizedName) {
      toast.error("Name is required")
      return
    }

    startUpdateNameTransition(async () => {
      const result = await updateCurrentUserName({ name: normalizedName })

      if (!result.success) {
        const fieldError = result.errors?.name?.[0]
        toast.error(fieldError || result.error || "Failed to update name")
        return
      }

      toast.success("Name updated successfully")
      router.refresh()
    })
  }

  const canSaveName =
    displayName.trim().length >= 2 && displayName.trim() !== currentUser.name

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={currentUser.email} disabled className="bg-muted" />
            </div>
          </div>
          <Button onClick={handleUpdateName} disabled={!canSaveName || isUpdatingName}>
            {isUpdatingName ? "Saving..." : "Save Name"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="currencies" className="space-y-6">
      <TabsList>
        <TabsTrigger value="currencies" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Currencies
        </TabsTrigger>
        <TabsTrigger value="exchange-rates" className="gap-2">
          <Globe className="h-4 w-4" />
          Exchange Rates
        </TabsTrigger>
        <TabsTrigger value="general" className="gap-2">
          <Settings className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>

      {/* Currencies Tab */}
      <TabsContent value="currencies" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Currency</CardTitle>
            <CardDescription>Add a new currency to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="USD"
                  maxLength={3}
                  className="w-24 uppercase"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Name</Label>
                <Input
                  placeholder="US Dollar"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  placeholder="$"
                  className="w-20"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddCurrency}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Currencies</CardTitle>
            <CardDescription>Currencies available in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell className="font-mono font-medium">{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell className="text-lg">{currency.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={currency.isActive ? "success" : "secondary"}>
                        {currency.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Exchange Rates Tab */}
      <TabsContent value="exchange-rates" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Exchange Rates</CardTitle>
            <CardDescription>Current and historical exchange rates</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Valid From</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchangeRates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No exchange rates configured
                    </TableCell>
                  </TableRow>
                ) : (
                  exchangeRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-mono">{rate.fromCurrency.code}</TableCell>
                      <TableCell className="font-mono">{rate.toCurrency.code}</TableCell>
                      <TableCell className="font-semibold">{Number(rate.rate).toFixed(4)}</TableCell>
                      <TableCell>
                        <Badge variant={rate.isManual ? "outline" : "secondary"}>
                          {rate.isManual ? "Manual" : "API"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(rate.validFrom)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* General Tab */}
      <TabsContent value="general" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure general system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Application Name</Label>
              <Input defaultValue="Finance CRM" />
            </div>
            <div className="space-y-2">
              <Label>Base Currency</Label>
              <Input defaultValue="USD" disabled className="w-24 bg-muted" />
              <p className="text-xs text-muted-foreground">
                All financial calculations are done in USD
              </p>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Input defaultValue="MMM dd, yyyy" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Configure security and access settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Session Timeout (days)</Label>
              <Input type="number" defaultValue={7} className="w-24" />
            </div>
            <div className="space-y-2">
              <Label>Invite Link Expiry (days)</Label>
              <Input type="number" defaultValue={7} className="w-24" />
            </div>
            <div className="space-y-2">
              <Label>Minimum Password Length</Label>
              <Input type="number" defaultValue={8} className="w-24" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>Recent system activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View detailed audit logs in the system database.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  )
}