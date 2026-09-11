import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  KeyRound,
  Search,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DocAction = {
  id: string;
  title: string;
  serviceType: string;
  action: string;
  description: string;
  endpoint?: string; // overrides API_ENDPOINT when set
  payload: Record<string, unknown>;
  successSample: Record<string, unknown>;
  failSample?: Record<string, unknown>;
  tags: string[];
};

const API_ENDPOINT = "/api/v1/gateway";

const ACTIONS: DocAction[] = [
  {
    id: "bvn-verify",
    title: "BVN Verification",
    serviceType: "bvn",
    action: "verify",
    description:
      "Verify a Bank Verification Number against CBN data and return identity details.",
    payload: {
      service_type: "bvn",
      action: "verify",
      payload: { bvn: "12345678901" },
    },
    successSample: {
      success: true,
      message: "Success",
      data: {
        bvn: "12345678901",
        firstname: "John",
        lastname: "Doe",
        phone: "+2348012345678",
        birthdate: "1990-01-15",
        gender: "M",
      },
    },
    tags: ["kyc", "bvn", "identity"],
  },
  {
    id: "nin-verify",
    title: "NIN Verification",
    serviceType: "nin",
    action: "verify",
    description:
      "Verify a National Identification Number and return profile, address, and photo fields.",
    payload: {
      service_type: "nin",
      action: "verify",
      payload: { nin: "12345678901" },
    },
    successSample: {
      success: true,
      message: "Success",
      data: {
        nin: "12345678901",
        firstname: "Adaeze",
        lastname: "Okonkwo",
        birthdate: "1992-04-15",
        gender: "Female",
        photo: "data:image/jpeg;base64,/9j/...",
      },
    },
    tags: ["kyc", "nin", "identity", "photo"],
  },
  {
    id: "nin-slip-download",
    title: "NIN Slip Download",
    serviceType: "nin",
    action: "download_slip",
    description:
      "Download NIN slip metadata and file details (regular, improved, or premium).",
    payload: {
      service_type: "nin",
      action: "download_slip",
      payload: { nin: "12345678901", slip_type: "improved" },
    },
    successSample: {
      success: true,
      message: "Success",
      data: {
        filename: "nin-verification-12345678901.pdf",
        slip_type: "improved",
      },
    },
    tags: ["nin", "documents", "download"],
  },
  {
    id: "data-purchase",
    title: "Data Purchase",
    serviceType: "data",
    action: "purchase",
    endpoint: "/api/v1/gateway/data",
    description:
      "Purchase a mobile data bundle. Deducted from your wallet balance.",
    payload: {
      network: 1,
      mobile_number: "08012345678",
      plan: "SME100",
      Ported_number: false,
    },
    successSample: {
      Status: "successful",
      status: "success",
      api_response: { status: "success", message: "Data purchase successful" },
      message: "Data purchase successful",
      balance_before: "10000.00",
      balance_after: "9500.00",
    },
    failSample: {
      Status: "fail",
      status: "fail",
      message: "Insufficient wallet balance",
      api_response: null,
      balance_before: "100.00",
      balance_after: "100.00",
    },
    tags: [
      "data",
      "vtu",
      "purchase",
      "bundle",
      "mtn",
      "airtel",
      "glo",
      "9mobile",
    ],
  },
  {
    id: "airtime-purchase",
    title: "Airtime Purchase",
    serviceType: "airtime",
    action: "purchase",
    endpoint: "/api/v1/gateway/airtime",
    description:
      "Top up a mobile number with airtime (VTU). Deducted from your wallet balance.",
    payload: {
      amount: 1000,
      network: "MTN",
      mobile_number: "08012345678",
      Ported_number: false,
      airtime_type: "VTU",
    },
    successSample: {
      Status: "successful",
      status: "success",
      api_response: {
        status: "success",
        message: "Airtime purchase successful",
      },
      message: "Airtime purchase successful",
      balance_before: "10000.00",
      balance_after: "9000.00",
    },
    failSample: {
      Status: "fail",
      status: "fail",
      message: "Insufficient wallet balance",
      api_response: null,
      balance_before: "100.00",
      balance_after: "100.00",
    },
    tags: [
      "airtime",
      "vtu",
      "topup",
      "recharge",
      "mtn",
      "airtel",
      "glo",
      "9mobile",
    ],
  },
];

