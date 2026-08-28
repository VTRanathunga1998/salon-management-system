"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useActionState,
  useEffect,
  useState,
} from "react";
import { ReactNode } from "react";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";
import { deleteInvoice } from "@/lib/invoices/actions";
import { deleteCustomer } from "@/lib/customers/actions";
import { deleteEmployee } from "@/lib/employees/actions";
import { deleteService } from "@/lib/services/actions";
import { deleteAppointment } from "@/lib/appoinments/actions";
import { deleteExpense } from "@/lib/expenses/actions";

const deleteActionMap = {
  invoice: deleteInvoice,
  customer: deleteCustomer,
  employee: deleteEmployee,
  service: deleteService,
  appointment: deleteAppointment,
  expense: deleteExpense,
};

const InvoiceForm = dynamic(() => import("./forms/invoiceForm"), {
  loading: () => <h1>Loading...</h1>,
});

const CustomerForm = dynamic(() => import("./forms/customerForm"), {
  loading: () => <h1>Loading...</h1>,
});

const EmployeeForm = dynamic(() => import("./forms/employeeForm"), {
  loading: () => <h1>Loading...</h1>,
});

const ServiceForm = dynamic(() => import("./forms/serviceForm"), {
  loading: () => <h1>Loading...</h1>,
});

const AppointmentForm = dynamic(() => import("./forms/appointmentForm"), {
  loading: () => <h1>Loading...</h1>,
});

const ExpenseForm = dynamic(() => import("./forms/expenseForm"), {
  loading: () => <h1>Loading...</h1>,
});

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any,
  ) => ReactNode;
} = {
  invoice: (setOpen, type, data, relatedData) => (
    <InvoiceForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  customer: (setOpen, type, data, relatedData) => (
    <CustomerForm type={type} data={data} setOpen={setOpen} />
  ),
  employee: (setOpen, type, data, relatedData) => (
    <EmployeeForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  service: (setOpen, type, data, relatedData) => (
    <ServiceForm type={type} data={data} setOpen={setOpen} />
  ),
  appointment: (setOpen, type, data, relatedData) => (
    <AppointmentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  expense: (setOpen, type, data, relatedData) => (
    <ExpenseForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-[#FAE27C]"
      : type === "update"
        ? "bg-[#C3EBFA]"
        : type === "convert"
          ? "bg-[#FFDDBB]"
          : "bg-[#CFCEFF]";

  const [open, setOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const Form = () => {
    const [state, action, pending] = useActionState(deleteActionMap[table], {
      success: false,
      error: false,
      message: "",
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast.success(state.message || `${table} deleted.`);
        setOpen(false);
        router.refresh();
      } else if (state.error) {
        console.warn(`[delete ${table}]`, state.message);
        toast.error(state.message || `Failed to delete ${table}.`);
      }
    }, [state, router, setOpen]);

    return type === "delete" && id ? (
      <form action={action} className="flex flex-col items-center gap-6 p-2">
        <input type="hidden" name="id" defaultValue={id} />

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-base font-semibold text-gray-800">
            Delete {table}?
          </h2>
          <p className="text-sm text-gray-500 max-w-xs">
            This action cannot be undone. All data associated with this{" "}
            <span className="font-medium text-gray-700">{table}</span> will be
            permanently removed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition cursor-pointer"
          >
            {pending ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](setOpen, type, data, relatedData)
    ) : type === "convert" ? (
      forms[table](setOpen, "create", data, relatedData)
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      {type === "create" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="
            group
            inline-flex
            w-full
            sm:w-[auto]
            min-w-0
            lg:min-w-[320px]
            items-center
            justify-center
            gap-2
            px-4
            sm:px-5
            py-2.5
            rounded-xl
            bg-gradient-to-r
            from-[#C3EBFA]
            to-[#CFCEFF]
            text-gray-800
            text-sm
            font-semibold
            whitespace-nowrap
            shadow-sm
            ring-1
            ring-black/5
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:shadow-md
            hover:brightness-[1.02]
            active:translate-y-0
            active:shadow-sm
            cursor-pointer
          "
        >
          <span
            className="
              flex
              h-6
              w-6
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/70
              text-gray-700
              text-lg
              font-medium
              leading-none
              transition-transform
              duration-200
              group-hover:rotate-90
            "
          >
            +
          </span>

          <span>Create {table.charAt(0).toUpperCase() + table.slice(1)}</span>
        </button>
      ) : (
        <button
          type="button"
          className={`${size} flex items-center justify-center rounded-full ${bgColor} cursor-pointer`}
          onClick={() => setOpen(true)}
        >
          {type === "convert" ? (
            <Image src={`/convert.png`} alt="" height={16} width={16} />
          ) : (
            <Image src={`/${type}.png`} alt="" height={16} width={16} />
          )}
        </button>
      )}
      {open && (
        <div
          id="datepicker-portal"
          className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center"
        >
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[50%] max-h-[90vh] overflow-y-auto scrollbar-hidden">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => {
                setOpen(false);
                router.refresh();
              }}
            >
              <Image src="/close.png" alt="close" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
