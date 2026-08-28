import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";
import { nowTimeInSalonTz, todayInSalonTz } from "./utils/timezone";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";

//Invoice Item Schema
export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  serviceId: z.string().min(1, { message: "Service is required!" }),
  employeeIds: z
    .array(z.string())
    .min(1, { message: "Assign at least one staff member!" })
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "The same staff member is assigned twice!",
    }),
  quantity: z.coerce
    .number()
    .int()
    .min(1, { message: "Quantity must be at least 1!" })
    .max(50, { message: "Quantity looks too high — check this!" }),

  customPrice: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : Number(val),
    z.number().min(0, "Price can't be negative").optional(),
  ),
});

//Invoice Schema
export const invoiceSchema = z
  .object({
    id: z.string().optional(),

    customerId: z.string().min(1, { message: "Customer is required!" }),

    appointmentId: z.string().optional(),

    items: z
      .array(invoiceItemSchema)
      .min(1, { message: "Add at least one service!" }),

    discountType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
    discountValue: z.coerce
      .number()
      .min(0, { message: "Discount can't be negative!" })
      .default(0),

    taxRate: z.coerce
      .number()
      .min(0, { message: "Tax rate can't be negative!" })
      .max(100, { message: "Tax rate can't exceed 100%!" })
      .default(0),

    notes: z.string().optional().or(z.literal("")),

    status: z.enum(["ISSUED", "CANCELLED"]).optional(),
    cancelReason: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      data.discountType !== "PERCENTAGE" ||
      (data.discountValue >= 0 && data.discountValue <= 100),
    {
      message: "Percentage discount must be between 0 and 100!",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) => data.status !== "CANCELLED" || !!data.cancelReason?.trim(),
    {
      message: "Please provide a reason for cancelling this invoice!",
      path: ["cancelReason"],
    },
  );

export type InvoiceFormInput = z.input<typeof invoiceSchema>;
export type InvoiceSchema = z.output<typeof invoiceSchema>;

const toTitleCase = (str: string) =>
  str
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_, sep, char) => sep + char.toUpperCase());

const trimAndLower = (val: unknown) =>
  typeof val === "string" ? val.trim().toLowerCase() : val;

const trimValue = (val: unknown) =>
  typeof val === "string" ? val.trim() : val;

export const employeeSchema = z.object({
  id: z.string().optional(),

  name: z
    .string()
    .trim()
    .min(3, "Employee name must be at least 3 characters long!")
    .max(50, "Name is too long")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    )
    .transform(toTitleCase),

  // Optional field — allow "" (not provided) OR a valid 10-digit local number.
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number can only contain digits")
    .regex(/^0\d{9}$/, "Enter a valid 10-digit phone number (e.g. 0501234567)"),

  // Optional field — allow "" OR a valid, lowercased email.
  email: z
    .preprocess(
      trimAndLower,
      z.union([z.literal(""), z.string().email("Enter a valid email address")]),
    )
    .optional(),

  // Optional field — title-cased when provided.
  address: z
    .preprocess(
      trimValue,
      z.union([
        z.literal(""),
        z.string().max(100, "Address is too long").transform(toTitleCase),
      ]),
    )
    .optional(),

  serviceIds: z
    .array(z.string())
    .min(1, "Select at least one service this employee can perform"),

  isActive: z.boolean().default(true),
});

export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type EmployeeFormInput = z.input<typeof employeeSchema>;

export const serviceSchema = z.object({
  id: z.string().optional(),

  name: z
    .string()
    .trim()
    .min(3, { message: "Service name must be at least 3 characters long!" })
    .max(100, { message: "Service name is too long!" })
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Service name can only contain letters, spaces, hyphens, and apostrophes",
    )
    .transform(toTitleCase),

  description: z
    .string()
    .max(500, { message: "Description is too long!" })
    .optional()
    .or(z.literal("")),

  duration: z.coerce
    .number()
    .int({ message: "Duration must be a whole number of minutes!" })
    .min(5, { message: "Duration must be at least 5 minutes!" })
    .max(600, {
      message: "Duration seems too long — check this!",
    }),

  price: z.coerce
    .number()
    .gt(0, { message: "Price must be greater than 0!" })
    .max(1000000, {
      message: "Price seems too high — check this!",
    }),

  isActive: z.boolean().default(true),
});

export type ServiceFormInput = z.input<typeof serviceSchema>;
export type ServiceSchema = z.output<typeof serviceSchema>;

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm, 24-hour
const MAX_APPOINTMENT_MINUTES = 5 * 60; // 5 hours

function minutesSinceMidnight(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export const appointmentServiceSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  employeeId: z.string().optional(),
});

