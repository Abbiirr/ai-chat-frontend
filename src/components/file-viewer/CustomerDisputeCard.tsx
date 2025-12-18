import { User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { CustomerDispute } from "../../types";

interface CustomerDisputeCardProps {
  dispute: CustomerDispute;
}

export default function CustomerDisputeCard({ dispute }: CustomerDisputeCardProps) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-300">
          <User className="h-4 w-4" />
          Original Customer Dispute
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {dispute.rawText ? (
          <p className="text-sm leading-relaxed">{dispute.rawText}</p>
        ) : (
          <>
            {dispute.date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{dispute.date}</span>
              </div>
            )}
            {dispute.username && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Username:</span>
                <span className="font-medium">{dispute.username}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
