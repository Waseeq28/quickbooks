"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X, CalendarIcon } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { toast } from "sonner";
import { format } from "date-fns";
import { createInvoice } from "@/services/invoices-client";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  description: string;
  productName: string;
  productDescription: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: () => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  onInvoiceCreated,
}: CreateInvoiceDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "",
      productName: "",
      productDescription: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const addItem = () => {
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
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount
    if (field === "quantity" || field === "rate") {
      const quantity =
        field === "quantity" ? Number(value) : newItems[index].quantity;
      const rate = field === "rate" ? Number(value) : newItems[index].rate;
      newItems[index].amount = quantity * rate;
    }

    setItems(newItems);
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const handleCreateInvoice = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter a customer name");
      return;
    }

    if (items.some((item) => !item.description.trim() || item.rate <= 0)) {
      toast.error(
        "Please fill in all item details and ensure rates are greater than 0",
      );
      return;
    }

    setIsLoading(true);

    try {
      const data = await createInvoice({
        customerName: customerName.trim(),
        issueDate: issueDate ? format(issueDate, "yyyy-MM-dd") : undefined,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
        items: items.map((i) => ({
          description: i.description,
          productName: i.productName,
          productDescription: i.productDescription,
          quantity: i.quantity,
          rate: i.rate,
        })),
      });

      if (!data.success) {
        throw new Error(
          data?.details || data?.error || "Failed to create invoice",
        );
      }

      toast.success("Invoice created successfully!");

      // Reset form
      setCustomerName("");
      setIssueDate(new Date());
      setDueDate(undefined);
      setItems([
        {
          description: "",
          productName: "",
          productDescription: "",
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ]);

      onOpenChange(false);
      onInvoiceCreated?.();
    } catch (error: any) {
      toast.error("Failed to create invoice", {
        description: error?.message ?? "An unexpected error occurred",
      });
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    setCustomerName("");
    setIssueDate(new Date());
    setDueDate(undefined);
    setItems([
      {
        description: "",
        productName: "",
        productDescription: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-2 border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Create New Invoice</DialogTitle>
        <div className="space-y-3">
          {/* Basic Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-4 md:col-span-2">
              <Label
                htmlFor="customerName"
                className="flex items-center gap-2 text-base"
              >
                Customer Name
              </Label>
              <Input
                id="customerName"
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
              <Popover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background border-border/30 hover:border-border/50",
                      !issueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issueDate ? (
                      format(issueDate, "M/d/yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-2 border-gray-800"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={issueDate}
                    onSelect={(date) => {
                      setIssueDate(date);
                      setIssueDateOpen(false);
                    }}
                    className="border-none"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base">
                Due Date
              </Label>
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background border-border/30 hover:border-border/50",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      format(dueDate, "M/d/yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-2 border-gray-800"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setDueDateOpen(false);
                    }}
                    className="border-none"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-semibold">
                Invoice Items
              </Label>
            </div>

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
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <Collapsible.Content className="p-4 pt-0 collapsible-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`productName-${index}`}
                          className="text-xs mb-2 block"
                        >
                          Product Name
                        </Label>
                        <Input
                          id={`productName-${index}`}
                          value={item.productName}
                          onChange={(e) =>
                            updateItem(index, "productName", e.target.value)
                          }
                          placeholder="Product name"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`description-${index}`}
                          className="text-xs mb-2 block"
                        >
                          Description
                        </Label>
                        <Input
                          id={`description-${index}`}
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                          placeholder="Item description"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`quantity-${index}`}
                          className="text-xs mb-2 block"
                        >
                          Quantity
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`rate-${index}`}
                          className="text-xs mb-2 block"
                        >
                          Unit Price
                        </Label>
                        <Input
                          id={`rate-${index}`}
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

              {/* Add Item Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  className="rounded-full"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 bg-background cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleCreateInvoice}
              disabled={
                isLoading ||
                !customerName.trim() ||
                items.some((item) => !item.description.trim() || item.rate <= 0)
              }
              className="flex-1 cursor-pointer bg-background"
            >
              {isLoading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
