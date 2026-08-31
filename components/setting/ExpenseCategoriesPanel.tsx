"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  createExpenseCategory,
  updateExpenseCategory,
  deactivateExpenseCategory,
} from "@/lib/expenses/categoryActions";
import {
  createExpenseSubCategory,
  updateExpenseSubCategory,
  deactivateExpenseSubCategory,
} from "@/lib/expenses/subCategoryActions";

export type Category = {
  id: string;
  name: string;
  isSalary: boolean;
  isProtected: boolean;
  isActive: boolean;
};

export type SubCategory = {
  id: string;
  categoryId: string;
  name: string;
  isActive: boolean;
  createdAt: string | Date;
};

type Props = {
  initialCategories: Category[];
  initialSubCategories: SubCategory[];
};

// Categories that never get subcategories. Salaries is flagged via
// isSalary; "Other" has no dedicated schema flag, so it's matched by
// name — safe to do since it's a seeded, isProtected category and can't
// be renamed.
function subcategoriesDisabledFor(cat: Category) {
  return cat.isSalary || cat.name.trim().toLowerCase() === "other";
}

const ExpenseCategoriesPanel = ({
  initialCategories,
  initialSubCategories,
}: Props) => {
  const [categories, setCategories] = useState(initialCategories);
  const [subCategories, setSubCategories] = useState(initialSubCategories);

  // Add-main-category state
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Rename-main-category state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editCategoryName, setEditCategoryName] = useState("");

  // Add-subcategory state
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  // Rename-subcategory state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [isPending, startTransition] = useTransition();

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories],
  );

  // Salaries and "Other" are managed elsewhere / never take subcategories,
  // so they don't need a card in this settings panel at all.
  const manageableCategories = useMemo(
    () => activeCategories.filter((c) => !subcategoriesDisabledFor(c)),
    [activeCategories],
  );

  const grouped = useMemo(() => {
    const map: Record<string, SubCategory[]> = {};
    for (const cat of activeCategories) map[cat.id] = [];
    for (const sc of subCategories) {
      if (!map[sc.categoryId]) map[sc.categoryId] = [];
      map[sc.categoryId].push(sc);
    }
    return map;
  }, [activeCategories, subCategories]);

  // ---------------- Main category handlers ----------------

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Enter a name first.");
      return;
    }

    startTransition(async () => {
      const result = await createExpenseCategory(
        { success: false, error: false },
        { name: newCategoryName.trim() },
      );

      if (result.success) {
        toast.success(result.message || "Category added.");
        setNewCategoryName("");
        setAddingCategory(false);
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to add category.");
      }
    });
  };

  const handleEditCategorySave = (id: string) => {
    if (!editCategoryName.trim()) {
      toast.error("Name can't be empty.");
      return;
    }

    startTransition(async () => {
      const result = await updateExpenseCategory(
        { success: false, error: false },
        { id, name: editCategoryName.trim() },
      );

      if (result.success) {
        toast.success(result.message || "Category updated.");
        setCategories((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, name: editCategoryName.trim() } : c,
          ),
        );
        setEditingCategoryId(null);
      } else {
        toast.error(result.message || "Failed to update category.");
      }
    });
  };

  const handleDeactivateCategory = (id: string) => {
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await deactivateExpenseCategory(
        { success: false, error: false },
        formData,
      );

      if (result.success) {
        toast.success(result.message || "Category removed.");
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: false } : c)),
        );
      } else {
        toast.error(result.message || "Failed to remove category.");
      }
    });
  };

  // ---------------- Subcategory handlers ----------------

  const handleAdd = (categoryId: string) => {
    if (!newName.trim()) {
      toast.error("Enter a name first.");
      return;
    }

    startTransition(async () => {
      const result = await createExpenseSubCategory(
        { success: false, error: false },
        { categoryId, name: newName.trim() },
      );

      if (result.success && result.subCategory) {
        setSubCategories((prev) => [...prev, result.subCategory!]);
        setNewName("");
        setAddingFor(null);
      } else if (result.success) {
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to add subcategory.");
      }
    });
  };

  const handleEditSave = (id: string, categoryId: string) => {
    if (!editName.trim()) {
      toast.error("Name can't be empty.");
      return;
    }

    startTransition(async () => {
      const result = await updateExpenseSubCategory(
        { success: false, error: false },
        { id, categoryId, name: editName.trim() },
      );

      if (result.success) {
        toast.success(result.message || "Subcategory updated.");
        setSubCategories((prev) =>
          prev.map((sc) =>
            sc.id === id ? { ...sc, name: editName.trim() } : sc,
          ),
        );
        setEditingId(null);
      } else {
        toast.error(result.message || "Failed to update subcategory.");
      }
    });
  };

  const handleDeactivate = (id: string) => {
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await deactivateExpenseSubCategory(
        { success: false, error: false },
        formData,
      );

      if (result.success) {
        toast.success(result.message || "Subcategory removed.");
        setSubCategories((prev) =>
          prev.map((sc) => (sc.id === id ? { ...sc, isActive: false } : sc)),
        );
      } else {
        toast.error(result.message || "Failed to remove subcategory.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Expense Categories
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Add categories and subcategories for expenses. Staff will pick from
            these when logging an expense. Salaries is a built-in category and
            can&apos;t be renamed or removed.
          </p>
        </div>
      </div>

      {/* Add main category */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        {addingCategory ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
                if (e.key === "Escape") {
                  setAddingCategory(false);
                  setNewCategoryName("");
                }
              }}
              placeholder="Category name (e.g. Software, Insurance)"
              className="flex-1 min-w-0 rounded-md ring-1 ring-slate-200 px-2.5 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={handleAddCategory}
              className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingCategory(false);
                setNewCategoryName("");
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCategory(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add main category
          </button>
        )}
      </div>

      {/* Categories + their subcategories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {manageableCategories.map((cat) => {
          const items = grouped[cat.id] ?? [];
          const activeItems = items.filter((i) => i.isActive);
          const isAdding = addingFor === cat.id;
          const isEditingThisCategory = editingCategoryId === cat.id;

          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                {isEditingThisCategory ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      autoFocus
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditCategorySave(cat.id);
                        if (e.key === "Escape") setEditingCategoryId(null);
                      }}
                      className="flex-1 min-w-0 rounded-md ring-1 ring-slate-200 px-2 py-1 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleEditCategorySave(cat.id)}
                      className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategoryId(null)}
                      className="text-slate-400 hover:text-slate-600"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {cat.name}
                    </h3>
                    {cat.isSalary && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-100">
                        Built-in
                      </span>
                    )}
                    {!cat.isProtected && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setEditCategoryName(cat.name);
                          }}
                          className="text-slate-400 hover:text-blue-600"
                          title="Rename category"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDeactivateCategory(cat.id)}
                          className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                          title="Remove category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!isEditingThisCategory && (
                  <span className="text-xs text-slate-400 shrink-0">
                    {activeItems.length}{" "}
                    {activeItems.length === 1 ? "subcategory" : "subcategories"}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {activeItems.length === 0 && !isAdding && (
                  <p className="text-xs text-slate-400 italic">
                    No subcategories yet.
                  </p>
                )}

                {activeItems.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    {editingId === sc.id ? (
                      <>
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleEditSave(sc.id, cat.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 min-w-0 rounded-md ring-1 ring-slate-200 px-2 py-1 text-sm"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleEditSave(sc.id, cat.id)}
                            className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-slate-400 hover:text-slate-600"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-slate-700 truncate">
                          {sc.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(sc.id);
                              setEditName(sc.name);
                            }}
                            className="text-slate-400 hover:text-blue-600"
                            title="Rename"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDeactivate(sc.id)}
                            className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {isAdding ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd(cat.id);
                      if (e.key === "Escape") {
                        setAddingFor(null);
                        setNewName("");
                      }
                    }}
                    placeholder="Subcategory name"
                    className="flex-1 min-w-0 rounded-md ring-1 ring-slate-200 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAdd(cat.id)}
                    className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingFor(null);
                      setNewName("");
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingFor(cat.id);
                    setNewName("");
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add subcategory
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpenseCategoriesPanel;
