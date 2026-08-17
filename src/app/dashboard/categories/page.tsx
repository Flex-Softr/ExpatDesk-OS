import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CategoriesManagement,
  type CategoryItem,
} from "@/components/dashboard/categories-management";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const rawCategories = await prisma.category.findMany({
    orderBy: { nameEn: "asc" },
    include: {
      _count: {
        select: { services: true },
      },
    },
  });

  const categories: CategoryItem[] = rawCategories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    nameEn: cat.nameEn,
    nameIt: cat.nameIt,
    createdAt: cat.createdAt.toISOString(),
    _count: {
      services: cat._count.services,
    },
  }));

  return <CategoriesManagement initialCategories={categories} user={user} />;
}