export const appointmentSchema = z
  .object({
    id: z.string().optional(),
    customerId: z.string().min(1, "Customer is required"),
    date: z.string().min(1, "Date is required"), // "yyyy-mm-dd"
    startTime: z.string().regex(timeRegex, "Invalid start time"),
    endTime: z.string().regex(timeRegex, "Invalid end time"),
    status: z.nativeEnum(AppointmentStatus).default(AppointmentStatus.PENDING),
    services: z
      .array(appointmentServiceSchema)
      .min(1, "Add at least one service"),
    notes: z.string().optional(),
    cancelReason: z.string().optional(),
  })
  // Not in the past — compared against the salon's timezone, not the
  // server's, so this stays correct no matter where this code runs.
  .refine(
    (data) => {
      const today = todayInSalonTz();
      if (data.date < today) return false;
      if (data.date === today) {
        return data.startTime >= nowTimeInSalonTz();
      }
      return true;
    },
    { message: "Cannot book an appointment in the past", path: ["date"] },
  )
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine(
    (data) =>
      minutesSinceMidnight(data.endTime) -
        minutesSinceMidnight(data.startTime) <=
      MAX_APPOINTMENT_MINUTES,
    {
      message: "An appointment can't be longer than 5 hours",
      path: ["endTime"],
    },
  )
  .refine(
    (data) => {
      const ids = data.services.map((s) => s.serviceId).filter(Boolean);
      return new Set(ids).size === ids.length;
    },
    {
      message: "The same service can't be added twice in one appointment",
      path: ["services"],
    },
  )
  .refine(
    (data) =>
      data.status !== AppointmentStatus.CANCELLED ||
      !!data.cancelReason?.trim(),
    {
      message: "Please provide a cancellation reason",
      path: ["cancelReason"],
    },
  );

export type AppointmentFormInput = z.input<typeof appointmentSchema>;
export type AppointmentSchema = z.output<typeof appointmentSchema>;

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(50, "Username is too long"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

//customer schema
export const customerSchema = z.object({
  id: z.string().optional(),

  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name is too long")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    )
    .transform(toTitleCase), // <- normalize AFTER validating shape

  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number can only contain digits")
    .regex(/^0\d{9}$/, "Enter a valid 10-digit phone number (e.g. 0501234567)"),

  email: z
    .string()
    .trim()
    .toLowerCase() // <- normalize BEFORE validating format
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .max(50, "Address is too long")
    .optional()
    .or(z.literal("")),
  // .transform((value) => (value ? toTitleCase(value) : value)),
});

export type CustomerSchema = z.infer<typeof customerSchema>;
export type CustomerFormInput = z.input<typeof customerSchema>;

// Quick-create (used in CustomerCombobox) reuses the exact same rules, minus id
export const quickCustomerSchema = customerSchema.omit({ id: true });
export type QuickCustomerSchema = z.infer<typeof quickCustomerSchema>;

export const expenseSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    categoryId: z.string().min(1, "Category is required"),
    subCategoryId: z.string().optional(),

    isSalary: z.boolean().optional().default(false),

    amount: z.coerce.number().positive().optional(),
    method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "CREDIT"]),
    date: z.string().min(1, "Date is required"),
    notes: z.string().optional(),
    salaryEntries: z
      .array(
        z.object({
          employeeId: z.string().min(1),
          amount: z.coerce.number().positive(),
        }),
      )
      .optional(),
  })

  .refine(
    (data) => {
      const isNewSalary = !data.id && data.isSalary;
      if (!isNewSalary) return true;
      return (data.salaryEntries?.length ?? 0) > 0;
    },
    {
      message: "Add at least one employee and salary amount.",
      path: ["salaryEntries"],
    },
  )

  .refine(
    (data) => {
      const isNewSalary = !data.id && data.isSalary;
      if (isNewSalary) return true;
      return (data.amount ?? 0) > 0;
    },
    {
      message: "Amount must be greater than 0!",
      path: ["amount"],
    },
  )

  .refine(
    (data) => {
      if (!data.salaryEntries) return true;
      const employeeIds = data.salaryEntries.map((entry) => entry.employeeId);
      return new Set(employeeIds).size === employeeIds.length;
    },
    {
      message: "Each employee can only appear once in this salary batch.",
      path: ["salaryEntries"],
    },
  );

export type ExpenseFormInput = z.input<typeof expenseSchema>;
export type ExpenseSchema = z.output<typeof expenseSchema>;

export const expenseCategorySchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(60, "Category name is too long")
    .regex(
      /^[a-zA-Z0-9\s'&-]+$/,
      "Category name can only contain letters, numbers, spaces, hyphens, apostrophes, and &",
    )
    .transform(toTitleCase),
});
export type ExpenseCategorySchema = z.infer<typeof expenseCategorySchema>;
export type ExpenseCategoryFormInput = z.input<typeof expenseCategorySchema>;

export const expenseSubCategorySchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  name: z
    .string()
    .trim()
    .min(1, "Subcategory name is required")
    .max(60, "Subcategory name is too long")
    .regex(
      /^[a-zA-Z0-9\s'&-]+$/,
      "Subcategory name can only contain letters, numbers, spaces, hyphens, apostrophes, and &",
    )
    .transform(toTitleCase),
});
export type ExpenseSubCategorySchema = z.infer<typeof expenseSubCategorySchema>;
export type ExpenseSubCategoryFormInput = z.input<
  typeof expenseSubCategorySchema
>;
