import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tags,
  Layers,
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { api } from "@/api/axios";
import { formatCurrency } from "@/lib/utils";
import { Product, Category, AddonGroup } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { AddonGroupFormDialog } from "@/components/addons/addon-group-form-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ProductsTab = "products" | "categories" | "addons";

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProductsTab>("products");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addonGroupFormOpen, setAddonGroupFormOpen] = useState(false);
  const [editingAddonGroup, setEditingAddonGroup] = useState<AddonGroup | null>(
    null,
  );

  useEffect(() => {
    const saved = window.localStorage.getItem("@fastsale:products_tab");
    if (saved === "products" || saved === "categories" || saved === "addons") {
      setTab(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("@fastsale:products_tab", tab);
  }, [tab]);

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const res = await api.get<Product[]>("/products", {
        params: { all: 1 },
      });
      return res.data;
    },
  });

  const productsError = isError
    ? ((error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Erro ao carregar produtos.")
    : null;

  const {
    data: categories = [],
    isError: isCategoriesError,
    error: categoriesErrorRaw,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<Category[]>("/categories");
      return res.data;
    },
  });

  const categoriesError = isCategoriesError
    ? ((categoriesErrorRaw as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Erro ao carregar categorias.")
    : null;

  const {
    data: addonGroups = [],
    isError: isAddonGroupsError,
    error: addonGroupsErrorRaw,
  } = useQuery<AddonGroup[]>({
    queryKey: ["addon-groups"],
    queryFn: async () => {
      const res = await api.get<AddonGroup[]>("/addon-groups");
      return res.data;
    },
  });

  const addonGroupsError = isAddonGroupsError
    ? ((addonGroupsErrorRaw as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Erro ao carregar grupos de adicionais.")
    : null;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      const msg = e.response?.data?.message ?? "Erro ao excluir produto.";
      if (e.response?.status === 409) {
        alert(msg);
      } else {
        alert(msg);
      }
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      const msg = e.response?.data?.message ?? "Erro ao excluir categoria.";
      alert(msg);
    },
  });

  const deleteAddonGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/addon-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addon-groups"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      alert(
        e.response?.data?.message ?? "Erro ao excluir grupo de adicionais.",
      );
    },
  });

  function handleOpenCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingProduct(null);
  }

  function handleOpenCreateCategory() {
    setEditingCategory(null);
    setCategoryFormOpen(true);
  }

  function handleOpenEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryFormOpen(true);
  }

  function handleCloseCategoryForm() {
    setCategoryFormOpen(false);
    setEditingCategory(null);
  }

  function handleOpenCreateAddonGroup() {
    setEditingAddonGroup(null);
    setAddonGroupFormOpen(true);
  }

  function handleOpenEditAddonGroup(group: AddonGroup) {
    setEditingAddonGroup(group);
    setAddonGroupFormOpen(true);
  }

  function handleCloseAddonGroupForm() {
    setAddonGroupFormOpen(false);
    setEditingAddonGroup(null);
  }

  function handleDelete(product: Product) {
    if (
      !window.confirm(
        `Excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(product.id);
  }

  function handleDeleteCategory(category: Category) {
    if (
      !window.confirm(
        `Excluir a categoria \"${category.name}\"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    deleteCategoryMutation.mutate(category.id);
  }

  function handleDeleteAddonGroup(group: AddonGroup) {
    if (
      !window.confirm(
        `Excluir o grupo \"${group.name}\"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    deleteAddonGroupMutation.mutate(group.id);
  }

  function handlePrimaryAction() {
    if (tab === "products") handleOpenCreate();
    if (tab === "categories") handleOpenCreateCategory();
    if (tab === "addons") handleOpenCreateAddonGroup();
  }

  const currentError =
    tab === "products"
      ? productsError
      : tab === "categories"
        ? categoriesError
        : addonGroupsError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie seu catálogo, categorias e complementos.
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={handlePrimaryAction}>
          <Plus className="h-4 w-4" />
          {tab === "products"
            ? "Novo produto"
            : tab === "categories"
              ? "Nova categoria"
              : "Novo grupo"}
        </Button>
      </div>

      {/* 3. Correção da estrutura do Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ProductsTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          {/* Removido o 'currentValue' que causa bugs de renderização */}
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="addons">Adicionais</TabsTrigger>
        </TabsList>

        {currentError && (
          <div className="mt-4 flex items-center gap-2 p-4 rounded-lg text-sm bg-destructive/15 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {currentError}
          </div>
        )}

        {/* 4. Ordem e visibilidade: Removido o 'currentValue' */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Conteúdo de Produtos aqui (seu loop map) */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tags className="h-4 w-4" /> Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>{/* Conteúdo de Categorias aqui */}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" /> Grupos de adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>{/* Conteúdo de Adicionais aqui */}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(open) => !open && handleCloseForm()}
        product={editingProduct}
        categories={categories}
        addonGroups={addonGroups}
      />

      <CategoryFormDialog
        open={categoryFormOpen}
        onOpenChange={(open) => !open && handleCloseCategoryForm()}
        category={editingCategory}
      />

      <AddonGroupFormDialog
        open={addonGroupFormOpen}
        onOpenChange={(open) => !open && handleCloseAddonGroupForm()}
        group={editingAddonGroup}
      />
    </div>
  );
}
