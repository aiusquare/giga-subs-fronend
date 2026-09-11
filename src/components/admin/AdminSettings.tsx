import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import {
  Building2,
  Bell,
  Shield,
  Palette,
  Mail,
  Phone,
  Globe,
  Save,
  CreditCard,
} from "lucide-react";

type ChargeType = "fixed" | "percentage";

export function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // General Settings
  const [appName, setAppName] = useState("VTUPay");
  const [tagline, setTagline] = useState("Fast & Reliable VTU Services");
  const [supportEmail, setSupportEmail] = useState("support@vtupay.com");
  const [supportPhone, setSupportPhone] = useState("+234 800 000 0000");
  const [currency, setCurrency] = useState("NGN");

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("1000");

  // Security Settings
  const [requirePinForTransactions, setRequirePinForTransactions] =
    useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Payment Gateway Settings
  const [topupmateEnabled, setTopupmateEnabled] = useState(true);
  const [monnifyEnabled, setMonnifyEnabled] = useState(false);
  const [topupmateChargeType, setTopupmateChargeType] =
    useState<ChargeType>("fixed");
  const [topupmateChargeValue, setTopupmateChargeValue] = useState("45");
  const [monnifyChargeType, setMonnifyChargeType] =
    useState<ChargeType>("fixed");
  const [monnifyChargeValue, setMonnifyChargeValue] = useState("0");

  // Referral Settings
  const [referralsEnabled, setReferralsEnabled] = useState(true);
  const [referralProfitPercentage, setReferralProfitPercentage] =
    useState("10");

  // Maintenance Settings
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "We're currently performing scheduled maintenance. Please check back soon.",
  );

  // Load settings from backend on mount
  useEffect(() => {
    api
      .get<Record<string, string>>("/admin/settings")
      .then((data) => {
        if (data.app_name) setAppName(data.app_name);
        if (data.tagline) setTagline(data.tagline);
        if (data.support_email) setSupportEmail(data.support_email);
        if (data.support_phone) setSupportPhone(data.support_phone);
        if (data.currency) setCurrency(data.currency);
        if (data.email_notifications != null)
          setEmailNotifications(data.email_notifications === "1");
        if (data.sms_notifications != null)
          setSmsNotifications(data.sms_notifications === "1");
        if (data.push_notifications != null)
          setPushNotifications(data.push_notifications === "1");
        if (data.transaction_alerts != null)
          setTransactionAlerts(data.transaction_alerts === "1");
        if (data.low_balance_alert != null)
          setLowBalanceAlert(data.low_balance_alert === "1");
        if (data.low_balance_threshold)
          setLowBalanceThreshold(data.low_balance_threshold);
        if (data.require_pin_for_transactions != null)
          setRequirePinForTransactions(
            data.require_pin_for_transactions === "1",
          );
        if (data.two_factor_auth != null)
          setTwoFactorAuth(data.two_factor_auth === "1");
        if (data.session_timeout) setSessionTimeout(data.session_timeout);
        if (data.max_login_attempts)
          setMaxLoginAttempts(data.max_login_attempts);
        if (data.payment_gateway_topupmate_enabled != null)
          setTopupmateEnabled(data.payment_gateway_topupmate_enabled === "1");
        if (data.payment_gateway_monnify_enabled != null)
          setMonnifyEnabled(data.payment_gateway_monnify_enabled === "1");
        if (data.payment_gateway_topupmate_charge_type === "percentage")
          setTopupmateChargeType("percentage");
        if (data.payment_gateway_topupmate_charge_value != null)
          setTopupmateChargeValue(data.payment_gateway_topupmate_charge_value);
        if (data.payment_gateway_monnify_charge_type === "percentage")
          setMonnifyChargeType("percentage");
        if (data.payment_gateway_monnify_charge_value != null)
          setMonnifyChargeValue(data.payment_gateway_monnify_charge_value);
        if (data.referrals_enabled != null)
          setReferralsEnabled(data.referrals_enabled === "1");
        if (data.referral_profit_percentage != null)
          setReferralProfitPercentage(data.referral_profit_percentage);
        if (data.maintenance_mode != null)
          setMaintenanceMode(data.maintenance_mode === "1");
        if (data.maintenance_message)
          setMaintenanceMessage(data.maintenance_message);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", {
        app_name: appName,
        tagline,
        support_email: supportEmail,
        support_phone: supportPhone,
        currency,
        email_notifications: emailNotifications ? "1" : "0",
        sms_notifications: smsNotifications ? "1" : "0",
        push_notifications: pushNotifications ? "1" : "0",
        transaction_alerts: transactionAlerts ? "1" : "0",
        low_balance_alert: lowBalanceAlert ? "1" : "0",
        low_balance_threshold: lowBalanceThreshold,
        require_pin_for_transactions: requirePinForTransactions ? "1" : "0",
        two_factor_auth: twoFactorAuth ? "1" : "0",
        session_timeout: sessionTimeout,
        max_login_attempts: maxLoginAttempts,
        maintenance_mode: maintenanceMode ? "1" : "0",
        maintenance_message: maintenanceMessage,
        payment_gateway_topupmate_enabled: topupmateEnabled ? "1" : "0",
        payment_gateway_monnify_enabled: monnifyEnabled ? "1" : "0",
        payment_gateway_topupmate_charge_type: topupmateChargeType,
        payment_gateway_topupmate_charge_value: topupmateChargeValue,
        payment_gateway_monnify_charge_type: monnifyChargeType,
        payment_gateway_monnify_charge_value: monnifyChargeValue,
        referrals_enabled: referralsEnabled ? "1" : "0",
        referral_profit_percentage: referralProfitPercentage,
      });
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading settings...
        </div>
      ) : (
        <>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:w-auto lg:grid-cols-6 lg:inline-grid">
              <TabsTrigger value="general" className="gap-2">
                <Building2 className="h-4 w-4 hidden sm:inline" />
                General
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4 hidden sm:inline" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4 hidden sm:inline" />
                Security
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="h-4 w-4 hidden sm:inline" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="gap-2">
                <Palette className="h-4 w-4 hidden sm:inline" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-2">
                Referrals
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your application's basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="appName">Application Name</Label>
                      <Input
                        id="appName"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="Enter app name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="Enter tagline"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="supportEmail"
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Support Email
                      </Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="supportPhone"
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Support Phone
                      </Label>
                      <Input
                        id="supportPhone"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="+234 000 000 0000"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currency"
                        className="flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        Default Currency
                      </Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGN">
                            Nigerian Naira (₦)
                          </SelectItem>
                          <SelectItem value="USD">US Dollar ($)</SelectItem>
                          <SelectItem value="GBP">British Pound (£)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Rewards</CardTitle>
                  <CardDescription>
                    Reward referrers with a percentage of profit from completed
                    referred transactions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Enable referral rewards</Label>
                      <p className="text-sm text-muted-foreground">
                        Pay rewards only when a referred transaction generates
                        profit.
                      </p>
                    </div>
                    <Switch
                      checked={referralsEnabled}
                      onCheckedChange={setReferralsEnabled}
                    />
                  </div>
                  <div className="max-w-sm space-y-2">
                    <Label htmlFor="referralProfitPercentage">
                      Profit share (%)
                    </Label>
                    <Input
                      id="referralProfitPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={referralProfitPercentage}
                      onChange={(event) =>
                        setReferralProfitPercentage(event.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how notifications are sent to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Notification Channels
                    </h4>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={smsNotifications}
                        onCheckedChange={setSmsNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send in-app push notifications
                        </p>
                      </div>
                      <Switch
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Alert Settings
                    </h4>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Transaction Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify users for every transaction
                        </p>
                      </div>
                      <Switch
                        checked={transactionAlerts}
                        onCheckedChange={setTransactionAlerts}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1 space-y-0.5">
                        <Label>Low Balance Alert</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when wallet balance is low
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={lowBalanceThreshold}
                          onChange={(e) =>
                            setLowBalanceThreshold(e.target.value)
                          }
                          className="w-24"
                          placeholder="1000"
                          disabled={!lowBalanceAlert}
                        />
                        <Switch
                          checked={lowBalanceAlert}
                          onCheckedChange={setLowBalanceAlert}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Configure security and authentication options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Require PIN for Transactions</Label>
                        <p className="text-sm text-muted-foreground">
                          Users must enter PIN to complete transactions
                        </p>
                      </div>
                      <Switch
                        checked={requirePinForTransactions}
                        onCheckedChange={setRequirePinForTransactions}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Require 2FA for all admin accounts
                        </p>
                      </div>
                      <Switch
                        checked={twoFactorAuth}
                        onCheckedChange={setTwoFactorAuth}
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">
                          Session Timeout (minutes)
                        </Label>
                        <Select
                          value={sessionTimeout}
                          onValueChange={setSessionTimeout}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeout" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="480">8 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxLoginAttempts">
                          Max Login Attempts
                        </Label>
                        <Select
                          value={maxLoginAttempts}
                          onValueChange={setMaxLoginAttempts}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select max attempts" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 attempts</SelectItem>
                            <SelectItem value="5">5 attempts</SelectItem>
                            <SelectItem value="10">10 attempts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Gateways
                  </CardTitle>
                  <CardDescription>
                    Enable either gateway or run both simultaneously. Users only
                    see funding methods that are enabled here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Topupmate</Label>
                        <p className="text-sm text-muted-foreground">
                          Dedicated virtual accounts and bank-transfer funding.
                        </p>
                      </div>
                      <Switch
                        checked={topupmateEnabled}
                        onCheckedChange={setTopupmateEnabled}
                        disabled={topupmateEnabled && !monnifyEnabled}
                      />
                    </div>
                    <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="topupmateChargeType">
                          Gateway charge type
                        </Label>
                        <Select
                          value={topupmateChargeType}
                          onValueChange={(value: ChargeType) =>
                            setTopupmateChargeType(value)
                          }
                        >
                          <SelectTrigger id="topupmateChargeType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">
                              Fixed amount (₦)
                            </SelectItem>
                            <SelectItem value="percentage">
                              Percentage (%)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="topupmateChargeValue">
                          Charge value{" "}
                          {topupmateChargeType === "percentage" ? "(%)" : "(₦)"}
                        </Label>
                        <Input
                          id="topupmateChargeValue"
                          type="number"
                          min="0"
                          max={
                            topupmateChargeType === "percentage"
                              ? "100"
                              : undefined
                          }
                          step="0.01"
                          value={topupmateChargeValue}
                          onChange={(event) =>
                            setTopupmateChargeValue(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Monnify</Label>
                        <p className="text-sm text-muted-foreground">
                          Reserved bank accounts plus card and transfer
                          checkout.
                        </p>
                      </div>
                      <Switch
                        checked={monnifyEnabled}
                        onCheckedChange={setMonnifyEnabled}
                        disabled={monnifyEnabled && !topupmateEnabled}
                      />
                    </div>
                    <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="monnifyChargeType">
                          Gateway charge type
                        </Label>
                        <Select
                          value={monnifyChargeType}
                          onValueChange={(value: ChargeType) =>
                            setMonnifyChargeType(value)
                          }
                        >
                          <SelectTrigger id="monnifyChargeType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">
                              Fixed amount (₦)
                            </SelectItem>
                            <SelectItem value="percentage">
                              Percentage (%)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monnifyChargeValue">
                          Charge value{" "}
                          {monnifyChargeType === "percentage" ? "(%)" : "(₦)"}
                        </Label>
                        <Input
                          id="monnifyChargeValue"
                          type="number"
                          min="0"
                          max={
                            monnifyChargeType === "percentage"
                              ? "100"
                              : undefined
                          }
                          step="0.01"
                          value={monnifyChargeValue}
                          onChange={(event) =>
                            setMonnifyChargeValue(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Fees are deducted from the amount paid before the wallet is
                    credited. At least one gateway must remain enabled.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Maintenance Settings */}
            <TabsContent value="maintenance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Maintenance Mode
                  </CardTitle>
                  <CardDescription>
                    Control application availability during maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4 border-destructive/50 bg-destructive/5">
                    <div className="space-y-0.5">
                      <Label className="text-destructive">
                        Enable Maintenance Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, users will see a maintenance page
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceMode}
                      onCheckedChange={setMaintenanceMode}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenanceMessage">
                      Maintenance Message
                    </Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="Enter the message to display during maintenance"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
