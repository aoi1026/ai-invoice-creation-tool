import { z } from "zod";

export const registerSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(120),
  name: z.string().min(1, "Your name is required").max(120),
  email: z.string().email("Valid email required").max(180),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(1).max(200),
});

export const requestResetSchema = z.object({
  email: z.string().email().max(180),
});

export const performResetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(200),
});

export const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.coerce.number().finite(),
  unitPrice: z.coerce.number().finite(),
});

export const invoiceSchema = z.object({
  number: z.string().max(60).optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  currency: z.string().min(1).max(8),
  issueDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100),
  notes: z.string().max(2000).optional().nullable(),
  paymentTerms: z.string().max(1000).optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientName: z.string().min(1, "Client name is required").max(180),
  clientEmail: z.string().max(180).optional().nullable(),
  clientAddress: z.string().max(500).optional().nullable(),
  clientTaxId: z.string().max(80).optional().nullable(),
  items: z.array(lineItemSchema).min(1, "Add at least one line item"),
});

export const clientSchema = z.object({
  name: z.string().min(1).max(180),
  email: z.string().max(180).optional().nullable(),
  phone: z.string().max(60).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  taxId: z.string().max(80).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const templateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  currency: z.string().min(1).max(8),
  taxRate: z.coerce.number().min(0).max(100),
  notes: z.string().max(2000).optional().nullable(),
  paymentTerms: z.string().max(1000).optional().nullable(),
  items: z.array(lineItemSchema),
});

export const employeeSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(180),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
  password: z.string().min(8).max(200).optional(),
  active: z.boolean().optional(),
});

export const companySchema = z.object({
  name: z.string().min(1).max(180),
  email: z.string().max(180).optional().nullable(),
  phone: z.string().max(60).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  taxId: z.string().max(80).optional().nullable(),
  invoicePrefix: z.string().max(20).optional(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