const ERROR_CODES = [
  { code: "INVALID_NIN", status: 422, meaning: "NIN must be 11 digits." },
  { code: "INVALID_BVN", status: 422, meaning: "BVN must be 11 digits." },
  { code: "NIN_NOT_FOUND", status: 404, meaning: "No NIN record found." },
  { code: "UNAUTHORIZED", status: 401, meaning: "Invalid API key or token." },
  {
    code: "SERVICE_NOT_CONFIGURED",
    status: 503,
    meaning: "Service is disabled or provider key is missing.",
  },
  {
    code: "Status: fail — Insufficient wallet balance",
    status: 200,
    meaning: "Top up your wallet before retrying a VTU purchase.",
  },
  {
    code: "Status: fail — Invalid or unavailable plan",
    status: 200,
    meaning: "The plan code does not exist or has been deactivated.",
  },
  {
    code: "Status: fail — mobile_number must be 11 digits",
    status: 200,
    meaning:
      "Nigerian mobile numbers must be exactly 11 digits (e.g. 08012345678).",
  },
];

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

function buildCurl(payload: Record<string, unknown>, endpoint = API_ENDPOINT) {
  return [
    `curl -X POST http://localhost${endpoint} \\`,
    `  -H "X-Api-Key: ak_your_api_key" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${JSON.stringify(payload)}'`,
  ].join("\n");
}

function buildPostmanCollection() {
  return {
    info: {
      name: "GigaData VTU & Identity API",
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: ACTIONS.map((item) => {
      const ep = item.endpoint ?? API_ENDPOINT;
      const pathSegments = ep.replace(/^\//, "").split("/");
      return {
        name: item.title,
        request: {
          method: "POST",
          header: [
            { key: "X-Api-Key", value: "ak_your_api_key" },
            { key: "Content-Type", value: "application/json" },
          ],
          url: {
            raw: `http://localhost${ep}`,
            host: ["localhost"],
            path: pathSegments,
          },
          body: {
            mode: "raw",
            raw: pretty(item.payload),
          },
        },
      };
    }),
  };
}

const ApiDocsPage = () => {
  const [query, setQuery] = useState("");

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIONS;

    return ACTIONS.filter((item) => {
      const haystack = [item.title, item.serviceType, item.action, ...item.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const handleDownloadPostman = () => {
    const blob = new Blob([pretty(buildPostmanCollection())], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "gigadata-api.postman_collection.json";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    toast.success("Postman collection downloaded");
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        <PageHeader title="API Documentation" />

        <div className="space-y-5 animate-slide-up">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                API Integration Guide
              </CardTitle>
              <CardDescription>
                Complete in-app documentation for identity verification, data,
                and airtime services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Gateway: {API_ENDPOINT}</Badge>
                <Badge variant="secondary">Production Ready</Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search action, service, or tag"
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleDownloadPostman}
                  title="Download Postman collection for all endpoints"
                >
                  <Download className="w-4 h-4" />
                  Download Postman
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/api">
                    <ExternalLink className="w-4 h-4" />
                    API Access
                  </Link>
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-2 text-sm">
                <a
                  href="#authentication"
                  className="p-3 rounded-lg border hover:bg-muted/60"
                >
                  Authentication
                </a>
                <a
                  href="#actions"
                  className="p-3 rounded-lg border hover:bg-muted/60"
                >
                  Available Actions
                </a>
                <a
                  href="#errors"
                  className="p-3 rounded-lg border hover:bg-muted/60"
                >
                  Error Codes
                </a>
              </div>
            </CardContent>
          </Card>

          <Card id="authentication">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-semibold mb-1">API Key</p>
                <code className="text-xs">X-Api-Key: ak_your_api_key</code>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-semibold mb-1">Bearer Token</p>
                <code className="text-xs">
                  Authorization: Bearer your_token
                </code>
              </div>
            </CardContent>
          </Card>

          <section id="actions" className="space-y-4">
            {filteredActions.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No action matched your search.
                </CardContent>
              </Card>
            )}

            {filteredActions.map((item) => {
              const payloadJson = pretty(item.payload);
              const responseJson = pretty(item.successSample);
              const failJson = item.failSample ? pretty(item.failSample) : null;
              const curl = buildCurl(item.payload, item.endpoint);

              return (
                <Card key={item.id} id={item.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {item.title}
                        </CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {item.serviceType}:{item.action}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Payload</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleCopy(payloadJson, "Payload")}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </Button>
                      </div>
                      <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto">
                        {payloadJson}
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">cURL</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleCopy(curl, "cURL")}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </Button>
                      </div>
                      <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto">
                        {curl}
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Success Response</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleCopy(responseJson, "Response")}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </Button>
                      </div>
                      <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto">
                        {responseJson}
                      </pre>
                    </div>

                    {failJson && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">
                            Failure Response
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              handleCopy(failJson, "Failure response")
                            }
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </Button>
                        </div>
                        <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto">
                          {failJson}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <Card id="errors">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Common Error Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ERROR_CODES.map((item) => (
                <div
                  key={item.code}
                  className="p-3 rounded-lg border flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-sm">{item.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.meaning}
                    </p>
                  </div>
                  <Badge variant="outline">HTTP {item.status}</Badge>
                </div>
              ))}

              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tip: validate NIN/BVN as exactly 11 digits before calling API.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ApiDocsPage;
