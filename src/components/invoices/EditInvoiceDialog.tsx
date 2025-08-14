"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover as UIPopover,
  PopoverTrigger as UIPopoverTrigger,
  PopoverContent as UIPopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as Collapsible from "@radix-ui/react-collapsible";
import { updateInvoice } from "@/services/invoices-client";
import type { SimpleInvoice } from "@/types/quickbooks";
import { toast } from "sonner";

type EditItem = {
  description: string;
  productName: string;
  productDescription: string;
  quantity: number;
  rate: number;
  amount: number;
};

export function EditInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SimpleInvoice | null;
  onSaved: () => Promise<void> | void;
}) {
  const initialItems: EditItem[] = useMemo(
    () =>
      (invoice?.items ?? []).map((i) => ({
        description: i.description,
        productName: i.productName || "",
        productDescription: i.productDescription || "",
        quantity: i.quantity,
        rate: i.rate,
        amount: i.amount,
      })),
    [invoice]
  );

  const [customerName, setCustomerName] = useState<string>("");
  const [issueDate, setIssueDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [items, setItems] = useState<EditItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  useEffect(() => {
    if (!open || !invoice) return;
    setCustomerName(invoice.customerName || "");
    setIssueDate(
      invoice.issueDate && invoice.issueDate !== "No due date"
        ? new Date(invoice.issueDate)
        : undefined
    );
    setDueDate(
      invoice.dueDate && invoice.dueDate !== "No due date"
        ? new Date(invoice.dueDate)
        : undefined
    );
    setItems(
      initialItems.length > 0
        ? initialItems
        : [
            {
              description: "",
              productName: "",
              productDescription: "",
              quantity: 1,
              rate: 0,
              amount: 0,
            },
          ]
    );
  }, [open, invoice, initialItems]);

  const updateItem = (index: number, field: keyof EditItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === "quantity" || field === "rate") {
      const quantity = Number(newItems[index].quantity ?? 1);
      const rate = Number(newItems[index].rate ?? 0);
      newItems[index].amount = quantity * rate;
    }
    setItems(newItems);
  };

  const addItem = () =>
    setItems([
      ...items,
      {
        description: "",
        productName: "",
        productDescription: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotalAmount = () =>
    items.reduce((total, i) => total + (i.quantity ?? 1) * (i.rate ?? 0), 0);

  const handleSave = async () => {
    if (!invoice) return;
    setLoading(true);
    try {
      const payload = {
        customerName: customerName || undefined,
        issueDate: issueDate ? format(issueDate, "yyyy-MM-dd") : undefined,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
        items: items.map((i) => ({
          description: i.description,
          productName: i.productName,
          productDescription: i.productDescription,
          quantity: i.quantity,
          rate: i.rate,
        })),
      };
      const result = await updateInvoice(invoice.id, payload);
      if (!result.success) throw new Error(result.details || result.error);
      toast.success("Invoice updated successfully!");
      await onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      const message = (err as any)?.message || "An unexpected error occurred";
      toast.error("Failed to update invoice", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-2 border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Edit Invoice</DialogTitle>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-4 md:col-span-2">
              <Label className="flex items-center gap-2 text-base">
                Customer Name
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="flex-1"
              />
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base">
                Issue Date
              </Label>
              <UIPopover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
                <UIPopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background border-border/30 hover:border-border/50",
                      !issueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issueDate ? (
                      format(issueDate, "M/d/yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </UIPopoverTrigger>
                <UIPopoverContent
                  className="w-auto p-0 border-2 border-gray-800"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={issueDate}
                    onSelect={(d) => {
                      setIssueDate(d as any);
                      setIssueDateOpen(false);
                    }}
                    className="border-none"
                  />
                </UIPopoverContent>
              </UIPopover>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base">
                Due Date
              </Label>
              <UIPopover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <UIPopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background border-border/30 hover:border-border/50",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      format(dueDate, "M/d/yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </UIPopoverTrigger>
                <UIPopoverContent
                  className="w-auto p-0 border-2 border-gray-800"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => {
                      setDueDate(d as any);
                      setDueDateOpen(false);
                    }}
                    className="border-none"
                  />
                </UIPopoverContent>
              </UIPopover>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {items.map((item, index) => (
              <Collapsible.Root
                key={index}
                defaultOpen
                className="relative border border-border/30 rounded-lg bg-muted/20"
              >
                <Collapsible.Trigger asChild>
                  <button
                    type="button"
                    className="group flex w-full items-center justify-between p-3 hover:bg-muted/40 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-primary">
                        ${item.amount.toFixed(2)}
                      </span>
                    </div>
                    <div />
                  </button>
                </Collapsible.Trigger>
                {items.length > 1 && (
                  <div className="absolute right-2 top-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove item ${index + 1}`}
                    >
                      ×
                    </Button>
                  </div>
                )}
                <Collapsible.Content className="p-4 pt-0 collapsible-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs mb-2 block">Product Name</Label>
                      <Input
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(index, "productName", e.target.value)
                        }
                        placeholder="Product name"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs mb-2 block">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs mb-2 block">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value))
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs mb-2 block">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", Number(e.target.value))
                        }
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            ))}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addItem}
                className="rounded-full"
              >
                +
              </Button>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-lg font-semibold text-foreground">
              Total Amount:
            </span>
            <span className="text-2xl font-bold text-primary">
              ${getTotalAmount().toFixed(2)}
            </span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 bg-background cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={loading}
              className="flex-1 cursor-pointer bg-background"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
