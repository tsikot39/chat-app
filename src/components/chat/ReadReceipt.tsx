import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadReceiptProps {
  isRead: boolean;
  isSent: boolean;
  readAt?: Date | string;
  showReadReceipts?: boolean;
  className?: string;
}

export function ReadReceipt({
  isRead,
  isSent,
  readAt,
  showReadReceipts = true,
  className,
}: ReadReceiptProps) {
  // Don't show read receipts if not enabled or if it's an incoming message
  if (!showReadReceipts || !isSent) {
    return null;
  }

  const Icon = isRead ? CheckCheck : Check;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs",
        isRead ? "text-nexus-600" : "text-gray-400",
        className
      )}
      title={
        isRead && readAt
          ? `Read at ${new Date(readAt).toLocaleString()}`
          : isSent
          ? "Sent"
          : undefined
      }
    >
      <Icon size={14} />
      {isRead && readAt && (
        <span className="text-xs text-gray-500 ml-1">
          {new Date(readAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}
