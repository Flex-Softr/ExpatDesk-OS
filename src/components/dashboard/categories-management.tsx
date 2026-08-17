"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Briefcase,
  Globe2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface CategoryItem {
  id: string;
  slug: string;
  nameEn: string;
  nameIt: string;
  createdAt: string;
  _count?: {
    services: number;
  };
}

interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface CategoriesManagementProps {
  initialCategories: CategoryItem[];
  user: UserPayload;
}

export function CategoriesManagement({ initialCategories, user }: CategoriesManagementProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);

  // Form states
  const [formNameEn, setFormNameEn] = useState("");
  const [formNameIt, setFormNameIt] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [isAutoSlug, setIsAutoSlug] = useState(true);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isAdmin = user.role === "ADMIN";

  // Slugify utility
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameEnChange = (val: string) => {
    setFormNameEn(val);
    if (isAutoSlug) {
      setFormSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setFormSlug(val);
    setIsAutoSlug(false);
  };

  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const fetchCategories = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to refresh categories:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openAddDialog = () => {
    setFormNameEn("");
    setFormNameIt("");
    setFormSlug("");
    setIsAutoSlug(true);
    setErrorMessage(null);
    setIsAddOpen(true);
  };

  const openEditDialog = (category: CategoryItem) => {
    setSelectedCat(category);
    setFormNameEn(category.nameEn);
    setFormNameIt(category.nameIt);
    setFormSlug(category.slug);
    setIsAutoSlug(false);
    setErrorMessage(null);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (category: CategoryItem) => {
    setSelectedCat(category);
    setErrorMessage(null);
    setIsDeleteOpen(true);
  };

  // Submit Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formNameEn.trim() || !formNameIt.trim() || !formSlug.trim()) {
      setErrorMessage("All fields (English Name, Italian Name, and Slug) are required.");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formSlug)) {
      setErrorMessage("Slug must consist only of lowercase letters, numbers, and hyphens.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: formNameEn.trim(),
          nameIt: formNameIt.trim(),
          slug: formSlug.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      setSuccessMessage(`Category "${data.category.nameEn}" created successfully!`);
      setIsAddOpen(false);
      startTransition(() => {
        fetchCategories();
      });
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Category
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat) return;
    setErrorMessage(null);

    if (!formNameEn.trim() || !formNameIt.trim() || !formSlug.trim()) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formSlug)) {
      setErrorMessage("Slug must consist only of lowercase letters, numbers, and hyphens.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${selectedCat.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: formNameEn.trim(),
          nameIt: formNameIt.trim(),
          slug: formSlug.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update category");
      }

      setSuccessMessage(`Category updated successfully!`);
      setIsEditOpen(false);
      startTransition(() => {
        fetchCategories();
      });
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete Category
  const handleDeleteCategory = async () => {
    if (!selectedCat) return;
    setErrorMessage(null);

    if (selectedCat._count && selectedCat._count.services > 0) {
      setErrorMessage(
        `Cannot delete "${selectedCat.nameEn}" because it contains ${selectedCat._count.services} active service(s). Please move or delete those services first.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${selectedCat.slug}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      setSuccessMessage(`Category "${selectedCat.nameEn}" deleted.`);
      setIsDeleteOpen(false);
      startTransition(() => {
        fetchCategories();
      });
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    return (
      cat.nameEn.toLowerCase().includes(q) ||
      cat.nameIt.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q)
    );
  });

  const totalServices = categories.reduce((acc, cat) => acc + (cat._count?.services || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 text-xs text-blue-300"
            >
              ExpatDesk OS Module
            </Badge>
          </div>
          <h1 className="font-heading mt-1.5 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            <FolderTree className="h-7 w-7 text-blue-400" />
            Service Categories
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Organize relocation, visa, tax, and legal offerings into bilingual categories for the
            main portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            disabled={isRefreshing}
            className="gap-1.5 border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={openAddDialog}
              className="gap-1.5 bg-blue-600 font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </Button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-300 shadow-md">
          <div className="flex items-center gap-2.5 text-sm">
            <Check className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:bg-emerald-900/50 hover:text-white"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Total Categories
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-white">{categories.length}</div>
            <p className="mt-1 text-[11px] text-slate-400">Configured in system</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Total Linked Services
            </CardTitle>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-white">{totalServices}</div>
            <p className="mt-1 text-[11px] text-slate-400">Services across categories</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Localization
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Globe2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading flex items-center gap-2 text-xl font-bold text-emerald-400">
              EN / IT Ready
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Dual language catalog</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Categories Card */}
      <Card className="border-slate-800 bg-slate-900/80 shadow-lg">
        <CardHeader className="flex flex-col justify-between gap-4 border-b border-slate-800/60 pb-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-lg font-bold text-white">Categories List</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              View and manage service category slugs and bilingual labels.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search category name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-slate-800 bg-slate-950/60 pl-9 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-3 rounded-full bg-slate-800/50 p-4 text-slate-500">
                <FolderTree className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-white">No categories found</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                {searchQuery
                  ? `No category matching "${searchQuery}". Try clearing your search filter.`
                  : "Get started by adding your first service category."}
              </p>
              {isAdmin && !searchQuery && (
                <Button
                  size="sm"
                  onClick={openAddDialog}
                  className="mt-4 gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                >
                  <Plus className="h-4 w-4" />
                  Add First Category
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-slate-800 bg-slate-950/40">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Category Name (EN / IT)
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Slug
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Services
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Created
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat) => {
                  const serviceCount = cat._count?.services || 0;
                  const formattedDate = new Date(cat.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <TableRow
                      key={cat.id}
                      className="border-b border-slate-800/60 transition-colors hover:bg-slate-800/40"
                    >
                      {/* Name EN & IT */}
                      <TableCell className="py-4">
                        <div className="text-sm font-semibold text-slate-100">{cat.nameEn}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="rounded border border-indigo-500/20 bg-indigo-500/10 px-1 font-mono text-[10px] text-indigo-400">
                            IT
                          </span>
                          {cat.nameIt}
                        </div>
                      </TableCell>

                      {/* Slug */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="rounded border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-xs text-blue-400">
                            {cat.slug}
                          </code>
                          <button
                            onClick={() => handleCopySlug(cat.slug)}
                            title="Copy slug"
                            className="text-slate-500 transition-colors hover:text-slate-300"
                          >
                            {copiedSlug === cat.slug ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Services count */}
                      <TableCell>
                        <Link
                          href={`/dashboard/services?category=${cat.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
                        >
                          <Briefcase className="h-3 w-3" />
                          <span>
                            {serviceCount} service{serviceCount !== 1 ? "s" : ""}
                          </span>
                          <ExternalLink className="h-3 w-3 text-blue-400" />
                        </Link>
                      </TableCell>

                      {/* Created date */}
                      <TableCell className="font-mono text-xs text-slate-400">
                        {formattedDate}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEditDialog(cat)}
                                className="text-slate-400 hover:bg-blue-500/10 hover:text-blue-400"
                                title="Edit category"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openDeleteDialog(cat)}
                                className="text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                                title="Delete category"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">View only</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE CATEGORY DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl sm:max-w-md">
          <form onSubmit={handleCreateCategory}>
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
                <FolderTree className="h-5 w-5 text-blue-400" />
                Create Service Category
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Add a new category to group related relocation and visa services.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="my-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-nameEn" className="text-xs font-semibold text-slate-300">
                  English Category Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="add-nameEn"
                  type="text"
                  placeholder="e.g. Tax & Fiscal Registration"
                  value={formNameEn}
                  onChange={(e) => handleNameEnChange(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-nameIt" className="text-xs font-semibold text-slate-300">
                  Italian Category Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="add-nameIt"
                  type="text"
                  placeholder="e.g. Tasse e Codice Fiscale"
                  value={formNameIt}
                  onChange={(e) => setFormNameIt(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="add-slug" className="text-xs font-semibold text-slate-300">
                    Category Slug <span className="text-red-400">*</span>
                  </Label>
                  {isAutoSlug && (
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-400">
                      Auto-generating
                    </span>
                  )}
                </div>
                <Input
                  id="add-slug"
                  type="text"
                  placeholder="e.g. tax-fiscal-registration"
                  value={formSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                  required
                />
                <p className="text-[10px] text-slate-500">
                  Used in web URLs. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-800/60 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
                className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 bg-blue-600 text-xs font-medium text-white hover:bg-blue-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Category</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT CATEGORY DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl sm:max-w-md">
          <form onSubmit={handleEditCategory}>
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
                <Edit2 className="h-5 w-5 text-blue-400" />
                Edit Category
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Update category details and localization labels.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="my-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nameEn" className="text-xs font-semibold text-slate-300">
                  English Category Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="edit-nameEn"
                  type="text"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-xs text-slate-100 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-nameIt" className="text-xs font-semibold text-slate-300">
                  Italian Category Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="edit-nameIt"
                  type="text"
                  value={formNameIt}
                  onChange={(e) => setFormNameIt(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-xs text-slate-100 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-slug" className="text-xs font-semibold text-slate-300">
                  Category Slug <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="edit-slug"
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-800/60 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
                className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 bg-blue-600 text-xs font-medium text-white hover:bg-blue-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CATEGORY DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl sm:max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-400">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="my-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {selectedCat && (
            <div className="my-3 space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">English Name:</span>
                <span className="font-semibold text-slate-200">{selectedCat.nameEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Italian Name:</span>
                <span className="font-semibold text-slate-200">{selectedCat.nameIt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slug:</span>
                <span className="font-mono text-blue-400">{selectedCat.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Linked Services:</span>
                <span className="font-semibold text-amber-400">
                  {selectedCat._count?.services || 0} service(s)
                </span>
              </div>
            </div>
          )}

          {selectedCat && selectedCat._count && selectedCat._count.services > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>
                You cannot delete this category until all {selectedCat._count.services} service(s)
                are removed or assigned to another category.
              </span>
            </div>
          )}

          <DialogFooter className="border-t border-slate-800/60 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
              className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteCategory}
              disabled={isSubmitting || !!(selectedCat?._count && selectedCat._count.services > 0)}
              className="gap-1.5 bg-red-600 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Confirm Delete</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
