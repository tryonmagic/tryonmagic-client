"use client";

import { submitTaskAudit } from "@/app/billing/usage/queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthenticatedMutation } from "@/lib/hooks/useAuthenticatedMutation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { Switch } from "@/components/ui/switch";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AuditStatus, Task } from "@/lib/api/type";

interface MagicAuditDialogProps {
  task: Task | null;
  onSuccess?: () => void;
  onClose: () => void;
}

export function MagicAuditDialog({
  task,
  onSuccess,
  onClose,
}: MagicAuditDialogProps) {
  const [reason, setReason] = useState("");
  const [isRefundRequested, setIsRefundRequested] = useState(false);

  const taskId = task?.id || null;
  const existingAudit = task?.taskAudit;
  console.log("existingAudit", existingAudit);

  const { mutate: submitAudit, isPending } = useAuthenticatedMutation({
    mutationFn: (
      token: string,
      variables: { taskId: string; reason: string; isRefundRequested: boolean },
    ) =>
      submitTaskAudit(token, {
        taskId: variables.taskId,
        reason: variables.reason,
        isRefundRequested: variables.isRefundRequested,
      }),
    onSuccess: () => {
      toast.success("Magic Audit request submitted successfully.");
      onClose();
      setReason("");
      setIsRefundRequested(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to submit Magic Audit request.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !reason.trim()) return;
    submitAudit({ taskId, reason, isRefundRequested });
  };

  const getAuditStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case AuditStatus.PENDING:
        return <Badge variant="secondary">Pending Review</Badge>;
      case AuditStatus.RESOLVED:
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>
        );
      case AuditStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {existingAudit ? (
          <div>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Magic Audit Details</DialogTitle>
                {getAuditStatusBadge(existingAudit.status)}
              </div>
              <DialogDescription>
                You have already submitted a feedback for this task.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Reason</Label>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {existingAudit.reason}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">
                  Refund Requested
                </Label>
                <Badge
                  variant={
                    existingAudit.isRefundRequested ? "default" : "outline"
                  }
                >
                  {existingAudit.isRefundRequested ? "Yes" : "No"}
                </Badge>
              </div>
              {existingAudit.adminFeedback && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="font-semibold text-purple-600 dark:text-purple-400">
                      Admin Feedback
                    </Label>
                    <p className="text-sm border-l-2 border-purple-500 pl-3 py-1 italic">
                      {existingAudit.adminFeedback}
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Magic Audit</DialogTitle>
              <DialogDescription>
                Report an unusual or imperfect AI-generated result or request a
                credit refund.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please describe why the result was unsatisfactory..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="refund-request"
                  checked={isRefundRequested}
                  onCheckedChange={setIsRefundRequested}
                />
                <Label htmlFor="refund-request">Request Credit Refund</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !reason.trim()}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Report Issue
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
