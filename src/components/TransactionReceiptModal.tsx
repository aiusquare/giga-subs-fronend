import { useRef } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Copy,
} from "lucide-react";
import { type Transaction } from "@/hooks/useTransactions";
import { siteConfig } from "@/config/site";
import { toast } from "@/hooks/use-toast";

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-10 h-10 text-success" />;
    case "pending":
      return <Clock className="w-10 h-10 text-warning" />;
    case "failed":
      return <XCircle className="w-10 h-10 text-destructive" />;
    case "refunded":
      return <RotateCcw className="w-10 h-10 text-primary" />;
    default:
      return <Clock className="w-10 h-10 text-muted-foreground" />;
  }
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    completed: "Successful",
    pending: "Processing",
    failed: "Failed",
    refunded: "Refunded",
  };
  return map[status] ?? status;
};

const serviceLabel = (type: string) => {
  const map: Record<string, string> = {
    data: "Data Purchase",
    airtime: "Airtime Topup",
    electricity: "Electricity",
    cable: "Cable TV",
    funding: "Wallet Funding",
    scratch_card: "Scratch Card",
    bvn_verification: "BVN Verification",
    nin_verification: "NIN Verification",
    nin_slip_download: "NIN Slip Download",
    wallet: "Wallet Transfer",
    admin_credit: "Admin Credit",
    admin_debit: "Admin Debit",
  };
  return map[type] ?? type;
};

export function TransactionReceiptModal({
  transaction,
  open,
  onOpenChange,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const isCredit = transaction.amount > 0;
  const isDebit = transaction.amount < 0;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=420,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt – ${transaction.reference ?? transaction.id}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                   background: #fff; color: #111; padding: 24px; }
            .receipt { max-width: 380px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #ddd; padding-bottom: 16px; margin-bottom: 16px; }
            .header h1 { font-size: 20px; font-weight: 700; }
            .header p  { font-size: 12px; color: #666; margin-top: 2px; }
            .status-block { text-align: center; margin: 16px 0; }
            .status-block .amount { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
            .status-block .badge  { display: inline-block; padding: 2px 12px; border-radius: 20px;
                                    font-size: 12px; font-weight: 600; text-transform: uppercase;
                                    letter-spacing: .5px; }
            .badge-completed { background: #dcfce7; color: #166534; }
            .badge-pending   { background: #fef9c3; color: #854d0e; }
            .badge-failed    { background: #fee2e2; color: #991b1b; }
            .badge-refunded  { background: #ede9fe; color: #4c1d95; }
            .rows { border-top: 1px solid #eee; padding-top: 12px; }
            .row { display: flex; justify-content: space-between; align-items: flex-start;
                   padding: 6px 0; border-bottom: 1px solid #f4f4f4; font-size: 13px; }
            .row .label { color: #666; flex-shrink: 0; margin-right: 12px; }
            .row .value { text-align: right; font-weight: 500; word-break: break-all; }
            .description { font-size: 12px; color: #555; padding: 10px 0; line-height: 1.5; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999;
                      border-top: 2px dashed #ddd; padding-top: 14px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied", description: text });
    });
  };

  const amountDisplay = `${siteConfig.currency.symbol}${Math.abs(transaction.amount).toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        {/* Printable receipt area */}
        <div className="px-6 pb-2 overflow-y-auto max-h-[75vh]">
          <div ref={printRef} className="receipt">
            {/* Print-only header */}
            <div className="header hidden">
              <h1>{siteConfig.name}</h1>
              <p>{siteConfig.contact?.email}</p>
              <p>Transaction Receipt</p>
            </div>

            {/* Status block */}
            <div className="flex flex-col items-center py-6 gap-2">
              {statusIcon(transaction.status)}
              <p
                className={`text-3xl font-extrabold mt-1 ${isCredit ? "text-success" : isDebit ? "text-foreground" : "text-muted-foreground"}`}
              >
                {isCredit ? "+" : isDebit ? "-" : ""}
                {amountDisplay}
              </p>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full capitalize
                ${
                  transaction.status === "completed"
                    ? "bg-success/15 text-success"
                    : transaction.status === "pending"
                      ? "bg-warning/15 text-warning"
                      : transaction.status === "failed"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/15 text-primary"
                }`}
              >
                {statusLabel(transaction.status)}
              </span>

              {/* Print-only badge mirror */}
              <div className="hidden status-block">
                <div className={`amount`}>
                  {isCredit ? "+" : isDebit ? "-" : ""}
                  {amountDisplay}
                </div>
                <span className={`badge badge-${transaction.status}`}>
                  {statusLabel(transaction.status)}
                </span>
              </div>
            </div>

            {/* Detail rows */}
            <div className="rows space-y-0 border-t border-border">
              <DetailRow
                label="Service"
                value={serviceLabel(transaction.type)}
              />
              <DetailRow label="Plan" value={transaction.title} />
              <DetailRow
                label="Date"
                value={format(
                  new Date(transaction.created_at),
                  "MMM d, yyyy h:mm a",
                )}
              />
              {transaction.reference && (
                <DetailRow
                  label="Reference"
                  value={transaction.reference}
                  onCopy={() => copyRef(transaction.reference!)}
                />
              )}
              {transaction.provider_ref && (
                <DetailRow
                  label="Provider Ref"
                  value={transaction.provider_ref}
                  onCopy={() => copyRef(transaction.provider_ref!)}
                />
              )}
            </div>

            {/* Description / reason */}
            {transaction.description && (
              <div className="description mt-3 text-sm text-muted-foreground bg-secondary/40 rounded-xl px-4 py-3 leading-relaxed">
                {transaction.description}
              </div>
            )}

            {/* Print-only footer */}
            <div className="footer hidden">
              <p>Thank you for using {siteConfig.name}</p>
              <p>For support: {siteConfig.contact?.email}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="row flex items-start justify-between py-3 border-b border-border/50 text-sm gap-3">
      <span className="label text-muted-foreground shrink-0">{label}</span>
      <span className="value font-medium text-right flex items-center gap-1 break-all">
        {value}
        {onCopy && (
          <button
            onClick={onCopy}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}
